import type { Metadata } from "next";
import { ClinicPage } from "./ClinicPage";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  try {
    const res = await fetch(`${apiBase}/api/clinics/${params.slug}`, { next: { revalidate: 3600 } });
    const clinic = await res.json();
    return {
      title: `${clinic.name} — Online Termin buchen | PraxisBook`,
      description: `Buchen Sie online einen Termin bei ${clinic.name} in ${clinic.city}. Schnell, einfach und ohne Wartezeit. GKV & PKV willkommen.`,
      keywords: [`Zahnarzt ${clinic.city}`, `Termin buchen ${clinic.city}`, clinic.name],
    };
  } catch {
    return { title: "Zahnarztpraxis | PraxisBook" };
  }
}

export default function KlinikPage({ params }: Props) {
  return <ClinicPage slug={params.slug} />;
}
