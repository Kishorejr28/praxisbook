import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { clinicRouter } from "./routes/clinic.routes";
import { slotsRouter } from "./routes/slots.routes";
import { bookingRouter } from "./routes/booking.routes";
import { chatRouter } from "./routes/chat.routes";
import { adminRouter } from "./routes/admin.routes";
import { errorHandler } from "./middleware/errorHandler";
import { startReminderJob } from "./services/reminder.service";

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(helmet());
app.use(cors({ origin: [process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000", /localhost/] }));
app.use(express.json());

// Public endpoints get a generous rate limit; chat gets its own tighter limit
app.use("/api/chat", rateLimit({ windowMs: 60_000, max: 30, standardHeaders: true }));
app.use("/api/bookings", rateLimit({ windowMs: 60_000, max: 20, standardHeaders: true }));

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api/clinics", clinicRouter);
app.use("/api/slots", slotsRouter);
app.use("/api/bookings", bookingRouter);
app.use("/api/chat", chatRouter);
app.use("/api/admin", adminRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[server] Listening on http://localhost:${PORT}`);
  startReminderJob();
});

