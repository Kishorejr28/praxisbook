import { prisma } from "../lib/prisma";
import { lockSlot, unlockSlot } from "../lib/redis";
import { addMinutes } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { sendBookingConfirmation, sendCancellationEmail } from "./email.service";
import { AppError } from "../middleware/errorHandler";
import type { BookingRequest } from "@praxisbook/types";

export async function createBooking(req: BookingRequest) {
  const { clinicId, doctorId, appointmentTypeId, startTime, gdprConsent } = req;

  if (!gdprConsent) throw new AppError(400, "GDPR consent is required");

  const apptType = await prisma.appointmentType.findFirst({
    where: { id: appointmentTypeId, clinicId, isActive: true },
  });
  if (!apptType) throw new AppError(404, "Appointment type not found");

  const doctor = await prisma.doctor.findFirst({
    where: { id: doctorId, clinicId, isActive: true },
  });
  if (!doctor) throw new AppError(404, "Doctor not found");

  const start = new Date(startTime);
  const end = addMinutes(start, apptType.durationMinutes);

  // Atomic slot lock — prevents double-booking under concurrent requests
  const locked = await lockSlot(doctorId, startTime, 30);
  if (!locked) throw new AppError(409, "This slot is no longer available");

  // Double-check in DB while we hold the lock
  const conflict = await prisma.appointment.findFirst({
    where: {
      doctorId,
      status: { in: ["pending", "confirmed"] },
      OR: [
        { startTime: { lt: end }, endTime: { gt: start } },
      ],
    },
  });
  if (conflict) {
    await unlockSlot(doctorId, startTime);
    throw new AppError(409, "This slot is no longer available");
  }

  // Upsert patient record
  const patient = await prisma.patient.upsert({
    where: { clinicId_email: { clinicId, email: req.patientEmail } },
    update: { firstName: req.patientFirstName, lastName: req.patientLastName, phone: req.patientPhone },
    create: {
      clinicId,
      firstName: req.patientFirstName,
      lastName: req.patientLastName,
      email: req.patientEmail,
      phone: req.patientPhone,
      dob: req.patientDob,
      insuranceType: req.insuranceType,
      insuranceProvider: req.insuranceProvider,
      preferredLanguage: req.language ?? "de",
      gdprConsentAt: new Date(),
    },
  });

  const confirmationCode = uuidv4().split("-")[0].toUpperCase();

  const appointment = await prisma.appointment.create({
    data: {
      clinicId,
      doctorId,
      appointmentTypeId,
      patientId: patient.id,
      patientFirstName: req.patientFirstName,
      patientLastName: req.patientLastName,
      patientEmail: req.patientEmail,
      patientPhone: req.patientPhone,
      patientDob: req.patientDob,
      insuranceType: req.insuranceType,
      insuranceProvider: req.insuranceProvider,
      notes: req.notes,
      status: "confirmed",
      startTime: start,
      endTime: end,
      bookingSource: "widget",
      confirmationCode,
    },
    include: { clinic: true, doctor: true, appointmentType: true },
  });

  // Release Redis lock — slot is now DB-confirmed
  await unlockSlot(doctorId, startTime);

  // Fire confirmation email (non-blocking)
  sendBookingConfirmation(appointment).catch(console.error);

  return { appointment, confirmationCode };
}

export async function cancelBooking(confirmationCode: string, reason?: string) {
  const appt = await prisma.appointment.findUnique({
    where: { confirmationCode },
    include: { clinic: true, appointmentType: true },
  });
  if (!appt) throw new AppError(404, "Appointment not found");
  if (appt.status === "cancelled") throw new AppError(400, "Already cancelled");

  const updated = await prisma.appointment.update({
    where: { id: appt.id },
    data: { status: "cancelled", cancelledAt: new Date(), cancellationReason: reason },
    include: { clinic: true, doctor: true, appointmentType: true },
  });

  sendCancellationEmail(updated).catch(console.error);
  return updated;
}
