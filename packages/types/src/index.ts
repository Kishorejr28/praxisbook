// ─── Clinic ────────────────────────────────────────────────────────────────

export interface Clinic {
  id: string;
  name: string;
  slug: string; // URL-safe identifier, e.g. "praxisklinik-walldorf"
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  timezone: string; // e.g. "Europe/Berlin"
  website?: string;
  logoUrl?: string;
  primaryColor?: string; // for widget theming
  faqItems: FaqItem[];
  insuranceInfo: InsuranceInfo;
  parkingInfo?: string;
  emergencyPhone?: string;
  languages: string[]; // e.g. ["de", "en"]
  createdAt: string;
  updatedAt: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: FaqCategory;
  language: string; // ISO 639-1
}

export type FaqCategory =
  | "insurance"
  | "parking"
  | "hours"
  | "location"
  | "emergency"
  | "new_patient"
  | "pricing"
  | "general";

export interface InsuranceInfo {
  acceptsGKV: boolean; // Gesetzliche Krankenversicherung
  acceptsPKV: boolean; // Private Krankenversicherung
  acceptsCash: boolean;
  gkvProviders: string[]; // e.g. ["TK", "AOK", "Barmer"]
  pkvProviders: string[]; // e.g. ["DKV", "Allianz"]
  notes?: string;
}

// ─── Doctor ─────────────────────────────────────────────────────────────────

export interface Doctor {
  id: string;
  clinicId: string;
  firstName: string;
  lastName: string;
  title?: string; // "Dr. med. dent."
  specialty?: string;
  avatarUrl?: string;
  bio?: string;
  languages: string[];
  isActive: boolean;
  workingHours: WorkingHours[];
  blockedDates: BlockedDate[];
}

export interface WorkingHours {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Sun, 1=Mon … 6=Sat
  startTime: string; // "08:00"
  endTime: string;   // "18:00"
  breaks: TimeRange[];
}

export interface TimeRange {
  startTime: string; // "12:00"
  endTime: string;   // "13:00"
}

export interface BlockedDate {
  date: string;      // ISO date "2025-12-24"
  reason?: string;
  allDay: boolean;
  startTime?: string;
  endTime?: string;
}

// ─── Appointment Type ────────────────────────────────────────────────────────

export interface AppointmentType {
  id: string;
  clinicId: string;
  name: string;           // "Routine Checkup & Cleaning"
  nameDe: string;         // "Routineuntersuchung & Reinigung"
  durationMinutes: number;
  bufferMinutes: number;  // gap after appointment before next slot
  color: string;          // hex for calendar display
  isEmergency: boolean;
  description?: string;
  requiresNewPatient: boolean;
  isActive: boolean;
}

// ─── Appointment ─────────────────────────────────────────────────────────────

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "no_show"
  | "completed";

export type InsuranceType = "gkv" | "pkv" | "cash";

export interface Appointment {
  id: string;
  clinicId: string;
  doctorId: string;
  appointmentTypeId: string;
  patientId?: string; // null for anonymous bookings
  patientFirstName: string;
  patientLastName: string;
  patientEmail: string;
  patientPhone: string;
  patientDob?: string; // ISO date
  insuranceType: InsuranceType;
  insuranceProvider?: string;
  notes?: string;
  status: AppointmentStatus;
  startTime: string; // ISO datetime
  endTime: string;
  bookedAt: string;
  reminderSentAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  bookingSource: "widget" | "phone" | "walkin" | "admin";
}

// ─── Patient ─────────────────────────────────────────────────────────────────

export interface Patient {
  id: string;
  clinicId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dob?: string;
  insuranceType?: InsuranceType;
  insuranceProvider?: string;
  preferredLanguage: string;
  gdprConsentAt: string;
  marketingConsentAt?: string;
  createdAt: string;
  lastAppointmentAt?: string;
}

// ─── Available Slot ───────────────────────────────────────────────────────────

export interface AvailableSlot {
  startTime: string; // ISO datetime
  endTime: string;
  doctorId: string;
  appointmentTypeId: string;
}

// ─── Chat / AI Receptionist ───────────────────────────────────────────────────

export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export type ChatIntent =
  | "book_appointment"
  | "check_availability"
  | "faq_insurance"
  | "faq_hours"
  | "faq_parking"
  | "faq_location"
  | "faq_emergency"
  | "faq_general"
  | "cancel_appointment"
  | "reschedule_appointment"
  | "unknown";

// ─── API request/response shapes ─────────────────────────────────────────────

export interface BookingRequest {
  clinicId: string;
  doctorId: string;
  appointmentTypeId: string;
  startTime: string;
  patientFirstName: string;
  patientLastName: string;
  patientEmail: string;
  patientPhone: string;
  patientDob?: string;
  insuranceType: InsuranceType;
  insuranceProvider?: string;
  notes?: string;
  gdprConsent: boolean;
  language?: string;
}

export interface BookingResponse {
  appointment: Appointment;
  confirmationCode: string;
}

export interface SlotsQuery {
  clinicId: string;
  doctorId?: string;
  appointmentTypeId: string;
  date: string; // ISO date "2025-11-15"
}

export interface ChatRequest {
  clinicSlug: string;
  messages: ChatMessage[];
  language?: string; // "de" | "en"
}

export interface ChatResponse {
  message: string;
  intent?: ChatIntent;
  slots?: AvailableSlot[];
  suggestBooking?: boolean;
}

// ─── Admin dashboard ─────────────────────────────────────────────────────────

export interface DashboardStats {
  date: string;
  totalAppointments: number;
  confirmedAppointments: number;
  cancelledAppointments: number;
  noShows: number;
  noShowRate: number;         // 0–1
  estimatedHoursSaved: number; // AI deflection estimate
  bookingsFromWidget: number;
  bookingsFromPhone: number;
}
