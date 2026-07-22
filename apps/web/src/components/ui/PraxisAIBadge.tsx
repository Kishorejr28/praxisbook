"use client";

// Floating "Powered by PraxisAI" watermark badge.
// Shows on all public clinic-facing pages.
// In DEMO mode it is more prominent (animated pulse + "DEMO" label).
// In production it is subtle — small bottom-left badge.

interface Props {
  demo?: boolean;
}

export function PraxisAIBadge({ demo = false }: Props) {
  if (demo) {
    return (
      <>
        {/* Semi-transparent diagonal DEMO stamp across page */}
        <div
          className="fixed inset-0 pointer-events-none z-40 flex items-center justify-center"
          aria-hidden="true"
        >
          <p
            className="text-[clamp(48px,10vw,96px)] font-black uppercase tracking-widest opacity-[0.04] text-gray-900 select-none"
            style={{
              transform: "rotate(-30deg)",
              fontFamily: "var(--font-playfair, serif)",
              whiteSpace: "nowrap",
            }}
          >
            DEMO — PraxisAI
          </p>
        </div>

        {/* Prominent bottom badge in demo mode */}
        <a
          href="https://praxisai.de"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-5 left-5 z-50 flex items-center gap-2 bg-white border border-blue-200 shadow-lg rounded-full px-4 py-2 text-xs font-semibold text-blue-700 hover:shadow-xl transition-all hover:-translate-y-0.5 group"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
          </span>
          <span>Demo · Powered by <strong>PraxisAI</strong></span>
          <span className="bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded text-[10px] font-bold">DEMO</span>
        </a>
      </>
    );
  }

  // Production: subtle bottom-left badge
  return (
    <a
      href="https://praxisai.de"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-1.5 bg-white/80 backdrop-blur border border-gray-100 shadow-sm rounded-full px-3 py-1.5 text-[11px] text-gray-400 hover:text-gray-700 hover:shadow-md transition-all"
    >
      <svg className="w-3 h-3 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      Powered by <strong className="text-gray-600 ml-0.5">PraxisAI</strong>
    </a>
  );
}
