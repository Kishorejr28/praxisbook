/* ─── PraxisAI Widget — embeddable chat + booking launcher ─────────────────
   Usage:
   <script src="https://cdn.praxisai.de/widget/praxisai-widget.iife.js"
           data-clinic="demo-zahnarzt-walldorf"
           data-api="https://api.praxisai.de"
           data-color="#2563eb"
           data-lang="de">
   </script>
──────────────────────────────────────────────────────────────────────────── */

import { injectStyles } from "./styles";
import { createChatUI } from "./chat";
import { createBookingUI } from "./booking";

interface Config {
  clinicSlug: string;
  apiBase: string;
  primaryColor: string;
  language: string;
}

function getConfig(): Config {
  const script =
    document.currentScript as HTMLScriptElement | null ??
    document.querySelector('script[data-clinic]') as HTMLScriptElement | null;

  return {
    clinicSlug: script?.dataset.clinic ?? "demo",
    apiBase: script?.dataset.api ?? "http://localhost:3001",
    primaryColor: script?.dataset.color ?? "#2563eb",
    language: script?.dataset.lang ?? "de",
  };
}

async function fetchClinic(apiBase: string, slug: string) {
  const res = await fetch(`${apiBase}/api/clinics/${slug}`);
  if (!res.ok) throw new Error("Clinic not found");
  return res.json();
}

function init() {
  const config = getConfig();

  injectStyles(config.primaryColor);

  // Outer host element using Shadow DOM so widget styles never clash with the clinic's website
  const host = document.createElement("div");
  host.id = "praxisai-widget-host";
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });

  const container = document.createElement("div");
  container.id = "praxisai-root";
  shadow.appendChild(container);

  // Inject scoped styles into shadow root
  const styleEl = document.createElement("style");
  styleEl.textContent = getScopedStyles(config.primaryColor);
  shadow.appendChild(styleEl);

  fetchClinic(config.apiBase, config.clinicSlug)
    .then((clinic) => {
      const color = clinic.primaryColor ?? config.primaryColor;
      styleEl.textContent = getScopedStyles(color);

      const { openBooking } = createBookingUI(container, clinic, config.apiBase, config.language, color);
      createChatUI(container, clinic, config.apiBase, config.language, color, openBooking);
    })
    .catch((err) => {
      console.error("[PraxisAI] Failed to load widget:", err);
    });
}

function getScopedStyles(color: string): string {
  return `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    #praxisai-root { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; }
    .pai-btn-primary {
      background: ${color}; color: #fff; border: none; border-radius: 8px;
      padding: 10px 18px; cursor: pointer; font-weight: 600; font-size: 13px;
      transition: opacity .15s; width: 100%;
    }
    .pai-btn-primary:hover { opacity: .88; }
    .pai-btn-primary:disabled { opacity: .5; cursor: not-allowed; }
    .pai-btn-ghost {
      background: transparent; border: 1px solid #d1d5db; border-radius: 8px;
      padding: 10px 18px; cursor: pointer; font-size: 13px; width: 100%;
    }
    .pai-input {
      border: 1px solid #d1d5db; border-radius: 8px; padding: 8px 12px;
      font-size: 13px; width: 100%; outline: none;
    }
    .pai-input:focus { border-color: ${color}; box-shadow: 0 0 0 3px ${color}22; }
    .pai-select { ${''/* same as input */} }
    .pai-badge {
      display: inline-block; padding: 2px 8px; border-radius: 99px;
      font-size: 11px; font-weight: 600;
    }
    .pai-badge-green { background: #dcfce7; color: #166534; }
    .pai-badge-yellow { background: #fef9c3; color: #854d0e; }
    .pai-badge-red { background: #fee2e2; color: #991b1b; }
  `;
}

// Auto-init when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
