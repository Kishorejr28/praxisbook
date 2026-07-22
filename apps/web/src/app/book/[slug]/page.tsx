"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { SlotPicker } from "@/components/booking/SlotPicker";
import { BookingForm } from "@/components/booking/BookingForm";
import { RuleBasedChat } from "@/components/chat/RuleBasedChat";
import { PraxisBookBadge } from "@/components/ui/PraxisBookBadge";
import { formatDateTime } from "@/lib/utils";
import { CheckCircle, Calendar, ChevronRight, Globe } from "lucide-react";

interface Props { params: { slug: string } }
type Step = "type" | "slot" | "form" | "done";

const I18N = {
  de: {
    back: "← Zur Praxis-Seite",
    steps: ["Behandlung", "Termin wählen", "Ihre Daten", "Bestätigung"],
    pickType: "Welche Behandlung benötigen Sie?",
    changeType: "← Behandlung ändern",
    booked: "Termin gebucht! ✓",
    confirmEmail: "Eine Bestätigungsmail wurde an",
    emailSuffix: "gesendet.",
    date: "Datum",
    treatment: "Behandlung",
    practice: "Praxis",
    code: "Bestätigungscode",
    cancel: "Termin absagen",
    insured: "Abrechnung über Ihre Krankenversicherung (GKV/PKV) — keine Vorauszahlung erforderlich.",
  },
  en: {
    back: "← Back to Practice",
    steps: ["Treatment", "Choose Time", "Your Details", "Confirmation"],
    pickType: "Which treatment do you need?",
    changeType: "← Change treatment",
    booked: "Appointment booked! ✓",
    confirmEmail: "A confirmation email was sent to",
    emailSuffix: ".",
    date: "Date",
    treatment: "Treatment",
    practice: "Practice",
    code: "Confirmation code",
    cancel: "Cancel appointment",
    insured: "Billed directly to your health insurance (GKV/PKV) — no upfront payment required.",
  },
};

