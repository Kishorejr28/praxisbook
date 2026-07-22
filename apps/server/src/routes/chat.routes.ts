import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { chat } from "../services/ai.service";

export const chatRouter: import("express").Router = Router();

const schema = z.object({
  clinicSlug: z.string(),
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })),
  language: z.string().optional(),
});

chatRouter.post("/", async (req, res, next) => {
  try {
    const { clinicSlug, messages, language } = schema.parse(req.body);

    const clinic = await prisma.clinic.findUnique({ where: { slug: clinicSlug } });
    if (!clinic) return res.status(404).json({ error: "Clinic not found" });

    const result = await chat(clinic.id, messages, language ?? "de");
    res.json(result);
  } catch (err) {
    next(err);
  }
});
