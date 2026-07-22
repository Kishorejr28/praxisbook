"use client";

import { useState } from "react";
import { CreditCard, CheckCircle, Shield, Loader2 } from "lucide-react";

interface Props {
  amount: number; // deposit in euros e.g. 10
  clinicName: string;
  appointmentLabel: string; // e.g. "Routineuntersuchung — Mo. 20. Juli 10:00 Uhr"
  onPaid: (paymentRef: string) => void;
  onSkip: () => void;
  allowSkip?: boolean;
}

export function PaymentDeposit({ amount, clinicName, appointmentLabel, onPaid, onSkip, allowSkip = true }: Props) {
  const [loading, setLoading] = useState(false);
  const [card, setCard] = useState({ number: "", expiry: "", cvc: "", name: "" });
  const [error, setError] = useState("");

  // In production this calls Stripe or Razorpay API.
  // For demo: simulate a 1.5s payment processing.
  async function handlePay() {
    if (!card.number || !card.expiry || !card.cvc || !card.name) {
      setError("Bitte alle Felder ausfüllen.");
      return;
    }
    setError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    // In production: call /api/payments/create-intent → Stripe/Razorpay → return paymentId
    onPaid(`DEMO-${Date.now()}`);
  }

  const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="space-y-5">
      {/* What the deposit is for */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <p className="text-sm font-semibold text-blue-800 mb-1">Anzahlung zur Terminbestätigung</p>
        <p className="text-xs text-blue-600">{appointmentLabel}</p>
        <p className="text-2xl font-bold text-blue-800 mt-2">€{amount.toFixed(2)}</p>
        <p className="text-xs text-blue-500 mt-1">
          Wird auf Ihre Behandlungskosten angerechnet. Bei Absage &gt;24h im Voraus vollständig erstattet.
        </p>
      </div>

      {/* Card form */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Name auf der Karte</label>
          <input className={inputCls} placeholder="Max Mustermann" value={card.name}
            onChange={(e) => setCard({ ...card, name: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Kartennummer</label>
          <input className={inputCls} placeholder="4242 4242 4242 4242" maxLength={19}
            value={card.number}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "").slice(0, 16);
              setCard({ ...card, number: v.replace(/(.{4})/g, "$1 ").trim() });
            }} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Ablaufdatum</label>
            <input className={inputCls} placeholder="MM/JJ" maxLength={5}
              value={card.expiry}
              onChange={(e) => {
                let v = e.target.value.replace(/\D/g, "").slice(0, 4);
                if (v.length >= 3) v = v.slice(0, 2) + "/" + v.slice(2);
                setCard({ ...card, expiry: v });
              }} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">CVC</label>
            <input className={inputCls} placeholder="123" maxLength={3}
              value={card.cvc}
              onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, "").slice(0, 3) })} />
          </div>
        </div>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {/* Security note */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Shield className="w-3.5 h-3.5" />
        <span>SSL-verschlüsselt · Powered by Stripe · {clinicName}</span>
      </div>

      <button
        onClick={handlePay}
        disabled={loading}
        className="w-full py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 transition-colors"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
        {loading ? "Zahlung wird verarbeitet…" : `€${amount.toFixed(2)} jetzt bezahlen`}
      </button>

      {allowSkip && (
        <button onClick={onSkip} className="w-full text-sm text-gray-400 hover:text-gray-600 py-1">
          Ohne Anzahlung fortfahren →
        </button>
      )}
    </div>
  );
}
