const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  clinic: {
    get: (slug: string) => apiFetch<any>(`/api/clinics/${slug}`),
    appointmentTypes: (slug: string) => apiFetch<any[]>(`/api/clinics/${slug}/appointment-types`),
    doctors: (slug: string) => apiFetch<any[]>(`/api/clinics/${slug}/doctors`),
  },
  slots: {
    get: (clinicId: string, appointmentTypeId: string, date: string, doctorId?: string) =>
      apiFetch<any[]>(`/api/slots?clinicId=${clinicId}&appointmentTypeId=${appointmentTypeId}&date=${date}${doctorId ? `&doctorId=${doctorId}` : ""}`),
  },
  booking: {
    create: (data: any) => apiFetch<any>("/api/bookings", { method: "POST", body: JSON.stringify(data) }),
    get: (code: string) => apiFetch<any>(`/api/bookings/${code}`),
    cancel: (code: string, reason?: string) =>
      apiFetch<any>(`/api/bookings/${code}/cancel`, { method: "POST", body: JSON.stringify({ reason }) }),
  },
  chat: {
    send: (clinicSlug: string, messages: any[], language?: string) =>
      apiFetch<any>("/api/chat", { method: "POST", body: JSON.stringify({ clinicSlug, messages, language }) }),
  },
  admin: {
    dashboard: (clinicId: string, date: string) => apiFetch<any>(`/api/admin/${clinicId}/dashboard?date=${date}`),
    appointments: (clinicId: string, date: string) => apiFetch<any[]>(`/api/admin/${clinicId}/appointments?date=${date}`),
    updateAppointment: (clinicId: string, id: string, data: any) =>
      apiFetch<any>(`/api/admin/${clinicId}/appointments/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    patients: (clinicId: string, search?: string) =>
      apiFetch<any[]>(`/api/admin/${clinicId}/patients${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  },
};