export default function BookingPage({ params }: Props) {
  const { slug } = params;
  const [clinic, setClinic] = useState<any>(null);
  const [apptTypes, setApptTypes] = useState<any[]>([]);
  const [step, setStep] = useState<Step>("type");
  const [selectedType, setSelectedType] = useState<any>(null);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [lang, setLang] = useState<"de" | "en">("de");

  const t = I18N[lang];

  useEffect(() => {
    Promise.all([api.clinic.get(slug), api.clinic.appointmentTypes(slug)])
      .then(([c, a]) => { setClinic(c); setApptTypes(a); })
      .catch(console.error);
  }, [slug]);

  function handleChatBooking(hint?: string) {
    if (hint) {
      const lower = hint.toLowerCase();
      const matched = apptTypes.find((tp) =>
        tp.nameDe.toLowerCase().includes(lower.split(" ")[0]) ||
        (lower.includes("notfall") && tp.isEmergency)
      );
      if (matched) { setSelectedType(matched); setStep("slot"); return; }
    }
    setStep("type");
  }

  if (!clinic) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-white">
      <div className="w-9 h-9 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const color = clinic.primaryColor ?? "#2563eb";
  const STEP_IDS: Step[] = ["type", "slot", "form", "done"];
  const curIdx = STEP_IDS.indexOf(step);

  const typeName = (tp: any) => lang === "en" ? tp.name : tp.nameDe;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white py-10 px-4" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      <div className="max-w-lg mx-auto">

        {/* Top nav */}
        <div className="flex items-center justify-between mb-6">
          <a href={`/klinik/${slug}`} className="text-sm text-blue-600 hover:underline">{t.back}</a>
          {/* Language toggle */}
          <button
            onClick={() => setLang(l => l === "de" ? "en" : "de")}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded-full px-3 py-1.5 transition-colors"
          >
            <Globe className="w-3.5 h-3.5" />
            {lang === "de" ? "English" : "Deutsch"}
          </button>
        </div>

        {/* Clinic header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{clinic.name}</h1>
          <p className="text-gray-400 text-sm mt-1">{clinic.address}, {clinic.city}</p>
        </div>

        {/* Progress stepper */}
        <div className="mb-8">
          <div className="flex items-center">
            {t.steps.map((label, i) => {
              const done = i < curIdx;
              const active = i === curIdx;
              return (
                <div key={label} className="flex items-center flex-1 last:flex-none">
                  {/* Step node */}
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                      transition-all duration-300 shadow-sm
                      ${done ? "bg-green-500 text-white"
                        : active ? "text-white ring-4 ring-offset-1"
                        : "bg-gray-100 text-gray-400"}
                    `}
                      style={active ? { backgroundColor: color, ringColor: color + "33" } : {}}
                    >
                      {done ? (
                        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <span>{i + 1}</span>
                      )}
                    </div>
                    <span className={`text-[11px] font-medium whitespace-nowrap transition-colors ${
                      active ? "text-gray-800" : done ? "text-green-600" : "text-gray-400"
                    }`}>
                      {label}
                    </span>
                  </div>
                  {/* Connector line — not after last step */}
                  {i < t.steps.length - 1 && (
                    <div className="flex-1 h-[2px] mx-2 rounded-full overflow-hidden bg-gray-100 mb-5">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: done ? "100%" : active ? "50%" : "0%",
                          backgroundColor: done ? "#22c55e" : color,
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

          {/* Step 1 — Treatment */}
          {step === "type" && (
            <div className="space-y-2.5">
              <h2 className="font-semibold text-gray-800 mb-4">{t.pickType}</h2>
              {apptTypes.map((tp) => (
                <button key={tp.id}
                  onClick={() => { setSelectedType(tp); setStep("slot"); }}
                  className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50/60 transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: tp.color }} />
                    <div>
                      <p className="font-medium text-sm group-hover:text-blue-700 transition-colors">{typeName(tp)}</p>
                      <p className="text-xs text-gray-400 mt-0.5">ca. {tp.durationMinutes} min</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {tp.isEmergency && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Notfall</span>}
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                  </div>
                </button>
              ))}
              {/* Insurance note */}
              <div className="mt-4 flex items-start gap-2 bg-green-50 border border-green-100 rounded-lg p-3">
                <span className="text-green-600 mt-0.5 flex-shrink-0">✓</span>
                <p className="text-xs text-green-700">{t.insured}</p>
              </div>
            </div>
          )}

          {/* Step 2 — Slot picker */}
          {step === "slot" && selectedType && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedType.color }} />
                <h2 className="font-semibold text-gray-800">{typeName(selectedType)}</h2>
                <span className="text-xs text-gray-400 ml-auto">ca. {selectedType.durationMinutes} min</span>
              </div>
              <SlotPicker
                clinicId={clinic.id}
                appointmentTypeId={selectedType.id}
                onSelect={(slot) => { setSelectedSlot(slot); setStep("form"); }}
              />
              <button onClick={() => setStep("type")} className="mt-4 text-sm text-gray-400 hover:text-gray-600 transition-colors">
                {t.changeType}
              </button>
            </div>
          )}

          {/* Step 3 — Patient form */}
          {step === "form" && selectedSlot && (
            <div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-5 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span className="text-sm font-semibold text-blue-700">{formatDateTime(selectedSlot.startTime)}</span>
              </div>
              <BookingForm
                clinicId={clinic.id}
                slot={selectedSlot}
                appointmentTypeId={selectedType.id}
                onSuccess={(res) => { setResult(res); setStep("done"); }}
                onBack={() => setStep("slot")}
                lang={lang}
              />
            </div>
          )}

          {/* Step 4 — Done */}
          {step === "done" && result && (
            <div className="text-center space-y-5 py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-9 h-9 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{t.booked}</h2>
                <p className="text-gray-500 text-sm mt-1">
                  {t.confirmEmail} <strong>{result.appointment?.patientEmail}</strong> {t.emailSuffix}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2.5 text-sm border border-gray-100">
                <Row label={t.date} value={formatDateTime(result.appointment?.startTime)} bold />
                <Row label={t.treatment} value={typeName(selectedType)} />
                <Row label={t.practice} value={clinic.name} />
                <Row label={t.code} value={result.confirmationCode} mono />
              </div>
              <a href={`/cancel/${result.confirmationCode}`} className="block text-xs text-red-400 hover:text-red-600 transition-colors">
                {t.cancel}
              </a>
            </div>
          )}
        </div>
      </div>

      <RuleBasedChat clinic={clinic} primaryColor={color} onBookingRequested={handleChatBooking} />
      <PraxisBookBadge demo />
    </div>
  );
}

function Row({ label, value, bold, mono }: { label: string; value: string; bold?: boolean; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-gray-400 flex-shrink-0">{label}</span>
      <span className={`text-right ${bold ? "font-semibold text-gray-800" : "text-gray-700"} ${mono ? "font-mono text-blue-600 font-bold" : ""}`}>
        {value}
      </span>
    </div>
  );
}
