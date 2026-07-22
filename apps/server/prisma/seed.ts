import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Demo clinic — Praxisklinik Walldorf style
  const clinic = await prisma.clinic.upsert({
    where: { slug: "demo-zahnarzt-walldorf" },
    update: {},
    create: {
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
      pkvProviders: ["DKV", "Allianz", "AXA", "Bupa"],
      widgetGreeting:
        "Hallo! Ich bin Ihr KI-Rezeptionist. Wie kann ich Ihnen helfen?",
    },
  });

  // Demo doctor
  const doctor = await prisma.doctor.upsert({
    where: { id: "demo-doctor-1" },
    update: {},
    create: {
      id: "demo-doctor-1",
      clinicId: clinic.id,
      firstName: "Maria",
      lastName: "Mustermann",
      title: "Dr. med. dent.",
      specialty: "Allgemeine Zahnheilkunde",
      languages: ["de", "en"],
      isActive: true,
    },
  });

  // Working hours Mon–Fri 8–18 with lunch 12–13
  const days = [1, 2, 3, 4, 5];
  for (const day of days) {
    const wh = await prisma.workingHours.create({
      data: {
        doctorId: doctor.id,
        dayOfWeek: day,
        startTime: "08:00",
        endTime: "18:00",
      },
    });
    await prisma.break.create({
      data: { workingHoursId: wh.id, startTime: "12:00", endTime: "13:00" },
    });
  }

  // Appointment types
  await prisma.appointmentType.createMany({
    skipDuplicates: true,
    data: [
      {
        clinicId: clinic.id,
        name: "Routine Checkup & Cleaning",
        nameDe: "Routineuntersuchung & Reinigung",
        durationMinutes: 45,
        bufferMinutes: 15,
        color: "#2563eb",
        isEmergency: false,
      },
      {
        clinicId: clinic.id,
        name: "New Patient Consultation",
        nameDe: "Erstberatung Neupatienten",
        durationMinutes: 60,
        bufferMinutes: 15,
        color: "#16a34a",
        isEmergency: false,
        requiresNew: true,
      },
      {
        clinicId: clinic.id,
        name: "Pain / Emergency Consultation",
        nameDe: "Schmerzbehandlung / Notfall",
        durationMinutes: 30,
        bufferMinutes: 0,
        color: "#dc2626",
        isEmergency: true,
      },
      {
        clinicId: clinic.id,
        name: "Follow-up",
        nameDe: "Nachsorge / Kontrolltermin",
        durationMinutes: 20,
        bufferMinutes: 10,
        color: "#9333ea",
        isEmergency: false,
      },
    ],
  });

  // FAQ items
  await prisma.faqItem.createMany({
    skipDuplicates: true,
    data: [
      {
        clinicId: clinic.id,
        question: "Haben Sie Parkplätze?",
        answer:
          "Ja, wir haben kostenlose Parkplätze direkt vor der Praxis.",
        category: "parking",
        language: "de",
        sortOrder: 1,
      },
      {
        clinicId: clinic.id,
        question: "Do you have parking?",
        answer: "Yes, free parking is available directly in front of our practice.",
        category: "parking",
        language: "en",
        sortOrder: 1,
      },
      {
        clinicId: clinic.id,
        question: "Welche Krankenkassen akzeptieren Sie?",
        answer:
          "Wir behandeln Patienten aller gesetzlichen Krankenkassen (TK, AOK, Barmer, DAK, KKH u.a.) sowie Privatpatienten.",
        category: "insurance",
        language: "de",
        sortOrder: 2,
      },
      {
        clinicId: clinic.id,
        question: "Which health insurance do you accept?",
        answer:
          "We accept all statutory health insurances (TK, AOK, Barmer, DAK, KKH, etc.) as well as private insurance and self-pay patients.",
        category: "insurance",
        language: "en",
        sortOrder: 2,
      },
      {
        clinicId: clinic.id,
        question: "Was sind Ihre Öffnungszeiten?",
        answer:
          "Wir sind Montag bis Freitag von 8:00 bis 18:00 Uhr für Sie geöffnet.",
        category: "hours",
        language: "de",
        sortOrder: 3,
      },
      {
        clinicId: clinic.id,
        question: "What are your opening hours?",
        answer: "We are open Monday to Friday from 8:00 AM to 6:00 PM.",
        category: "hours",
        language: "en",
        sortOrder: 3,
      },
      {
        clinicId: clinic.id,
        question: "Was tun bei einem Zahnnotfall?",
        answer:
          "Bitte rufen Sie uns sofort unter +49 6227 999999 an. Bei schweren Verletzungen wenden Sie sich an den zahnärztlichen Notfalldienst.",
        category: "emergency",
        language: "de",
        sortOrder: 4,
      },
    ],
  });

  console.log("Seed complete. Clinic slug:", clinic.slug);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
