"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function CancelPage({ params }: { params: { code: string } }) {
  const [appt, setAppt] = useState<any>(null);
  const [status, setStatus] = useState<"loading" | "confirm" | "done" | "error">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    api.booking.get(params.code)
      .then((a) => { setAppt(a); setStatus("confirm"); })
      .catch(() => setStatus("error"));
  }, [params.code]);

  async function cancel() {
    setStatus("loading");
    try {
      await api.booking.cancel(params.code, "Patient request");
      setStatus("done");
    } catch (err: any) {
      setError(err.message); setStatus("error");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-sm w-full text-center space-y-4">
        {status === "loading" && <Loader2 className="w-10 h-10 animate-spin text-brand-600 mx-auto" />}

        {status === "confirm" && appt && (
          <>
            <XCircle className="w-12 h-12 text-red-400 mx-auto" />
            <h1 className="text-xl font-bold">Termin absagen?</h1>
            <p className="text-sm text-gray-500">
              {new Date(appt.startTime).toLocaleString("de-DE", { timeZone: "Europe/Berlin", dateStyle: "full", timeStyle: "short" })} Uhr
            </p>
            <button onClick={cancel} className="w-full py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600">
              Ja, Termin absagen
            </button>
            <a href="/" className="block text-sm text-gray-400 hover:text-gray-600">Abbrechen</a>
          </>
        )}

        {status === "done" && (
          <>
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            <h1 className="text-xl font-bold">Termin abgesagt</h1>
            <p className="text-sm text-gray-500">Sie erhalten eine Bestätigung per E-Mail.</p>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="w-12 h-12 text-red-400 mx-auto" />
            <h1 className="text-xl font-bold">Fehler</h1>
            <p className="text-sm text-gray-500">{error || "Termin nicht gefunden."}</p>
          </>
        )}
      </div>
    </div>
  );
}
