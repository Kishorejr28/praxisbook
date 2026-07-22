/**
 * PraxisAI — In-memory demo server (no DB or Redis required)
 * Run: node mock-server.mjs
 */

import http from "http";
import { randomUUID } from "crypto";

const PORT = 3001;

// ─── Demo data ────────────────────────────────────────────────────────────────

const clinic = {
  id: "clinic-demo-001",
  name: "Zahnarztpraxis Demo Walldorf",
  slug: "demo-zahnarzt-walldorf",
  email: "info@demo-zahnarzt.de",
  phone: "+49 6227 123456",
  address: "Bahnhofstraße 8",
  city: "Walldorf",
  postalCode: "69190",
  country: "DE",
  timezone: "Europe/Berlin",
  parkingInfo: "Kostenlose Parkplätze direkt vor der Praxis vorhanden.",
  emergencyPhone: "+49 6227 999999",
  languages: ["de", "en"],
  acceptsGKV: true,
  acceptsPKV: true,
  acceptsCash: true,
  gkvProviders: ["TK", "AOK", "Barmer", "DAK", "KKH"],
  pkvProviders: ["DKV", "Allianz", "AXA"],
  widgetGreeting: "Hallo! Ich bin Ihr KI-Rezeptionist. Wie kann ich Ihnen helfen?",
  primaryColor: "#2563eb",
  faqItems: [
    { id: "1", question: "Haben Sie Parkplätze?", answer: "Ja, kostenlose Parkplätze direkt vor der Praxis.", category: "parking", language: "de" },
    { id: "2", question: "Welche Krankenkassen akzeptieren Sie?", answer: "Wir behandeln alle GKV-Patienten (TK, AOK, Barmer u.a.) sowie Privatpatienten.", category: "insurance", language: "de" },
    { id: "3", question: "Was sind Ihre Öffnungszeiten?", answer: "Mo–Fr 08:00–18:00 Uhr.", category: "hours", language: "de" },
    { id: "4", question: "Do you have parking?", answer: "Yes, free parking directly in front of the practice.", category: "parking", language: "en" },
    { id: "5", question: "Which insurance do you accept?", answer: "We accept all statutory (GKV) and private (PKV) insurances.", category: "insurance", language: "en" },
  ],
};

const doctors = [
  {
    id: "doctor-001",
    clinicId: clinic.id,
    firstName: "Maria",
    lastName: "Mustermann",
    title: "Dr. med. dent.",
    specialty: "Allgemeine Zahnheilkunde",
    languages: ["de", "en"],
    isActive: true,
  },
  {
    id: "doctor-002",
    clinicId: clinic.id,
    firstName: "Thomas",
    lastName: "Müller",
    title: "Dr. med. dent.",
    specialty: "Kieferorthopädie",
    languages: ["de"],
    isActive: true,
  },
];

const appointmentTypes = [
  { id: "type-001", clinicId: clinic.id, name: "Check-up & Professional Cleaning", nameDe: "Kontrolluntersuchung & Prophylaxe", durationMinutes: 30, bufferMinutes: 10, color: "#2563eb", isEmergency: false, isActive: true },
  { id: "type-002", clinicId: clinic.id, name: "First Consultation (New Patients)", nameDe: "Erstberatung (Neupatienten)", durationMinutes: 30, bufferMinutes: 10, color: "#0891b2", isEmergency: false, isActive: true },
  { id: "type-003", clinicId: clinic.id, name: "Dental X-Ray & Examination", nameDe: "Röntgen & Befundaufnahme", durationMinutes: 30, bufferMinutes: 10, color: "#7c3aed", isEmergency: false, isActive: true },
  { id: "type-004", clinicId: clinic.id, name: "Tooth Filling / Restoration", nameDe: "Füllung / Zahnrestauration", durationMinutes: 30, bufferMinutes: 10, color: "#059669", isEmergency: false, isActive: true },
  { id: "type-005", clinicId: clinic.id, name: "Follow-up / Aftercare", nameDe: "Nachsorgetermin", durationMinutes: 30, bufferMinutes: 10, color: "#d97706", isEmergency: false, isActive: true },
  { id: "type-006", clinicId: clinic.id, name: "Dental Emergency / Pain", nameDe: "Zahnschmerzen / Notfall", durationMinutes: 30, bufferMinutes: 0, color: "#dc2626", isEmergency: true, isActive: true },
];

