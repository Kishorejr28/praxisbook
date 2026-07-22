import { Router } from "express";
import { z } from "zod";
import { createBooking, cancelBooking } from "../services/booking.service";

export const bookingRouter: import("express").Router = Router();

const bookingSchema = z.object({
  clinicId: z.string(),
  doctorId: z.string(),
  appointmentTypeId: z.string(),
  startTime: z.string().datetime(),
  patientFirstName: z.string().min(1),
  patientLastName: z.string().min(1),
  patientEmail: z.string().email(),
  patientPhone: z.string().min(6),
  patientDob: z.string().optional(),
  insuranceType: z.enum(["gkv", "pkv", "cash"]),
  insuranceProvider: z.string().optional(),
  notes: z.string().optional(),
  gdprConsent: z.boolean(),
  language: z.string().optional(),
});

bookingRouter.post("/", async (req, res, next) => {
  try {
    const data = bookingSchema.parse(req.body);
    const result = await createBooking(data);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

bookingRouter.get("/:confirmationCode", async (req, res, next) => {
  try {
    const { prisma } = await import("../lib/prisma");
    const appt = await prisma.appointment.findUnique({
      where: { confirmationCode: req.params.confirmationCode },
      include: { clinic: true, doctor: true, appointmentType: true },
    });
    if (!appt) return res.status(404).json({ error: "Appointment not found" });
    res.json(appt);
  } catch (err) {
    next(err);
  }
});

bookingRouter.post("/:confirmationCode/cancel", async (req, res, next) => {
  try {
    const { reason } = z.object({ reason: z.string().optional() }).parse(req.body);
    const appt = await cancelBooking(req.params.confirmationCode, reason);
    res.json(appt);
  } catch (err) {
    next(err);
  }
});
