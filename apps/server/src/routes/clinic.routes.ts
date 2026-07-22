import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";

export const clinicRouter: import("express").Router = Router();

clinicRouter.get("/:slug", async (req, res, next) => {
  try {
    const clinic = await prisma.clinic.findUnique({
      where: { slug: req.params.slug },
      include: { faqItems: { orderBy: { sortOrder: "asc" } } },
    });
    if (!clinic) return res.status(404).json({ error: "Clinic not found" });

    // Never expose internal IDs in the public endpoint
    const { id, ...rest } = clinic;
    res.json({ ...rest, id });
  } catch (err) {
    next(err);
  }
});

clinicRouter.get("/:slug/appointment-types", async (req, res, next) => {
  try {
    const clinic = await prisma.clinic.findUnique({ where: { slug: req.params.slug } });
    if (!clinic) return res.status(404).json({ error: "Clinic not found" });

    const types = await prisma.appointmentType.findMany({
      where: { clinicId: clinic.id, isActive: true },
      orderBy: { isEmergency: "asc" },
    });
    res.json(types);
  } catch (err) {
    next(err);
  }
});

clinicRouter.get("/:slug/doctors", async (req, res, next) => {
  try {
    const clinic = await prisma.clinic.findUnique({ where: { slug: req.params.slug } });
    if (!clinic) return res.status(404).json({ error: "Clinic not found" });

    const doctors = await prisma.doctor.findMany({
      where: { clinicId: clinic.id, isActive: true },
      select: { id: true, firstName: true, lastName: true, title: true, specialty: true, avatarUrl: true, languages: true },
    });
    res.json(doctors);
  } catch (err) {
    next(err);
  }
});