// In-memory appointments store
const appointments = [
  {
    id: "appt-001",
    clinicId: clinic.id,
    doctorId: "doctor-001",
    appointmentTypeId: "type-001",
    patientFirstName: "Anna",
    patientLastName: "Schmidt",
    patientEmail: "anna.schmidt@email.de",
    patientPhone: "+49 171 1234567",
    insuranceType: "gkv",
    insuranceProvider: "TK",
    status: "confirmed",
    startTime: todayAt(9, 0),
    endTime: todayAt(9, 45),
    bookedAt: new Date().toISOString(),
    bookingSource: "widget",
    confirmationCode: "A1B2C3",
    appointmentType: appointmentTypes[0],
    doctor: doctors[0],
  },
  {
    id: "appt-002",
    clinicId: clinic.id,
    doctorId: "doctor-001",
    appointmentTypeId: "type-002",
    patientFirstName: "Michael",
    patientLastName: "Weber",
    patientEmail: "m.weber@email.de",
    patientPhone: "+49 172 9876543",
    insuranceType: "pkv",
    insuranceProvider: "DKV",
    status: "confirmed",
    startTime: todayAt(10, 0),
    endTime: todayAt(11, 0),
    bookedAt: new Date().toISOString(),
    bookingSource: "phone",
    confirmationCode: "D4E5F6",
    appointmentType: appointmentTypes[1],
    doctor: doctors[0],
  },
  {
    id: "appt-003",
    clinicId: clinic.id,
    doctorId: "doctor-002",
    appointmentTypeId: "type-003",
    patientFirstName: "Sophie",
    patientLastName: "Bauer",
    patientEmail: "sophie.bauer@email.de",
    patientPhone: "+49 173 5556666",
    insuranceType: "gkv",
    insuranceProvider: "AOK",
    status: "confirmed",
    startTime: todayAt(11, 30),
    endTime: todayAt(12, 0),
    bookedAt: new Date().toISOString(),
    bookingSource: "widget",
    confirmationCode: "G7H8I9",
    appointmentType: appointmentTypes[2],
    doctor: doctors[1],
  },
  {
    id: "appt-004",
    clinicId: clinic.id,
    doctorId: "doctor-001",
    appointmentTypeId: "type-004",
    patientFirstName: "Klaus",
    patientLastName: "Fischer",
    patientEmail: "k.fischer@email.de",
    patientPhone: "+49 174 3334444",
    insuranceType: "cash",
    status: "no_show",
    startTime: todayAt(8, 0),
    endTime: todayAt(8, 20),
    bookedAt: new Date().toISOString(),
    bookingSource: "widget",
    confirmationCode: "J1K2L3",
    appointmentType: appointmentTypes[3],
    doctor: doctors[0],
  },
  {
    id: "appt-005",
    clinicId: clinic.id,
    doctorId: "doctor-002",
    appointmentTypeId: "type-001",
    patientFirstName: "Laura",
    patientLastName: "Hoffmann",
    patientEmail: "l.hoffmann@email.de",
    patientPhone: "+49 175 7778888",
    insuranceType: "gkv",
    insuranceProvider: "Barmer",
    status: "confirmed",
    startTime: todayAt(14, 0),
    endTime: todayAt(14, 45),
    bookedAt: new Date().toISOString(),
    bookingSource: "widget",
    confirmationCode: "M4N5O6",
    appointmentType: appointmentTypes[0],
    doctor: doctors[1],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayAt(h, m) {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

function generateSlots(date, apptTypeId, doctorId) {
  const type = appointmentTypes.find((t) => t.id === apptTypeId);
  if (!type) return [];
  const [y, mo, day] = date.split("-").map(Number);
  const step = type.durationMinutes + type.bufferMinutes;
  const slots = [];
  const doctors_ids = doctorId ? [doctorId] : doctors.map((d) => d.id);
  const seenTimes = new Set(); // deduplicate — show "first available" per time

  for (const did of doctors_ids) {
    const ranges = [[8, 0, 12, 0], [13, 0, 17, 0]];
    for (const [sh, sm, eh, em] of ranges) {
      let curH = sh, curM = sm;
      while (curH * 60 + curM + type.durationMinutes <= eh * 60 + em) {
        const start = new Date(y, mo - 1, day, curH, curM, 0);
        const end = new Date(y, mo - 1, day, curH, curM + type.durationMinutes, 0);
        const timeKey = `${curH}:${String(curM).padStart(2,"0")}`;
        if (start > new Date() && !seenTimes.has(timeKey)) {
          seenTimes.add(timeKey);
          slots.push({
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            doctorId: did,
            appointmentTypeId: apptTypeId,
          });
        }
        curM += step;
        while (curM >= 60) { curH++; curM -= 60; }
      }
    }
  }
  return slots.slice(0, 12);
}

function json(res, data, status = 200) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
  });
  res.end(JSON.stringify(data));
}

