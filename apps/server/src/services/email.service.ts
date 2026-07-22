import sgMail from "@sendgrid/mail";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";

sgMail.setApiKey(process.env.SENDGRID_API_KEY ?? "");

type AppointmentWithRelations = {
  id: string;
  confirmationCode: string;
  patientFirstName: string;
  patientLastName: string;
  patientEmail: string;
  startTime: Date;
  endTime: Date;
  clinic: { name: string; address: string; city: string; phone: string; timezone: string };
  doctor: { firstName: string; lastName: string; title: string | null };
  appointmentType: { nameDe: string; name: string };
};

function formatApptTime(date: Date, tz: string, lang: string) {
  const zoned = toZonedTime(date, tz);
  return format(zoned, "EEEE, d. MMMM yyyy 'um' HH:mm 'Uhr'", {
    locale: lang === "de" ? de : undefined,
  });
}

function buildIcs(appt: AppointmentWithRelations): string {
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//PraxisBook//DE",
    "BEGIN:VEVENT",
    `UID:${appt.id}@praxisbook`,
    `DTSTART:${fmt(appt.startTime)}`,
    `DTEND:${fmt(appt.endTime)}`,
    `SUMMARY:Zahnarzttermin – ${appt.clinic.name}`,
    `LOCATION:${appt.clinic.address}, ${appt.clinic.city}`,
    `DESCRIPTION:Bestätigungscode: ${appt.confirmationCode}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export async function sendBookingConfirmation(appt: AppointmentWithRelations) {
  const timeStr = formatApptTime(appt.startTime, appt.clinic.timezone, "de");
  const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/cancel/${appt.confirmationCode}`;

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2 style="color:#2563eb">Terminbestätigung ✓</h2>
      <p>Hallo ${appt.patientFirstName},</p>
      <p>Ihr Termin wurde erfolgreich gebucht:</p>
      <table style="border-collapse:collapse;width:100%">
        <tr><td style="padding:8px;font-weight:bold">Praxis</td><td style="padding:8px">${appt.clinic.name}</td></tr>
        <tr style="background:#f1f5f9"><td style="padding:8px;font-weight:bold">Datum & Uhrzeit</td><td style="padding:8px">${timeStr}</td></tr>
        <tr><td style="padding:8px;font-weight:bold">Behandlung</td><td style="padding:8px">${appt.appointmentType.nameDe}</td></tr>
        <tr style="background:#f1f5f9"><td style="padding:8px;font-weight:bold">Arzt / Ärztin</td><td style="padding:8px">${appt.doctor.title ?? ""} ${appt.doctor.firstName} ${appt.doctor.lastName}</td></tr>
        <tr><td style="padding:8px;font-weight:bold">Bestätigungscode</td><td style="padding:8px;font-family:monospace;font-size:18px;color:#2563eb">${appt.confirmationCode}</td></tr>
      </table>
      <p style="margin-top:24px">
        <a href="${cancelUrl}" style="color:#dc2626">Termin absagen</a>
      </p>
      <p style="color:#64748b;font-size:12px">
        Bei Fragen erreichen Sie uns unter ${appt.clinic.phone}.
      </p>
    </div>
  `;

  await sgMail.send({
    to: appt.patientEmail,
    from: { email: process.env.EMAIL_FROM!, name: process.env.EMAIL_FROM_NAME! },
    subject: `Terminbestätigung: ${timeStr} – ${appt.clinic.name}`,
    html,
    attachments: [
      {
        content: Buffer.from(buildIcs(appt)).toString("base64"),
        filename: "termin.ics",
        type: "text/calendar",
        disposition: "attachment",
      },
    ],
  });
}

export async function sendReminderEmail(appt: AppointmentWithRelations) {
  const timeStr = formatApptTime(appt.startTime, appt.clinic.timezone, "de");
  const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/cancel/${appt.confirmationCode}`;

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2 style="color:#2563eb">Erinnerung: Ihr Zahnarzttermin heute</h2>
      <p>Hallo ${appt.patientFirstName},</p>
      <p>Dies ist eine freundliche Erinnerung an Ihren heutigen Termin:</p>
      <table style="border-collapse:collapse;width:100%">
        <tr><td style="padding:8px;font-weight:bold">Praxis</td><td style="padding:8px">${appt.clinic.name}</td></tr>
        <tr style="background:#f1f5f9"><td style="padding:8px;font-weight:bold">Uhrzeit</td><td style="padding:8px">${timeStr}</td></tr>
        <tr><td style="padding:8px;font-weight:bold">Adresse</td><td style="padding:8px">${appt.clinic.address}, ${appt.clinic.city}</td></tr>
      </table>
      <p style="margin-top:16px">Müssen Sie absagen? <a href="${cancelUrl}" style="color:#dc2626">Hier klicken</a></p>
    </div>
  `;

  await sgMail.send({
    to: appt.patientEmail,
    from: { email: process.env.EMAIL_FROM!, name: process.env.EMAIL_FROM_NAME! },
    subject: `Erinnerung: Heute um ${format(toZonedTime(appt.startTime, appt.clinic.timezone), "HH:mm")} Uhr – ${appt.clinic.name}`,
    html,
  });
}

export async function sendCancellationEmail(appt: AppointmentWithRelations) {
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2 style="color:#dc2626">Termin abgesagt</h2>
      <p>Hallo ${appt.patientFirstName},</p>
      <p>Ihr Termin bei <strong>${appt.clinic.name}</strong> wurde erfolgreich abgesagt.</p>
      <p>Möchten Sie einen neuen Termin buchen? Besuchen Sie unsere Website oder rufen Sie uns an: ${appt.clinic.phone}</p>
    </div>
  `;

  await sgMail.send({
    to: appt.patientEmail,
    from: { email: process.env.EMAIL_FROM!, name: process.env.EMAIL_FROM_NAME! },
    subject: `Absage bestätigt – ${appt.clinic.name}`,
    html,
  });
}
