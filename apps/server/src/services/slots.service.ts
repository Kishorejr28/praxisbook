import { addMinutes, format, parseISO, isWithinInterval, setHours, setMinutes } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { prisma } from "../lib/prisma";
import { isSlotLocked } from "../lib/redis";
import type { AvailableSlot } from "@praxisbook/types";

interface GetSlotsOptions {
  clinicId: string;
  doctorId?: string;
  appointmentTypeId: string;
  date: string; // ISO date e.g. "2025-11-15"
}

export async function getAvailableSlots(opts: GetSlotsOptions): Promise<AvailableSlot[]> {
  const { clinicId, appointmentTypeId, date } = opts;

  const clinic = await prisma.clinic.findUniqueOrThrow({ where: { id: clinicId } });
  const apptType = await prisma.appointmentType.findUniqueOrThrow({
    where: { id: appointmentTypeId },
  });

  const doctorsQuery = opts.doctorId
    ? prisma.doctor.findMany({ where: { id: opts.doctorId, clinicId, isActive: true }, include: { workingHours: { include: { breaks: true } }, blockedDates: true } })
    : prisma.doctor.findMany({ where: { clinicId, isActive: true }, include: { workingHours: { include: { breaks: true } }, blockedDates: true } });

  const doctors = await doctorsQuery;
  const slots: AvailableSlot[] = [];
  const tz = clinic.timezone;

  // Parse the requested date in clinic's timezone
  const [year, month, day] = date.split("-").map(Number);

  for (const doctor of doctors) {
    // Day of week in clinic timezone (0=Sun)
    const zonedDate = toZonedTime(new Date(year, month - 1, day), tz);
    const dayOfWeek = zonedDate.getDay();

    const wh = doctor.workingHours.find((w) => w.dayOfWeek === dayOfWeek);
    if (!wh) continue;

    // Check if date is blocked
    const isBlocked = doctor.blockedDates.some((b) => {
      if (b.date !== date) return false;
      return b.allDay;
    });
    if (isBlocked) continue;

    // Build slot start/end boundaries in UTC
    const [startH, startM] = wh.startTime.split(":").map(Number);
    const [endH, endM] = wh.endTime.split(":").map(Number);

    let workStart = fromZonedTime(
      setMinutes(setHours(new Date(year, month - 1, day), startH), startM),
      tz
    );
    const workEnd = fromZonedTime(
      setMinutes(setHours(new Date(year, month - 1, day), endH), endM),
      tz
    );

    const slotDuration = apptType.durationMinutes + apptType.bufferMinutes;

    // Fetch existing appointments for this doctor on this date
    const dayStart = fromZonedTime(new Date(year, month - 1, day, 0, 0, 0), tz);
    const dayEnd = fromZonedTime(new Date(year, month - 1, day, 23, 59, 59), tz);

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        doctorId: doctor.id,
        status: { in: ["pending", "confirmed"] },
        startTime: { gte: dayStart, lte: dayEnd },
      },
    });

    // Generate slots
    let cursor = workStart;
    while (addMinutes(cursor, apptType.durationMinutes) <= workEnd) {
      const slotEnd = addMinutes(cursor, slotDuration);

      // Skip if overlaps a break
      const inBreak = wh.breaks.some((b) => {
        const [bsh, bsm] = b.startTime.split(":").map(Number);
        const [beh, bem] = b.endTime.split(":").map(Number);
        const breakStart = fromZonedTime(
          setMinutes(setHours(new Date(year, month - 1, day), bsh), bsm),
          tz
        );
        const breakEnd = fromZonedTime(
          setMinutes(setHours(new Date(year, month - 1, day), beh), bem),
          tz
        );
        return cursor < breakEnd && slotEnd > breakStart;
      });
      if (inBreak) { cursor = addMinutes(cursor, 15); continue; }

      // Skip if overlaps existing appointment
      const occupied = existingAppointments.some((appt) => {
        return cursor < appt.endTime && slotEnd > appt.startTime;
      });
      if (occupied) { cursor = addMinutes(cursor, 15); continue; }

      // Skip if Redis-locked
      const locked = await isSlotLocked(doctor.id, cursor.toISOString());
      if (!locked) {
        slots.push({
          startTime: cursor.toISOString(),
          endTime: addMinutes(cursor, apptType.durationMinutes).toISOString(),
          doctorId: doctor.id,
          appointmentTypeId,
        });
      }

      cursor = addMinutes(cursor, slotDuration);
    }
  }

  // Sort by time
  return slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
}
