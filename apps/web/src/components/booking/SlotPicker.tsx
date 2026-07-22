"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { formatTime } from "@/lib/utils";
import { format, addDays, startOfToday, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  clinicId: string;
  appointmentTypeId: string;
  doctorId?: string;
  onSelect: (slot: { startTime: string; endTime: string; doctorId: string }) => void;
}

export function SlotPicker({ clinicId, appointmentTypeId, doctorId, onSelect }: Props) {
  const today = startOfToday();
  const [baseDate, setBaseDate] = useState(today);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const days = Array.from({ length: 7 }, (_, i) => addDays(baseDate, i));

  async function handleDayClick(date: Date) {
    const iso = format(date, "yyyy-MM-dd");
    setSelectedDate(iso);
    setLoading(true);
    try {
      const result = await api.slots.get(clinicId, appointmentTypeId, iso, doctorId);
      setSlots(result);
    } catch {
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Week navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setBaseDate(addDays(baseDate, -7))}
          disabled={baseDate <= today}
          className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 grid grid-cols-7 gap-1">
          {days.map((d) => {
            const iso = format(d, "yyyy-MM-dd");
            const isSelected = selectedDate === iso;
            const isPast = d < today;
            return (
              <button
                key={iso}
                onClick={() => !isPast && handleDayClick(d)}
                disabled={isPast}
                className={cn(
                  "flex flex-col items-center py-2 px-1 rounded-lg text-sm font-medium transition-colors",
                  isSelected ? "bg-brand-600 text-white" : "hover:bg-brand-50 text-gray-700",
                  isPast && "opacity-30 cursor-not-allowed"
                )}
              >
                <span className="text-xs uppercase tracking-wide">
                  {format(d, "EEE", { locale: de })}
                </span>
                <span className="text-base">{format(d, "d")}</span>
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setBaseDate(addDays(baseDate, 7))}
          className="p-1 rounded hover:bg-gray-100"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Slots */}
      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
        </div>
      )}
      {!loading && selectedDate && slots.length === 0 && (
        <p className="text-center text-gray-500 py-6">
          Keine freien Termine an diesem Tag.
        </p>
      )}
      {!loading && slots.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {slots.map((slot) => (
            <button
              key={`${slot.doctorId}-${slot.startTime}`}
              onClick={() => onSelect(slot)}
              className="py-2 px-3 border border-brand-200 rounded-lg text-sm font-medium text-brand-700 hover:bg-brand-600 hover:text-white hover:border-brand-600 transition-colors"
            >
              {formatTime(slot.startTime)}
            </button>
          ))}
        </div>
      )}
      {!selectedDate && (
        <p className="text-center text-gray-400 py-4 text-sm">Bitte wählen Sie einen Tag.</p>
      )}
    </div>
  );
}
