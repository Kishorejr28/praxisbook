# PraxisBook — KI-Rezeptionist & Online-Terminbuchung

An AI-powered appointment booking system and chat receptionist for dental (and medical) clinics. Built as a monorepo with three apps:

| App | What it is |
|-----|-----------|
| `apps/server` | Express + TypeScript REST API, Prisma ORM, PostgreSQL |
| `apps/web` | Next.js — patient-facing booking page + admin dashboard |
| `apps/widget` | Embeddable vanilla JS widget (chat bubble + booking modal) |

---

## Quick Start

### Prerequisites
- Node.js 20+
- pnpm 9+ (`npm i -g pnpm`)
- Docker (for PostgreSQL + Redis)

### 1. Clone & install

```bash
cd C:\tmp\praxisbook
pnpm install
```

### 2. Environment

```bash
cp .env.example .env
# Edit .env — fill in API keys (OpenAI or Anthropic, SendGrid, Twilio)
```

Copy `.env` into the server app too:

```bash
cp .env apps/server/.env
```

### 3. Start infrastructure

```bash
docker-compose up -d
```

### 4. Database setup

```bash
pnpm db:migrate       # runs prisma migrate dev
# enter migration name: init

pnpm --filter server prisma:seed   # seeds demo clinic + doctor
```

### 5. Run everything

```bash
pnpm dev
# Server: http://localhost:3001
# Web:    http://localhost:3000
```

---

## What's included

### Server API (`localhost:3001`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/clinics/:slug` | Clinic info + FAQ |
| GET | `/api/clinics/:slug/appointment-types` | Available appointment types |
| GET | `/api/clinics/:slug/doctors` | Active doctors |
| GET | `/api/slots?clinicId&appointmentTypeId&date` | Available time slots |
| POST | `/api/bookings` | Create booking |
| GET | `/api/bookings/:code` | Get booking by confirmation code |
| POST | `/api/bookings/:code/cancel` | Patient self-cancel |
| POST | `/api/chat` | AI receptionist chat |
| GET | `/api/admin/:clinicId/dashboard?date` | Dashboard stats |
| GET | `/api/admin/:clinicId/appointments?date` | Day appointments |
| PATCH | `/api/admin/:clinicId/appointments/:id` | Update status/reschedule |
| GET | `/api/admin/:clinicId/patients` | Patient list |

### Web App (`localhost:3000`)

| URL | What it shows |
|-----|--------------|
| `/` | Landing page |
| `/book/[clinic-slug]` | Patient booking flow (4 steps) + AI chat widget |
| `/cancel/[code]` | Patient self-cancel page |
| `/admin` | Admin dashboard — stats + appointment management |

### Embeddable Widget

Add to any clinic website:

```html
<script
  src="https://your-cdn.com/praxisbook-widget.iife.js"
  data-clinic="demo-zahnarzt-walldorf"
  data-api="https://api.praxisbook.de"
  data-color="#2563eb"
  data-lang="de">
</script>
```

This renders a floating chat bubble. Patients can:
- Chat with the AI receptionist (FAQs, insurance, parking, etc.)
- Book an appointment directly in a modal — no redirect needed

Build the widget:
```bash
pnpm --filter widget build
# Output: apps/widget/dist/praxisbook-widget.iife.js
```

---

## Architecture

```
praxisbook/
├── apps/
│   ├── server/               Express API
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts
│   │   └── src/
│   │       ├── lib/          prisma.ts, redis.ts
│   │       ├── middleware/   errorHandler.ts
│   │       ├── routes/       clinic, slots, booking, chat, admin
│   │       ├── services/     slots, booking, email, ai, reminder
│   │       └── index.ts      Express entry + cron jobs
│   ├── web/                  Next.js 14 (App Router)
│   │   └── src/
│   │       ├── app/          Pages: /, /book/[slug], /cancel/[code], /admin
│   │       ├── components/   booking/, chat/, admin/
│   │       └── lib/          api.ts, utils.ts
│   └── widget/               Vite IIFE bundle
│       └── src/
│           ├── index.ts      Auto-init, Shadow DOM host
│           ├── chat.ts       Chat bubble UI
│           ├── booking.ts    Booking modal UI
│           └── styles.ts     Global host styles
└── packages/
    └── types/                Shared TypeScript interfaces
```

---

## Key Features

- **AI Chat Receptionist** — answers FAQ (insurance, parking, hours, emergency) using GPT-4o or Claude, with tool calls to check live availability
- **Real-time slot generation** — respects working hours, breaks, blocked dates, existing appointments, and Redis slot locking (prevents double-booking)
- **Morning reminders** — cron job at 06:00 CET sends email reminders for that day's appointments
- **GDPR-compliant** — consent checkbox on every booking form; EU data storage
- **Dual AI provider** — configure `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` (or both); server picks whichever is available
- **Admin dashboard** — see today's schedule, no-show rate, hours saved by AI, quick actions (complete / no-show / cancel)
- **Embeddable widget** — single `<script>` tag, Shadow DOM isolation, no CSS conflicts

---

## Next Steps / Roadmap

- [ ] Clerk authentication for admin dashboard
- [ ] SMS reminders via Twilio
- [ ] WhatsApp reminder channel (Twilio WhatsApp API)
- [ ] Waitlist management (auto-fill cancellations)
- [ ] Recall campaigns (lapsed patient outreach)
- [ ] Post-visit review request emails
- [ ] Digital intake forms (pre-appointment)
- [ ] Multi-doctor schedule view
- [ ] Stripe subscription billing for clinic onboarding
- [ ] Google Business Profile booking button integration

---

## Demo Clinic

After seeding, the demo clinic is available at:
- Booking page: `http://localhost:3000/book/demo-zahnarzt-walldorf`
- API: `http://localhost:3001/api/clinics/demo-zahnarzt-walldorf`
