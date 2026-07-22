"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  clinicId: string;
  slot: { startTime: string; endTime: string; doctorId: string };
  appointmentTypeId: string;
  onSuccess: (result: any) => void;
  onBack: () => void;
  deferSubmit?: boolean;
  submitLabel?: string;
  lang?: "de" | "en";
}

const LABELS = {
  de: { firstName: "Vorname", lastName: "Nachname", email: "E-Mail", phone: "Telefon", dob: "Geburtsdatum", insurance: "Krankenversicherung", provider: "Krankenkasse", providerPlaceholder: "z.B. TK, AOK, Barmer", notes: "Anmerkungen", gdpr: "Ich stimme der Verarbeitung meiner Daten gemäß", gdprLink: "Datenschutzerklärung", gdprSuffix: "zu.", submit: "Termin bestätigen", back: "Zurück", error: "Bitte stimmen Sie der Datenschutzerklärung zu.", gkv: "Gesetzlich (GKV)", pkv: "Privat (PKV)", cash: "Selbstzahler" },
  en: { firstName: "First name", lastName: "Last name", email: "Email", phone: "Phone", dob: "Date of birth", insurance: "Health insurance", provider: "Insurance provider", providerPlaceholder: "e.g. TK, AOK, Barmer", notes: "Notes", gdpr: "I agree to the processing of my data per the", gdprLink: "privacy policy", gdprSuffix: ".", submit: "Confirm appointment", back: "Back", error: "Please accept the privacy policy.", gkv: "Public insurance (GKV)", pkv: "Private insurance (PKV)", cash: "Self-pay" },
};

export function BookingForm({
  clinicId, slot, appointmentTypeId, onSuccess, onBack, deferSubmit = false, submitLabel, lang = "de",
}: Props) {
  const L = LABELS[lang];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    patientFirstName: "",
    patientLastName: "",
    patientEmail: "",
    patientPhone: "",
    patientDob: "",
    insuranceType: "gkv" as "gkv" | "pkv" | "cash",
    insuranceProvider: "",
    notes: "",
    gdprConsent: false,
  });

  function set(key: string, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.gdprConsent) { setError(L.error); return; }

    // Deferred mode: hand form data to parent, which adds payment then calls API
    if (deferSubmit) {
      onSuccess({ ...form, gdprConsent: true });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await api.booking.create({
        clinicId,
        doctorId: slot.doctorId,
        appointmentTypeId,
        startTime: slot.startTime,
        ...form,
      });
      onSuccess(result);
    } catch (err: any) {
      setError(err.message ?? "Fehler beim Buchen. Bitte versuchen Sie es erneut.");
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const labelCls = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls} htmlFor="pai-fname">{L.firstName} *</label>
          <input id="pai-fname" className={inputCls} required value={form.patientFirstName} onChange={(e) => set("patientFirstName", e.target.value)} />
        </div>
        <div>
          <label className={labelCls} htmlFor="pai-lname">{L.lastName} *</label>
          <input id="pai-lname" className={inputCls} required value={form.patientLastName} onChange={(e) => set("patientLastName", e.target.value)} />
        </div>
      </div>

      <div>
        <label className={labelCls} htmlFor="pai-email">{L.email} *</label>
        <input id="pai-email" className={inputCls} type="email" required value={form.patientEmail} onChange={(e) => set("patientEmail", e.target.value)} />
      </div>

      <div>
        <label className={labelCls} htmlFor="pai-phone">{L.phone} *</label>
        <input id="pai-phone" className={inputCls} type="tel" required value={form.patientPhone} onChange={(e) => set("patientPhone", e.target.value)} />
      </div>

      <div>
        <label className={labelCls}>{L.dob}</label>
        <input className={inputCls} type="date" value={form.patientDob} onChange={(e) => set("patientDob", e.target.value)} />
      </div>

      <div>
        <label className={labelCls}>{L.insurance} *</label>
        <select className={inputCls} value={form.insuranceType} onChange={(e) => set("insuranceType", e.target.value)}>
          <option value="gkv">{L.gkv}</option>
          <option value="pkv">{L.pkv}</option>
          <option value="cash">{L.cash}</option>
        </select>
      </div>

      {form.insuranceType !== "cash" && (
        <div>
          <label className={labelCls}>{L.provider}</label>
          <input className={inputCls} placeholder={L.providerPlaceholder} value={form.insuranceProvider} onChange={(e) => set("insuranceProvider", e.target.value)} />
        </div>
      )}

      <div>
        <label className={labelCls}>{L.notes}</label>
        <textarea className={cn(inputCls, "resize-none")} rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
      </div>

      <label className="flex items-start gap-2 cursor-pointer">
        <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-gray-300" checked={form.gdprConsent} onChange={(e) => set("gdprConsent", e.target.checked)} />
        <span className="text-sm text-gray-600">
          {L.gdpr}{" "}<a href="/datenschutz" className="text-blue-600 underline">{L.gdprLink}</a>{" "}{L.gdprSuffix} *
        </span>
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onBack} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">
          Zurück
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitLabel ?? L.submit}
        </button>
      </div>
    </form>
  );
}
