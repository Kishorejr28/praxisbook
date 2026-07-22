"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { RuleBasedChat } from "@/components/chat/RuleBasedChat";
import { PraxisBookBadge } from "@/components/ui/PraxisBookBadge";
import {
  MapPin, Phone, Clock, Shield, Star, ChevronRight,
  CheckCircle, Car, Calendar, Globe, Menu, X,
} from "lucide-react";

// ── i18n ─────────────────────────────────────────────────────────────────────
const T = {
  de: {
    nav: { book: "Termin buchen", call: "Anrufen" },
    hero: { badge: "Online Terminbuchung — 24/7 verfügbar", cta: "Termin buchen", ctaPhone: "Anrufen" },
    infoStrip: { hours: "Öffnungszeiten", parking: "Parkplätze", insurance: "Versicherung", booking: "Online Buchung", hoursVal: "Mo – Fr  08:00 – 18:00", bookingVal: "24/7 verfügbar" },
    services: { title: "Unsere Leistungen", sub: "Wählen Sie Ihre Behandlung und buchen Sie sofort online", minutes: "min", cta: "Jetzt buchen" },
    team: { title: "Unser Team", sub: "Erfahrene Zahnärzte, die sich Zeit für Sie nehmen",
      bioSuffix: "Jetzt Termin buchen", languages: "Sprachen", yearsLabel: "Jahre Erfahrung" },
    insurance: { title: "Versicherung & Abrechnung", sub: "Wir behandeln alle Patienten — direkte Abrechnung mit Ihrer Kasse", gkv: "Gesetzlich versichert (GKV)", pkv: "Privatversichert (PKV)", self: "Selbstzahler", gkvNote: "Direkte Abrechnung — keine Vorkasse.", pkvNote: "Alle gängigen PKV-Anbieter.", selfNote: "Transparente Preise auf Anfrage." },
    faq: { title: "Häufige Fragen" },
    reviews: { title: "Patientenbewertungen", sub: "Was unsere Patienten sagen" },
    location: { title: "Anfahrt", maps: "In Google Maps öffnen", emergency: "Notfall" },
    cta: { title: "Bereit für Ihren nächsten Termin?", sub: "Buchen Sie jetzt online — in unter 2 Minuten, rund um die Uhr", btn: "Termin buchen" },
    footer: { privacy: "Datenschutz", imprint: "Impressum", powered: "Powered by PraxisBook" },
  },
  en: {
    nav: { book: "Book appointment", call: "Call us" },
    hero: { badge: "Online booking — available 24/7", cta: "Book appointment", ctaPhone: "Call us" },
    infoStrip: { hours: "Opening hours", parking: "Parking", insurance: "Insurance", booking: "Online booking", hoursVal: "Mon – Fri  8:00 AM – 6:00 PM", bookingVal: "Available 24/7" },
    services: { title: "Our Services", sub: "Select your treatment and book instantly online", minutes: "min", cta: "Book now" },
    team: { title: "Our Team", sub: "Experienced dentists who take time for you",
      bioSuffix: "Book appointment", languages: "Languages", yearsLabel: "years experience" },
    insurance: { title: "Insurance & Billing", sub: "We treat all patients — direct billing with your insurer", gkv: "Public insurance (GKV)", pkv: "Private insurance (PKV)", self: "Self-pay", gkvNote: "Direct billing — no upfront payment.", pkvNote: "All major private insurers accepted.", selfNote: "Transparent pricing on request." },
    faq: { title: "Frequently Asked Questions" },
    reviews: { title: "Patient Reviews", sub: "What our patients say" },
    location: { title: "Find Us", maps: "Open in Google Maps", emergency: "Emergency" },
    cta: { title: "Ready for your next appointment?", sub: "Book online now — in under 2 minutes, anytime", btn: "Book appointment" },
    footer: { privacy: "Privacy", imprint: "Imprint", powered: "Powered by PraxisBook" },
  },
};

const REVIEWS = {
  de: [
    { name: "Anna M.", date: "Juli 2026", text: "Super Praxis! Online Termin buchen war so einfach — keine Warteschleife am Telefon. Das Team ist sehr nett und professionell." },
    { name: "Michael W.", date: "Juni 2026", text: "Endlich eine Praxis mit echter Online-Buchung. Dr. Mustermann hat sich viel Zeit genommen und alles ausführlich erklärt." },
    { name: "Sophie B.", date: "Juni 2026", text: "Notfalltermin innerhalb von 2 Stunden! Über den Chat sofort Bescheid bekommen. Kann ich sehr empfehlen." },
  ],
  en: [
    { name: "Anna M.", date: "July 2026", text: "Great practice! Booking online was so easy — no phone queues. The team is very friendly and professional." },
    { name: "Michael W.", date: "June 2026", text: "Finally a practice with real online booking. Dr. Mustermann took plenty of time and explained everything clearly." },
    { name: "Sophie B.", date: "June 2026", text: "Emergency appointment within 2 hours! Got notified instantly via chat. Highly recommend." },
  ],
};

