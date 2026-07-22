import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateTime(iso: string, tz = "Europe/Berlin") {
  const zoned = toZonedTime(parseISO(iso), tz);
  return format(zoned, "EEEE, d. MMMM yyyy 'um' HH:mm 'Uhr'", { locale: de });
}

export function formatTime(iso: string, tz = "Europe/Berlin") {
  const zoned = toZonedTime(parseISO(iso), tz);
  return format(zoned, "HH:mm", { locale: de });
}

export function formatDate(iso: string) {
  return format(parseISO(iso.includes("T") ? iso : iso + "T00:00:00"), "d. MMMM yyyy", { locale: de });
}

export function statusColor(status: string) {
  const map: Record<string, string> = {
    confirmed: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    cancelled: "bg-red-100 text-red-800",
    no_show: "bg-gray-100 text-gray-600",
    completed: "bg-blue-100 text-blue-800",
  };
  return map[status] ?? "bg-gray-100 text-gray-600";
}

export function statusLabel(status: string) {
  const map: Record<string, string> = {
    confirmed: "Bestätigt",
    pending: "Ausstehend",
    cancelled: "Abgesagt",
    no_show: "Nicht erschienen",
    completed: "Abgeschlossen",
  };
  return map[status] ?? status;
}
