import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { startOfDay, endOfDay, subDays } from "date-fns";

export const adminRouter: import("express").Router = Router();

// GET /admin/:clinicId/dashboard?date=2025-11-15
adminRouter.get("/:clinicId/dashboard", async (req, res, next) => {
  try {
    const date = (req.query.date as string) ?? new Date().toISOString().split("T")[0];
    const [year, month, day] = date.split("-").map(Number);
    const dayStart = new Date(year, month - 1, day, 0, 0, 0);
    const dayEnd = new Date(year, month - 1, day, 23, 59, 59);

    const [total, confirmed, cancelled, noShows, widgetBookings] = await Promise.all([
      prisma.appointment.count({ where: { clinicId: req.params.clinicId, startTime: { gte: dayStart, lte: dayEnd } } }),
      prisma.appointment.count({ where: { clinicId: req.params.clinicId, status: "confirmed", startTime: { gte: dayStart, lte: dayEnd } } }),
      prisma.appointment.count({ where: { clinicId: req.params.clinicId, status: "cancelled", startTime: { gte: dayStart, lte: dayEnd } } }),
      prisma.appointment.count({ where: { clinicId: req.params.clinicId, status: "no_show", startTime: { gte: dayStart, lte: dayEnd } } }),
      prisma.appointment.count({ where: { clinicId: req.params.clinicId, bookingSource: "widget", startTime: { gte: dayStart, lte: dayEnd } } }),
    ]);

    // Rough AI hours-saved estimate: each widget booking ≈ 3-minute call deflected
    const estimatedHoursSaved = Math.round((widgetBookings * 3) / 60 * 10) / 10;

    res.json({
      date,
      totalAppointments: total,
      confirmedAppointments: confirmed,
      cancelledAppointments: cancelled,
      noShows,
      noShowRate: total > 0 ? Math.round((noShows / total) * 100) / 100 : 0,
      estimatedHoursSaved,
      bookingsFromWidget: widgetBookings,
      bookingsFromPhone: total - widgetBookings,
    });
  } catch (err) {
    next(err);
  }
});

// GET /admin/:clinicId/appointments?date=2025-11-15
adminRouter.get("/:clinicId/appointments", async (req, res, next) => {
  try {
    const date = (req.query.date as string) ?? new Date().toISOString().split("T")[0];
    const [year, month, day] = date.split("-").map(Number);
    const dayStart = new Date(year, month - 1, day, 0, 0, 0);
    const dayEnd = new Date(year, month - 1, day, 23, 59, 59);

    const appointments = await prisma.appointment.findMany({
      where: { clinicId: req.params.clinicId, startTime: { gte: dayStart, lte: dayEnd } },
      include: { doctor: true, appointmentType: true },
      orderBy: { startTime: "asc" },
    });
    res.json(appointments);
  } catch (err) {
    next(err);
  }
});

// PATCH /admin/:clinicId/appointments/:id — update status or reschedule
adminRouter.patch("/:clinicId/appointments/:id", async (req, res, next) => {
  try {
    const schema = z.object({
      status: z.enum(["confirmed", "cancelled", "no_show", "completed"]).optional(),
      startTime: z.string().datetime().optional(),
      notes: z.string().optional(),
      cancellationReason: z.string().optional(),
    });
    const data = schema.parse(req.body);

    const appt = await prisma.appointment.findFirst({
      where: { id: req.params.id, clinicId: req.params.clinicId },
    });
    if (!appt) return res.status(404).json({ error: "Appointment not found" });

    const updated: Record<string, unknown> = { ...data };
    if (data.status === "cancelled") updated.cancelledAt = new Date();
    if (data.startTime) {
      const apptType = await prisma.appointmentType.findUnique({ where: { id: appt.appointmentTypeId } });
      if (apptType) {
        const { addMinutes } = await import("date-fns");
        updated.endTime = addMinutes(new Date(data.startTime), apptType.durationMinutes);
      }
    }

    const result = await prisma.appointment.update({
      where: { id: req.params.id },
      data: updated,
      include: { doctor: true, appointmentType: true },
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /admin/:clinicId/patients
adminRouter.get("/:clinicId/patients", async (req, res, next) => {
  try {
    const search = req.query.search as string | undefined;
    const patients = await prisma.patient.findMany({
      where: {
        clinicId: req.params.clinicId,
        ...(search ? { OR: [{ firstName: { contains: search, mode: "insensitive" } }, { lastName: { contains: search, mode: "insensitive" } }, { email: { contains: search, mode: "insensitive" } }] } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json(patients);
  } catch (err) {
    next(err);
  }
});
