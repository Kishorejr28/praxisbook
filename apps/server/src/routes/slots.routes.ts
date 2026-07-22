import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { getAvailableSlots } from "../services/slots.service";

export const slotsRouter: import("express").Router = Router();

const query = z.object({
  clinicId: z.string(),
  appointmentTypeId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  doctorId: z.string().optional(),
});

slotsRouter.get("/", async (req, res, next) => {
  try {
    const params = query.parse(req.query);
    const slots = await getAvailableSlots(params);
    res.json(slots);
  } catch (err) {
    next(err);
  }
});
