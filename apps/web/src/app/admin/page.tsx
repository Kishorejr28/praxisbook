"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { format, addDays, subDays, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { formatTime, statusColor, statusLabel } from "@/lib/utils";
import {
  Calendar, Users, Clock, TrendingDown, Bot,
  ChevronLeft, ChevronRight, CheckCircle, XCircle,
  AlertTriangle, MoreVertical, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

const CLINIC_ID = process.env.NEXT_PUBLIC_DEMO_CLINIC_ID ?? "demo";

export default function AdminDashboard() {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [stats, setStats] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [s, a] = await Promise.all([
        api.admin.dashboard(CLINIC_ID, date),
        api.admin.appointments(CLINIC_ID, date),
      ]);
      setStats(s);
      setAppointments(a);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [date]);

  async function updateStatus(id: string, status: string) {
    setActionLoading(id);
    try {
      const updated = await api.admin.updateAppointment(CLINIC_ID, id, { status });
      setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, ...updated } : a)));
      await load();
    } finally {
      setActionLoading(null);
    }
  }

  const StatCard = ({ icon: Icon, label, value, sub, color }: any) => (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", color)}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bot className="w-7 h-7 text-brand-600" />
          <h1 className="text-xl font-bold text-gray-800">PraxisBook Admin</h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} className="p-2 rounded-lg hover:bg-gray-100">
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
          <span className="text-sm text-gray-500">
            {format(parseISO(date), "EEEE, d. MMMM yyyy", { locale: de })}
          </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Date navigation */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDate(format(subDays(parseISO(date), 1), "yyyy-MM-dd"))}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
          <button
            onClick={() => setDate(format(addDays(parseISO(date), 1), "yyyy-MM-dd"))}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDate(format(new Date(), "yyyy-MM-dd"))}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Heute
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Calendar} label="Termine heute" value={stats.totalAppointments} sub={`${stats.confirmedAppointments} bestätigt`} color="bg-brand-600" />
            <StatCard icon={TrendingDown} label="Nicht erschienen" value={stats.noShows} sub={`${Math.round(stats.noShowRate * 100)}% No-show-Rate`} color="bg-red-500" />
            <StatCard icon={Bot} label="KI-Buchungen" value={stats.bookingsFromWidget} sub="über Widget gebucht" color="bg-purple-500" />
            <StatCard icon={Clock} label="Stunden gespart" value={`${stats.estimatedHoursSaved}h`} sub="durch KI-Rezeptionist" color="bg-green-500" />
          </div>
        )}

        {/* Appointments table */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Termine</h2>
            <span className="text-sm text-gray-400">{appointments.length} gesamt</span>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>Keine Termine für diesen Tag.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {appointments.map((appt) => (
                <div key={appt.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50">
                  {/* Time */}
                  <div className="w-16 text-center">
                    <p className="text-sm font-bold text-gray-800">{formatTime(appt.startTime)}</p>
                    <p className="text-xs text-gray-400">{formatTime(appt.endTime)}</p>
                  </div>

                  {/* Color dot */}
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: appt.appointmentType?.color ?? "#94a3b8" }}
                  />

                  {/* Patient + type */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-800 truncate">
                      {appt.patientFirstName} {appt.patientLastName}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {appt.appointmentType?.nameDe} · {appt.patientEmail}
                    </p>
                  </div>

                  {/* Insurance */}
                  <span className="text-xs text-gray-500 hidden sm:block uppercase">
                    {appt.insuranceType}
                  </span>

                  {/* Status badge */}
                  <span className={cn("text-xs px-2 py-1 rounded-full font-medium", statusColor(appt.status))}>
                    {statusLabel(appt.status)}
                  </span>

                  {/* Actions */}
                  {appt.status === "confirmed" && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateStatus(appt.id, "completed")}
                        disabled={!!actionLoading}
                        title="Als abgeschlossen markieren"
                        className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 disabled:opacity-40"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => updateStatus(appt.id, "no_show")}
                        disabled={!!actionLoading}
                        title="Nicht erschienen"
                        className="p-1.5 rounded-lg hover:bg-yellow-50 text-yellow-600 disabled:opacity-40"
                      >
                        <AlertTriangle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => updateStatus(appt.id, "cancelled")}
                        disabled={!!actionLoading}
                        title="Absagen"
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 disabled:opacity-40"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
