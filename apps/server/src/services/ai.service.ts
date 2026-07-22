import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "../lib/prisma";
import { getAvailableSlots } from "./slots.service";
import type { ChatMessage, ChatIntent } from "@praxisbook/types";

// Use whichever key is configured — prefer OpenAI, fall back to Anthropic
const useOpenAI = !!process.env.OPENAI_API_KEY;
const openai = useOpenAI ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const anthropic = !useOpenAI ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null;

const tools: OpenAI.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "getClinicInfo",
      description: "Get clinic details: opening hours, insurance, parking, location, emergency contact",
      parameters: { type: "object", properties: { field: { type: "string", enum: ["hours", "insurance", "parking", "location", "emergency", "languages"] } }, required: ["field"] },
    },
  },
  {
    type: "function",
    function: {
      name: "checkAvailability",
      description: "Check available appointment slots for a given date and appointment type",
      parameters: {
        type: "object",
        properties: {
          date: { type: "string", description: "ISO date e.g. 2025-11-15" },
          appointmentTypeId: { type: "string", description: "ID of the appointment type" },
        },
        required: ["date", "appointmentTypeId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getAppointmentTypes",
      description: "List available appointment types at this clinic",
      parameters: { type: "object", properties: {} },
    },
  },
];

async function handleToolCall(
  toolName: string,
  args: Record<string, string>,
  clinicId: string
): Promise<string> {
  const clinic = await prisma.clinic.findUniqueOrThrow({ where: { id: clinicId } });

  if (toolName === "getClinicInfo") {
    const { field } = args;
    if (field === "hours") return `Öffnungszeiten: Mo–Fr 08:00–18:00 Uhr.`;
    if (field === "insurance") {
      const gkv = clinic.acceptsGKV ? `GKV (${clinic.gkvProviders.join(", ")})` : "";
      const pkv = clinic.acceptsPKV ? `PKV (${clinic.pkvProviders.join(", ")})` : "";
      const cash = clinic.acceptsCash ? "Selbstzahler" : "";
      return `Wir akzeptieren: ${[gkv, pkv, cash].filter(Boolean).join("; ")}.${clinic.insuranceNotes ? " " + clinic.insuranceNotes : ""}`;
    }
    if (field === "parking") return clinic.parkingInfo ?? "Keine Parkinformationen verfügbar.";
    if (field === "location") return `${clinic.address}, ${clinic.postalCode} ${clinic.city}`;
    if (field === "emergency") return clinic.emergencyPhone ? `Notfall: ${clinic.emergencyPhone}` : "Bei Notfällen rufen Sie bitte die Praxis an.";
    if (field === "languages") return `Wir sprechen: ${clinic.languages.join(", ")}.`;
    return "Keine Informationen gefunden.";
  }

  if (toolName === "getAppointmentTypes") {
    const types = await prisma.appointmentType.findMany({ where: { clinicId, isActive: true } });
    return JSON.stringify(types.map((t) => ({ id: t.id, name: t.nameDe, duration: `${t.durationMinutes} Min.` })));
  }

  if (toolName === "checkAvailability") {
    const { date, appointmentTypeId } = args;
    const slots = await getAvailableSlots({ clinicId, appointmentTypeId, date });
    if (slots.length === 0) return `Leider keine freien Termine am ${date}.`;
    const times = slots.slice(0, 6).map((s) => new Date(s.startTime).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" }));
    return `Verfügbare Zeiten am ${date}: ${times.join(", ")} Uhr. (und mehr)`;
  }

  return "Unbekannte Funktion.";
}

export async function chat(
  clinicId: string,
  messages: ChatMessage[],
  language = "de"
): Promise<{ message: string; intent?: ChatIntent; suggestBooking?: boolean }> {
  const clinic = await prisma.clinic.findUniqueOrThrow({ where: { id: clinicId } });
  const faqItems = await prisma.faqItem.findMany({ where: { clinicId, language } });

  const faqContext = faqItems
    .map((f) => `Q: ${f.question}\nA: ${f.answer}`)
    .join("\n\n");

  const systemPrompt = `Du bist ein freundlicher KI-Rezeptionist für "${clinic.name}" in ${clinic.city}, Deutschland.
Du hilfst Patienten mit Terminbuchungen und beantwortest allgemeine Fragen zur Praxis.
Antworte ${language === "de" ? "auf Deutsch" : "in English"}, kurz und freundlich.
Benutze die Tools, um aktuelle Informationen zu erhalten.

Praxis-FAQ:
${faqContext}

Wenn ein Patient einen Termin buchen möchte, frage nach:
1. Welche Art von Behandlung?
2. Bevorzugtes Datum?
Dann nutze checkAvailability und zeige die Zeiten.
Weise den Patienten zum Buchungsformular weiter, sobald er einen Slot auswählt.`;

  if (useOpenAI && openai) {
    const apiMessages: OpenAI.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    ];

    let response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: apiMessages,
      tools,
      tool_choice: "auto",
    });

    // Agentic tool-call loop (max 3 rounds)
    for (let i = 0; i < 3; i++) {
      const choice = response.choices[0];
      if (choice.finish_reason !== "tool_calls") break;

      const toolCalls = choice.message.tool_calls ?? [];
      apiMessages.push(choice.message);

      for (const tc of toolCalls) {
        const result = await handleToolCall(tc.function.name, JSON.parse(tc.function.arguments), clinicId);
        apiMessages.push({ role: "tool", tool_call_id: tc.id, content: result });
      }

      response = await openai.chat.completions.create({ model: "gpt-4o", messages: apiMessages, tools, tool_choice: "auto" });
    }

    const content = response.choices[0].message.content ?? "";
    const suggestBooking = content.toLowerCase().includes("buchungsformular") || content.toLowerCase().includes("booking form");
    return { message: content, suggestBooking };
  }

  // Anthropic fallback
  if (anthropic) {
    const result = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    });
    const content = result.content[0].type === "text" ? result.content[0].text : "";
    return { message: content };
  }

  return { message: "KI-Dienst nicht konfiguriert." };
}