function body(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => {
      try { resolve(JSON.parse(data)); } catch { resolve({}); }
    });
  });
}

// ─── Router ───────────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;
  const method = req.method;

  if (method === "OPTIONS") { json(res, {}); return; }

  // Health
  if (path === "/health") return json(res, { ok: true });

  // Clinic by slug
  if (path.match(/^\/api\/clinics\/[\w-]+$/) && method === "GET") {
    return json(res, clinic);
  }

  // Appointment types
  if (path.match(/^\/api\/clinics\/[\w-]+\/appointment-types$/) && method === "GET") {
    return json(res, appointmentTypes);
  }

  // Doctors
  if (path.match(/^\/api\/clinics\/[\w-]+\/doctors$/) && method === "GET") {
    return json(res, doctors.map(({ clinicId, ...d }) => d));
  }

  // Available slots
  if (path === "/api/slots" && method === "GET") {
    const apptTypeId = url.searchParams.get("appointmentTypeId");
    const date = url.searchParams.get("date");
    const doctorId = url.searchParams.get("doctorId");
    if (!apptTypeId || !date) return json(res, { error: "Missing params" }, 400);
    return json(res, generateSlots(date, apptTypeId, doctorId));
  }

  // Create booking
  if (path === "/api/bookings" && method === "POST") {
    const data = await body(req);
    const type = appointmentTypes.find((t) => t.id === data.appointmentTypeId);
    const doctor = doctors.find((d) => d.id === data.doctorId);
    const code = randomUUID().split("-")[0].toUpperCase();
    const appt = {
      id: `appt-${randomUUID().slice(0, 8)}`,
      clinicId: clinic.id,
      ...data,
      status: "confirmed",
      endTime: new Date(new Date(data.startTime).getTime() + (type?.durationMinutes ?? 45) * 60000).toISOString(),
      bookedAt: new Date().toISOString(),
      confirmationCode: code,
      appointmentType: type,
      doctor,
    };
    appointments.push(appt);
    return json(res, { appointment: appt, confirmationCode: code }, 201);
  }

  // Get booking by code
  const codeMatch = path.match(/^\/api\/bookings\/([\w]+)$/);
  if (codeMatch && method === "GET") {
    const appt = appointments.find((a) => a.confirmationCode === codeMatch[1]);
    if (!appt) return json(res, { error: "Not found" }, 404);
    return json(res, { ...appt, clinic });
  }

  // Cancel booking
  const cancelMatch = path.match(/^\/api\/bookings\/([\w]+)\/cancel$/);
  if (cancelMatch && method === "POST") {
    const appt = appointments.find((a) => a.confirmationCode === cancelMatch[1]);
    if (!appt) return json(res, { error: "Not found" }, 404);
    appt.status = "cancelled";
    appt.cancelledAt = new Date().toISOString();
    return json(res, appt);
  }

  // Chat (mock — no AI key needed)
  if (path === "/api/chat" && method === "POST") {
    const data = await body(req);
    const last = data.messages?.at(-1)?.content?.toLowerCase() ?? "";
    let message = "Ich helfe Ihnen gerne! Möchten Sie einen Termin buchen?";
    if (last.includes("park")) message = "✅ Ja, wir haben kostenlose Parkplätze direkt vor der Praxis.";
    else if (last.includes("versicher") || last.includes("kasse") || last.includes("insurance")) message = "✅ Wir akzeptieren alle gesetzlichen Krankenkassen (TK, AOK, Barmer, DAK) sowie Privatpatienten und Selbstzahler.";
    else if (last.includes("öffnung") || last.includes("stunden") || last.includes("hours") || last.includes("open")) message = "✅ Wir sind Montag bis Freitag von 08:00 bis 18:00 Uhr für Sie geöffnet.";
    else if (last.includes("notfall") || last.includes("emergency") || last.includes("schmerz")) message = "🚨 Bei einem Zahnnotfall rufen Sie uns bitte sofort an: +49 6227 999999.";
    else if (last.includes("termin") || last.includes("buchen") || last.includes("book") || last.includes("appoint")) {
      message = "Gerne helfe ich Ihnen bei der Terminbuchung! Klicken Sie auf eine Behandlung oben, um einen Termin zu wählen.";
    }
    return json(res, { message, suggestBooking: last.includes("termin") || last.includes("book") });
  }

  // Admin dashboard stats
  const dashMatch = path.match(/^\/api\/admin\/([\w-]+)\/dashboard$/);
  if (dashMatch && method === "GET") {
    const total = appointments.length;
    const confirmed = appointments.filter((a) => a.status === "confirmed").length;
    const cancelled = appointments.filter((a) => a.status === "cancelled").length;
    const noShows = appointments.filter((a) => a.status === "no_show").length;
    const widget = appointments.filter((a) => a.bookingSource === "widget").length;
    return json(res, {
      date: url.searchParams.get("date") ?? new Date().toISOString().split("T")[0],
      totalAppointments: total,
      confirmedAppointments: confirmed,
      cancelledAppointments: cancelled,
      noShows,
      noShowRate: total > 0 ? Math.round((noShows / total) * 100) / 100 : 0,
      estimatedHoursSaved: Math.round(widget * 3 / 60 * 10) / 10,
      bookingsFromWidget: widget,
      bookingsFromPhone: total - widget,
    });
  }

  // Admin appointments list
  const apptListMatch = path.match(/^\/api\/admin\/([\w-]+)\/appointments$/);
  if (apptListMatch && method === "GET") {
    return json(res, appointments.sort((a, b) => a.startTime.localeCompare(b.startTime)));
  }

  // Admin update appointment
  const apptUpdateMatch = path.match(/^\/api\/admin\/([\w-]+)\/appointments\/([\w-]+)$/);
  if (apptUpdateMatch && method === "PATCH") {
    const data = await body(req);
    const appt = appointments.find((a) => a.id === apptUpdateMatch[2]);
    if (!appt) return json(res, { error: "Not found" }, 404);
    Object.assign(appt, data);
    if (data.status === "cancelled") appt.cancelledAt = new Date().toISOString();
    return json(res, appt);
  }

  // Mock payment intent (Stripe/Razorpay simulation)
  if (path === "/api/payments/create-intent" && method === "POST") {
    const data = await body(req);
    await new Promise(r => setTimeout(r, 300)); // simulate network
    return json(res, {
      paymentRef: `MOCK-${randomUUID().slice(0, 8).toUpperCase()}`,
      amount: data.amount ?? 10,
      status: "succeeded",
      last4: "4242",
    }, 201);
  }

  json(res, { error: "Not found" }, 404);
});

server.listen(PORT, () => {
  console.log(`\n✅ PraxisAI mock server running at http://localhost:${PORT}`);
  console.log(`\n   Clinic page   → http://localhost:3000/klinik/demo-zahnarzt-walldorf`);
  console.log(`   Booking page  → http://localhost:3000/buchen/demo-zahnarzt-walldorf`);
  console.log(`   Admin panel   → http://localhost:3000/admin\n`);
  console.log(`   Admin panel  → http://localhost:3000/admin\n`);
});
