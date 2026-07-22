import cron from "node-cron";
import { prisma } from "../lib/prisma";
import { sendReminderEmail } from "./email.service";
import { startOfDay, endOfDay, addHours } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

/** Runs at 05:55 UTC (≈ 06:55 CET / 07:55 CEST) — sends morning reminders for today's appointments */
export function startReminderJob() {
  cron.schedule("55 5 * * *", async () => {
    console.log("[reminder] Running morning reminder job");

    // Get all active clinics
    const clinics = await prisma.clinic.findMany({ select: { id: true, timezone: true } });

    for (const clinic of clinics) {
      // Find today in clinic timezone
      const nowUtc = new Date();
      const nowZoned = toZonedTime(nowUtc, clinic.timezone);
      const todayStart = fromZonedTime(startOfDay(nowZoned), clinic.timezone);
      const todayEnd = fromZonedTime(endOfDay(nowZoned), clinic.timezone);

      const appointments = await prisma.appointment.findMany({
        where: {
          clinicId: clinic.id,
          status: "confirmed",
          reminderSentAt: null,
          startTime: { gte: todayStart, lte: todayEnd },
        },
        include: { clinic: true, doctor: true, appointmentType: true },
      });

      for (const appt of appointments) {
        try {
          await sendReminderEmail(appt as any);
          await prisma.appointment.update({
            where: { id: appt.id },
            data: { reminderSentAt: new Date() },
          });
          console.log(`[reminder] Sent to ${appt.patientEmail} for appt ${appt.id}`);
        } catch (err) {
          console.error(`[reminder] Failed for appt ${appt.id}:`, err);
        }
      }
    }
  });

  console.log("[reminder] Cron job registered");
}
