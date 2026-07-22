// Rule-based chat engine — no API key required
// Guided button-flow with optional free-text fallback

export type MessageRole = "user" | "bot";

export interface ChatMsg {
  role: MessageRole;
  text: string;
  buttons?: string[];   // quick-reply buttons to show after this message
  action?: ChatAction;  // special action to trigger
}

export type ChatAction =
  | "show_slots"
  | "show_booking_form"
  | "show_payment"
  | "done";

export interface BotReply {
  text: string;
  buttons?: string[];
  action?: ChatAction;
}

// Intent detection from button label OR free-text input
function detect(input: string): string {
  const t = input.toLowerCase();
  if (t.includes("termin") || t.includes("buchen") || t.includes("book") || t.includes("appointment")) return "book";
  if (t.includes("park")) return "parking";
  if (t.includes("versicher") || t.includes("kasse") || t.includes("insurance") || t.includes("gkv") || t.includes("pkv")) return "insurance";
  if (t.includes("öffnung") || t.includes("uhr") || t.includes("hour") || t.includes("open") || t.includes("zeit")) return "hours";
  if (t.includes("notfall") || t.includes("emergency") || t.includes("schmerz") || t.includes("pain")) return "emergency";
  if (t.includes("preis") || t.includes("kosten") || t.includes("price") || t.includes("cost") || t.includes("zahlen")) return "price";
  if (t.includes("adresse") || t.includes("address") || t.includes("wo ") || t.includes("where") || t.includes("lage")) return "location";
  if (t.includes("arzt") || t.includes("doctor") || t.includes("team") || t.includes("who")) return "team";
  if (t.includes("reinigung") || t.includes("cleaning") || t.includes("prophylaxe")) return "book_cleaning";
  if (t.includes("erstberatung") || t.includes("neu") || t.includes("new patient") || t.includes("first")) return "book_new";
  if (t.includes("nachsorge") || t.includes("kontroll") || t.includes("follow")) return "book_followup";
  return "unknown";
}

export function getRuleBasedReply(
  input: string,
  clinic: {
    name: string;
    address: string;
    city: string;
    phone: string;
    parkingInfo?: string;
    emergencyPhone?: string;
    acceptsGKV: boolean;
    acceptsPKV: boolean;
    acceptsCash: boolean;
    gkvProviders: string[];
    pkvProviders: string[];
  }
): BotReply {
  const intent = detect(input);

  switch (intent) {
    case "book":
      return {
        text: "Super! Für welche Behandlung möchten Sie einen Termin?",
        buttons: ["Reinigung & Kontrolle", "Erstberatung (Neupatienten)", "Schmerzbehandlung / Notfall", "Nachsorge / Kontrolltermin"],
      };

    case "book_cleaning":
    case "book_new":
    case "book_followup":
      return {
        text: "Bitte wählen Sie einen verfügbaren Termin:",
        action: "show_slots",
      };

    case "parking":
      return {
        text: `🅿️ ${clinic.parkingInfo ?? "Parkplätze direkt vor der Praxis vorhanden."}`,
        buttons: ["Termin buchen", "Öffnungszeiten", "Versicherung"],
      };

    case "insurance": {
      const lines: string[] = [];
      if (clinic.acceptsGKV) lines.push(`✅ Gesetzlich (GKV): ${clinic.gkvProviders.slice(0, 4).join(", ")} u.a.`);
      if (clinic.acceptsPKV) lines.push(`✅ Privat (PKV): ${clinic.pkvProviders.slice(0, 3).join(", ")} u.a.`);
      if (clinic.acceptsCash) lines.push("✅ Selbstzahler / Privatrechnung");
      return {
        text: lines.join("\n"),
        buttons: ["Termin buchen", "Öffnungszeiten", "Parkplätze"],
      };
    }

    case "hours":
      return {
        text: "🕐 Öffnungszeiten:\nMo – Fr: 08:00 – 18:00 Uhr\nSa – So: Geschlossen",
        buttons: ["Termin buchen", "Versicherung", "Parkplätze"],
      };

    case "emergency":
      return {
        text: `🚨 Bei einem Zahnnotfall rufen Sie uns bitte sofort an:\n📞 ${clinic.emergencyPhone ?? clinic.phone}\n\nBei starken Schmerzen helfen wir Ihnen so schnell wie möglich.`,
        buttons: ["Notfall-Termin buchen"],
      };

    case "price":
      return {
        text: "💶 Unsere Behandlungskosten richten sich nach der GOZ/BEMA. GKV-Patienten zahlen gesetzlich festgelegte Eigenanteile. Für eine genaue Kostenauskunft kontaktieren Sie uns bitte direkt.",
        buttons: ["Termin buchen", "Versicherung"],
      };

    case "location":
      return {
        text: `📍 Sie finden uns hier:\n${clinic.address}\n${clinic.city}\n\nGute Anbindung mit Bus und Bahn.`,
        buttons: ["Termin buchen", "Parkplätze"],
      };

    case "team":
      return {
        text: "👨‍⚕️ Unser erfahrenes Praxisteam freut sich auf Sie. Auf unserer Praxis-Seite finden Sie alle Informationen zu unseren Ärzten.",
        buttons: ["Termin buchen", "Öffnungszeiten"],
      };

    default:
      return {
        text: "Ich helfe Ihnen gerne! Was kann ich für Sie tun?",
        buttons: ["Termin buchen", "Versicherung", "Öffnungszeiten", "Parkplätze", "Notfall"],
      };
  }
}

export const GREETING: BotReply = {
  text: "Hallo! 👋 Ich bin Ihr digitaler Rezeptionist. Wie kann ich Ihnen helfen?",
  buttons: ["Termin buchen", "Versicherung", "Öffnungszeiten", "Parkplätze", "Notfall"],
};