// ── Component ─────────────────────────────────────────────────────────────────
export function ClinicPage({ slug }: { slug: string }) {
  const [clinic, setClinic] = useState<any>(null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [apptTypes, setApptTypes] = useState<any[]>([]);
  const [lang, setLang] = useState<"de" | "en">("de");
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    Promise.all([api.clinic.get(slug), api.clinic.doctors(slug), api.clinic.appointmentTypes(slug)])
      .then(([c, d, t]) => { setClinic(c); setDoctors(d); setApptTypes(t); });
  }, [slug]);

  if (!clinic) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-9 h-9 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const t = T[lang];
  const color = clinic.primaryColor ?? "#2563eb";
  const bookUrl = `/buchen/${slug}`;
  const typeName = (tp: any) => lang === "en" ? tp.name : tp.nameDe;

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>

      {/* ── Navbar ───────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: color }}>
              {clinic.name[0]}
            </div>
            <span className="font-semibold text-gray-900 text-sm hidden sm:block">{clinic.name}</span>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <button onClick={() => setLang(l => l === "de" ? "en" : "de")}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded-full px-3 py-1.5 transition-colors">
              <Globe className="w-3.5 h-3.5" />{lang === "de" ? "English" : "Deutsch"}
            </button>
            <a href={`tel:${clinic.phone}`}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors">
              {t.nav.call}
            </a>
            <a href={bookUrl}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: color }}>
              {t.nav.book}
            </a>
          </div>
          <button className="sm:hidden p-2" onClick={() => setMobileMenu(v => !v)}>
            {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {mobileMenu && (
          <div className="sm:hidden border-t border-gray-100 px-5 py-4 flex flex-col gap-3 bg-white">
            <button onClick={() => setLang(l => l === "de" ? "en" : "de")}
              className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-2 w-fit">
              <Globe className="w-4 h-4" />{lang === "de" ? "English" : "Deutsch"}
            </button>
            <a href={`tel:${clinic.phone}`} className="text-sm text-gray-700 py-1">{t.nav.call}: {clinic.phone}</a>
            <a href={bookUrl} className="text-sm font-semibold text-white py-2.5 px-4 rounded-xl text-center" style={{ backgroundColor: color }}>{t.nav.book}</a>
          </div>
        )}
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Background image with overlay */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1400&q=80&auto=format&fit=crop"
            alt="Modern dental practice"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/85 via-gray-900/60 to-transparent" />
        </div>

        <div className="relative max-w-6xl mx-auto px-5 py-24 sm:py-32">
          <div className="max-w-xl">
            <span className="inline-block text-xs font-semibold px-3 py-1.5 rounded-full mb-5 text-white/90 border border-white/30 backdrop-blur-sm">
              {t.hero.badge}
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl font-bold text-white leading-tight mb-3">
              {clinic.name}
            </h1>
            <p className="text-white/70 text-lg mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              {clinic.address}, {clinic.postalCode} {clinic.city}
            </p>
            <p className="text-white/70 mb-2 flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 flex-shrink-0" />
              <a href={`tel:${clinic.phone}`} className="hover:text-white transition-colors">{clinic.phone}</a>
            </p>
            <div className="flex items-center gap-1 mb-8 mt-4">
              {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
              <span className="text-white/70 text-sm ml-1.5">4.9 · 127 {lang === "de" ? "Bewertungen" : "reviews"}</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href={bookUrl}
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-white font-semibold text-base transition-opacity hover:opacity-90 shadow-lg"
                style={{ backgroundColor: color }}>
                <Calendar className="w-5 h-5" />{t.hero.cta}
              </a>
              <a href={`tel:${clinic.phone}`}
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/30 text-white font-semibold text-base hover:bg-white/20 transition-colors">
                <Phone className="w-5 h-5" />{t.hero.ctaPhone}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Info strip ───────────────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-5 py-6 grid grid-cols-2 sm:grid-cols-4 gap-6">
          <InfoTile icon={Clock} label={t.infoStrip.hours} value={t.infoStrip.hoursVal} color={color} />
          <InfoTile icon={Car} label={t.infoStrip.parking} value={clinic.parkingInfo ?? (lang === "de" ? "Vorhanden" : "Available")} color={color} />
          <InfoTile icon={Shield} label={t.infoStrip.insurance}
            value={[clinic.acceptsGKV && "GKV", clinic.acceptsPKV && "PKV", clinic.acceptsCash && (lang === "de" ? "Selbstzahler" : "Self-pay")].filter(Boolean).join(" · ")} color={color} />
          <InfoTile icon={CheckCircle} label={t.infoStrip.booking} value={t.infoStrip.bookingVal} color={color} />
        </div>
      </section>

      {/* ── Services ─────────────────────────────────────────────────── */}
      <section className="py-20 px-5 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <SectionHeader title={t.services.title} sub={t.services.sub} />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {apptTypes.map((tp) => (
              <a key={tp.id} href={bookUrl}
                className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all group flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: tp.color + "18" }}>
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tp.color }} />
                  </span>
                  {tp.isEmergency && (
                    <span className="text-xs font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                      {lang === "de" ? "Notfall" : "Emergency"}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{typeName(tp)}</p>
                  <p className="text-xs text-gray-400 mt-1">ca. {tp.durationMinutes} {t.services.minutes}</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold mt-auto pt-1" style={{ color }}>
                  {t.services.cta} <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── About / Team ─────────────────────────────────────────────── */}
      <section className="py-24 px-5 bg-white">
        <div className="max-w-6xl mx-auto">
          {/* Section intro */}
          <div className="max-w-2xl mb-14">
            <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color }}>
              {lang === "de" ? "Das Team" : "Meet the team"}
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-gray-900 leading-snug mb-4">
              {t.team.title}
            </h2>
            <p className="text-gray-500 text-lg leading-relaxed">{t.team.sub}</p>
          </div>

          {/* Doctor cards */}
          <div className="grid sm:grid-cols-2 gap-6">
            {doctors.map((d, i) => {
              const bios = {
                de: [
                  `${d.title ?? "Dr. med. dent."} ${d.firstName} ${d.lastName} ist Fachzahnärztin für allgemeine Zahnheilkunde mit über 15 Jahren Erfahrung. Nach ihrem Studium an der Universität Heidelberg spezialisierte sie sich auf ästhetische und präventive Zahnmedizin. Ihr Ansatz: Jeder Patient verdient eine individuelle Behandlung in einer ruhigen, vertrauensvollen Atmosphäre.`,
                  `${d.title ?? "Dr. med. dent."} ${d.firstName} ${d.lastName} ist Spezialist für ${d.specialty ?? "Kieferorthopädie"} und behandelt sowohl Kinder als auch Erwachsene. Er hat zahlreiche Fortbildungen in der Implantatprothetik absolviert und legt großen Wert auf schmerzarme Behandlungsmethoden. In seiner Freizeit engagiert er sich ehrenamtlich in der zahnmedizinischen Aufklärung.`,
                ],
                en: [
                  `${d.title ?? "Dr. med. dent."} ${d.firstName} ${d.lastName} is a specialist in general dentistry with over 15 years of experience. After graduating from Heidelberg University, she focused on aesthetic and preventive dental care. Her philosophy: every patient deserves personalised treatment in a calm, trusting environment.`,
                  `${d.title ?? "Dr. med. dent."} ${d.firstName} ${d.lastName} specialises in ${d.specialty ?? "orthodontics"} and treats both children and adults. He has completed advanced training in implant prosthetics and prioritises minimally invasive, pain-free techniques. Outside the practice he volunteers in dental health education.`,
                ],
              };
              const bio = bios[lang][i] ?? bios[lang][0];
              // Rotating gradient colours for avatars
              const avatarGradients = [
                "from-blue-500 to-blue-700",
                "from-teal-500 to-teal-700",
                "from-violet-500 to-violet-700",
                "from-emerald-500 to-emerald-700",
              ];
              const gradient = avatarGradients[i % avatarGradients.length];

              return (
                <div key={d.id} className="bg-gray-50 rounded-3xl p-7 border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all">
                  {/* Avatar + name row */}
                  <div className="flex items-start gap-5 mb-5">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xl font-bold flex-shrink-0 shadow-md`}>
                      {d.firstName[0]}{d.lastName[0]}
                    </div>
                    <div>
                      <p className="font-serif text-lg font-semibold text-gray-900 leading-tight">
                        {d.title} {d.firstName} {d.lastName}
                      </p>
                      <p className="text-sm font-medium mt-0.5" style={{ color }}>
                        {d.specialty ?? "Allgemeine Zahnheilkunde"}
                      </p>
                      {/* Language tags */}
                      <div className="flex items-center gap-1.5 mt-2">
                        {d.languages?.map((l: string) => (
                          <span key={l} className="text-[10px] font-semibold border border-gray-200 bg-white px-2 py-0.5 rounded-full text-gray-500 uppercase tracking-wide">
                            {l}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="text-sm text-gray-500 leading-relaxed border-t border-gray-200 pt-5">
                    {bio}
                  </p>

                  {/* Note about own photo */}
                  <p className="mt-4 text-[11px] text-gray-300 italic">
                    {lang === "de"
                      ? "* Praxisfoto wird nach Onboarding eingefügt"
                      : "* Practice photo added after onboarding"}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Practice values strip */}
          <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {(lang === "de"
              ? [
                  { emoji: "🦷", title: "Schmerzarme Behandlung", sub: "Modernste Methoden" },
                  { emoji: "🕐", title: "Pünktliche Termine", sub: "Keine langen Wartezeiten" },
                  { emoji: "🌍", title: "Mehrsprachig", sub: "Deutsch & Englisch" },
                  { emoji: "🏥", title: "Alle Kassen", sub: "GKV, PKV & Selbstzahler" },
                ]
              : [
                  { emoji: "🦷", title: "Pain-free treatment", sub: "Latest techniques" },
                  { emoji: "🕐", title: "On-time appointments", sub: "No long waiting times" },
                  { emoji: "🌍", title: "Multilingual", sub: "German & English" },
                  { emoji: "🏥", title: "All insurances", sub: "GKV, PKV & self-pay" },
                ]
            ).map((v) => (
              <div key={v.title} className="bg-white rounded-2xl p-5 border border-gray-100 text-center">
                <div className="text-3xl mb-3">{v.emoji}</div>
                <p className="font-semibold text-sm text-gray-800">{v.title}</p>
                <p className="text-xs text-gray-400 mt-1">{v.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Insurance ────────────────────────────────────────────────── */}
      <section className="py-20 px-5 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <SectionHeader title={t.insurance.title} sub={t.insurance.sub} />
          <div className="grid sm:grid-cols-3 gap-6">
            {clinic.acceptsGKV && (
              <InsuranceCard title={t.insurance.gkv} note={t.insurance.gkvNote} color="#16a34a"
                items={clinic.gkvProviders?.length ? clinic.gkvProviders.slice(0,5) : ["TK", "AOK", "Barmer", "DAK", "KKH"]} />
            )}
            {clinic.acceptsPKV && (
              <InsuranceCard title={t.insurance.pkv} note={t.insurance.pkvNote} color="#2563eb"
                items={clinic.pkvProviders?.length ? clinic.pkvProviders.slice(0,4) : ["DKV", "Allianz", "AXA", "Bupa"]} />
            )}
            {clinic.acceptsCash && (
              <InsuranceCard title={t.insurance.self} note={t.insurance.selfNote} color="#9333ea"
                items={[lang === "de" ? "Privatrechnung" : "Private invoice", lang === "de" ? "Barzahlung" : "Cash", "EC / Kreditkarte"]} />
            )}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      {clinic.faqItems?.filter((f: any) => f.language === lang).length > 0 && (
        <section className="py-20 px-5">
          <div className="max-w-3xl mx-auto">
            <SectionHeader title={t.faq.title} sub="" />
            <div className="space-y-2 mt-8">
              {clinic.faqItems.filter((f: any) => f.language === lang).map((f: any) => (
                <details key={f.id} className="bg-white rounded-2xl border border-gray-100 hover:border-blue-200 transition-all group overflow-hidden">
                  <summary className="px-6 py-4 font-medium text-gray-800 cursor-pointer list-none flex items-center justify-between text-sm">
                    {f.question}
                    <ChevronRight className="w-4 h-4 text-gray-400 group-open:rotate-90 transition-transform flex-shrink-0 ml-2" />
                  </summary>
                  <p className="px-6 pb-5 text-sm text-gray-500 leading-relaxed">{f.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Reviews ──────────────────────────────────────────────────── */}
      <section className="py-20 px-5 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <SectionHeader title={t.reviews.title} sub={t.reviews.sub} />
          <div className="grid sm:grid-cols-3 gap-6 mt-10">
            {REVIEWS[lang].map((r, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-0.5 mb-4">
                  {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-5">"{r.text}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                    {r.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{r.name}</p>
                    <p className="text-xs text-gray-400">{r.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Location ─────────────────────────────────────────────────── */}
      <section className="py-20 px-5">
        <div className="max-w-6xl mx-auto">
          <SectionHeader title={t.location.title} sub="" />
          <div className="grid lg:grid-cols-2 gap-10 items-start mt-10">
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                <MapPin className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{lang === "de" ? "Adresse" : "Address"}</p>
                  <p className="text-gray-500 text-sm">{clinic.address}, {clinic.postalCode} {clinic.city}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                <Phone className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{lang === "de" ? "Telefon" : "Phone"}</p>
                  <a href={`tel:${clinic.phone}`} className="text-gray-500 text-sm hover:text-blue-600">{clinic.phone}</a>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                <Car className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{lang === "de" ? "Parken" : "Parking"}</p>
                  <p className="text-gray-500 text-sm">{clinic.parkingInfo ?? (lang === "de" ? "Vorhanden" : "Available")}</p>
                </div>
              </div>
              {clinic.emergencyPhone && (
                <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
                  <span className="text-xl">🚨</span>
                  <div>
                    <p className="font-semibold text-red-700 text-sm">{t.location.emergency}</p>
                    <a href={`tel:${clinic.emergencyPhone}`} className="text-red-600 text-sm font-mono">{clinic.emergencyPhone}</a>
                  </div>
                </div>
              )}
            </div>
            {/* Map placeholder with clinic photo */}
            <div className="rounded-2xl overflow-hidden shadow-md aspect-video bg-gray-100 relative">
              <img
                src="https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80&auto=format&fit=crop"
                alt="Clinic exterior"
                className="w-full h-full object-cover"
              />
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinic.address + ", " + clinic.city)}`}
                target="_blank" rel="noopener noreferrer"
                className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-xl px-4 py-2.5 shadow-lg text-sm font-semibold text-gray-800 hover:shadow-xl transition-shadow flex items-center gap-2 whitespace-nowrap"
              >
                <MapPin className="w-4 h-4 text-red-500" />
                {t.location.maps}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA banner ───────────────────────────────────────────────── */}
      <section className="py-20 px-5 text-white relative overflow-hidden" style={{ backgroundColor: color }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="font-serif text-3xl font-bold mb-3">{t.cta.title}</h2>
          <p className="opacity-80 mb-8 text-lg">{t.cta.sub}</p>
          <a href={bookUrl}
            className="inline-flex items-center gap-2 bg-white font-semibold px-8 py-4 rounded-xl transition-all hover:shadow-xl hover:-translate-y-0.5 text-base"
            style={{ color }}>
            <Calendar className="w-5 h-5" />{t.cta.btn}
          </a>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="bg-gray-900 text-gray-400 px-5 py-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between gap-6">
          <div>
            <p className="text-white font-bold text-base mb-1">{clinic.name}</p>
            <p className="text-sm">{clinic.address}, {clinic.postalCode} {clinic.city}</p>
            <p className="text-sm mt-0.5">{clinic.phone}</p>
          </div>
          <div className="flex flex-col sm:items-end gap-3">
            <div className="flex gap-4 text-sm">
              <a href="/datenschutz" className="hover:text-white transition-colors">{t.footer.privacy}</a>
              <a href="/impressum" className="hover:text-white transition-colors">{t.footer.imprint}</a>
            </div>
            <p className="text-xs text-gray-500">© {new Date().getFullYear()} {t.footer.powered}</p>
          </div>
        </div>
      </footer>

      <RuleBasedChat clinic={clinic} primaryColor={color} onBookingRequested={() => { window.location.href = bookUrl; }} />
      <PraxisBookBadge demo />
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ title, sub, left }: { title: string; sub: string; left?: boolean }) {
  return (
    <div className={left ? "" : "text-center"}>
      <h2 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 leading-snug">{title}</h2>
      {sub && <p className="text-gray-400 mt-3 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">{sub}</p>}
    </div>
  );
}

function InfoTile({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: color + "15" }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-semibold text-gray-800 mt-0.5 leading-snug">{value}</p>
      </div>
    </div>
  );
}

function InsuranceCard({ title, note, color, items }: { title: string; note: string; color: string; items: string[] }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: color + "15" }}>
        <Shield className="w-5 h-5" style={{ color }} />
      </div>
      <p className="font-bold text-gray-900 mb-1">{title}</p>
      <p className="text-xs text-gray-400 mb-4 leading-relaxed">{note}</p>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
            <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color }} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
