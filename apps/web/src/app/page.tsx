export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-brand-700 mb-2">PraxisBook</h1>
        <p className="text-gray-500 text-lg">KI-Rezeptionist & Online-Terminbuchung für Zahnarztpraxen</p>
      </div>
      <div className="flex gap-4">
        <a href="/admin" className="px-6 py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors">
          Admin Dashboard
        </a>
        <a href="/book/demo-zahnarzt-walldorf" className="px-6 py-3 border border-brand-600 text-brand-600 rounded-lg font-medium hover:bg-brand-50 transition-colors">
          Demo Buchung
        </a>
      </div>
    </main>
  );
}
