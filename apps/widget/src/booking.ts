export function createBookingUI(
  root: HTMLElement,
  clinic: any,
  apiBase: string,
  language: string,
  color: string,
  _onClose?: () => void
) {
  const t = {
    selectTreatment: language === "de" ? "Behandlung wählen" : "Select treatment",
    selectDate: language === "de" ? "Datum wählen" : "Select date",
    yourDetails: language === "de" ? "Ihre Daten" : "Your details",
    confirmation: language === "de" ? "Bestätigung" : "Confirmation",
    noSlots: language === "de" ? "Keine freien Termine." : "No slots available.",
    book: language === "de" ? "Termin bestätigen" : "Confirm appointment",
    back: language === "de" ? "← Zurück" : "← Back",
    close: language === "de" ? "Schließen" : "Close",
    booked: language === "de" ? "Termin gebucht! ✓" : "Appointment booked! ✓",
    confirmEmail: language === "de" ? "Bestätigung per E-Mail erhalten." : "Confirmation email sent.",
    gdpr: language === "de"
      ? "Ich stimme der Verarbeitung meiner Daten gemäß Datenschutzerklärung zu."
      : "I agree to the processing of my data per the privacy policy.",
  };

  const overlay = document.createElement("div");
  overlay.id = "pai-booking-overlay";
  overlay.style.cssText = `
    display:none; position:fixed; inset:0; background:rgba(0,0,0,.4);
    z-index:9999; align-items:center; justify-content:center;
  `;

  const modal = document.createElement("div");
  modal.style.cssText = `
    background:#fff; border-radius:16px; width:min(420px,96vw);
    max-height:90vh; overflow-y:auto; padding:24px;
    position:relative; box-shadow:0 20px 60px rgba(0,0,0,.2);
  `;
  overlay.appendChild(modal);
  root.appendChild(overlay);

  let step: "type" | "slot" | "form" | "done" = "type";
  let selectedType: any = null;
  let selectedSlot: any = null;
  let apptTypes: any[] = [];

  async function loadTypes() {
    const res = await fetch(`${apiBase}/api/clinics/${clinic.slug}/appointment-types`);
    apptTypes = await res.json();
  }

  function render() {
    modal.innerHTML = `
      <button id="pai-modal-close" style="
        position:absolute;top:12px;right:14px;background:none;border:none;
        font-size:22px;cursor:pointer;color:#9ca3af;line-height:1;
      ">×</button>
      <h2 style="font-weight:700;font-size:16px;margin-bottom:16px;color:#111827;">
        ${clinic.name}
      </h2>
      ${renderStep()}
    `;
    modal.querySelector("#pai-modal-close")?.addEventListener("click", close);
    bindEvents();
  }

  function renderStep(): string {
    if (step === "type") return renderTypeStep();
    if (step === "slot") return renderSlotStep();
    if (step === "form") return renderFormStep();
    return renderDoneStep();
  }

  function renderTypeStep(): string {
    return `
      <p style="color:#6b7280;font-size:13px;margin-bottom:12px;">${t.selectTreatment}</p>
      <div style="display:flex;flex-direction:column;gap:8px;" id="pai-types">
        ${apptTypes.map((tp) => `
          <button data-id="${tp.id}" class="pai-type-btn" style="
            border:1px solid #e5e7eb;border-radius:10px;padding:12px;cursor:pointer;
            background:#fff;text-align:left;display:flex;align-items:center;gap:10px;
            transition:border-color .15s,background .15s;
          ">
            <span style="width:10px;height:10px;border-radius:50%;flex-shrink:0;background:${tp.color};"></span>
            <span>
              <strong style="display:block;font-size:13px;">${tp.nameDe}</strong>
              <span style="font-size:11px;color:#9ca3af;">${tp.durationMinutes} Min.</span>
            </span>
            ${tp.isEmergency ? `<span style="margin-left:auto;font-size:10px;background:#fee2e2;color:#991b1b;padding:2px 6px;border-radius:99px;">Notfall</span>` : ""}
          </button>
        `).join("")}
      </div>
    `;
  }

  function renderSlotStep(): string {
    return `
      <p style="font-size:13px;color:#6b7280;margin-bottom:12px;">${t.selectDate}</p>
      <label style="display:block;font-size:12px;color:#374151;margin-bottom:4px;">Datum</label>
      <input type="date" id="pai-date-input" class="pai-input"
        value="${new Date().toISOString().split("T")[0]}"
        min="${new Date().toISOString().split("T")[0]}"
        style="margin-bottom:12px;"
      />
      <div id="pai-slots-container" style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;min-height:40px;">
        <span style="color:#9ca3af;font-size:12px;grid-column:1/-1;">Datum wählen…</span>
      </div>
      <button id="pai-back-type" class="pai-btn-ghost" style="margin-top:12px;">${t.back}</button>
    `;
  }

  function renderFormStep(): string {
    const timeStr = selectedSlot
      ? new Date(selectedSlot.startTime).toLocaleString(language === "de" ? "de-DE" : "en-GB", {
          timeZone: "Europe/Berlin", dateStyle: "medium", timeStyle: "short",
        })
      : "";
    return `
      <div style="background:#eff6ff;border-radius:8px;padding:10px;margin-bottom:14px;font-size:12px;color:#1d4ed8;">
        📅 ${timeStr}
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;" id="pai-form">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <div>
            <label style="display:block;font-size:11px;color:#374151;margin-bottom:3px;">Vorname *</label>
            <input id="pai-fname" class="pai-input" required />
          </div>
          <div>
            <label style="display:block;font-size:11px;color:#374151;margin-bottom:3px;">Nachname *</label>
            <input id="pai-lname" class="pai-input" required />
          </div>
        </div>
        <div>
          <label style="display:block;font-size:11px;color:#374151;margin-bottom:3px;">E-Mail *</label>
          <input id="pai-email" class="pai-input" type="email" required />
        </div>
        <div>
          <label style="display:block;font-size:11px;color:#374151;margin-bottom:3px;">Telefon *</label>
          <input id="pai-phone" class="pai-input" type="tel" required />
        </div>
        <div>
          <label style="display:block;font-size:11px;color:#374151;margin-bottom:3px;">Versicherung *</label>
          <select id="pai-insurance" class="pai-input">
            <option value="gkv">Gesetzlich (GKV)</option>
            <option value="pkv">Privat (PKV)</option>
            <option value="cash">Selbstzahler</option>
          </select>
        </div>
        <label style="display:flex;align-items:flex-start;gap:6px;font-size:11px;color:#6b7280;cursor:pointer;">
          <input id="pai-gdpr" type="checkbox" style="margin-top:2px;" />
          ${t.gdpr}
        </label>
        <div id="pai-form-error" style="color:#dc2626;font-size:11px;display:none;"></div>
        <button id="pai-submit" class="pai-btn-primary">${t.book}</button>
        <button id="pai-back-slot" class="pai-btn-ghost">${t.back}</button>
      </div>
    `;
  }

  function renderDoneStep(): string {
    return `
      <div style="text-align:center;padding:20px 0;">
        <div style="font-size:48px;margin-bottom:12px;">✅</div>
        <h3 style="font-weight:700;font-size:16px;margin-bottom:6px;">${t.booked}</h3>
        <p style="color:#6b7280;font-size:13px;">${t.confirmEmail}</p>
        <button id="pai-done-close" class="pai-btn-primary" style="margin-top:20px;">${t.close}</button>
      </div>
    `;
  }

  function bindEvents() {
    // Type selection
    modal.querySelectorAll<HTMLElement>(".pai-type-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectedType = apptTypes.find((t) => t.id === btn.dataset.id);
        step = "slot";
        render();
      });
    });

    // Date change → load slots
    const dateInput = modal.querySelector<HTMLInputElement>("#pai-date-input");
    dateInput?.addEventListener("change", () => loadSlots(dateInput.value));

    modal.querySelector("#pai-back-type")?.addEventListener("click", () => { step = "type"; render(); });
    modal.querySelector("#pai-back-slot")?.addEventListener("click", () => { step = "slot"; render(); });
    modal.querySelector("#pai-done-close")?.addEventListener("click", close);

    // Submit
    modal.querySelector("#pai-submit")?.addEventListener("click", async () => {
      const fname = (modal.querySelector("#pai-fname") as HTMLInputElement)?.value.trim();
      const lname = (modal.querySelector("#pai-lname") as HTMLInputElement)?.value.trim();
      const email = (modal.querySelector("#pai-email") as HTMLInputElement)?.value.trim();
      const phone = (modal.querySelector("#pai-phone") as HTMLInputElement)?.value.trim();
      const insurance = (modal.querySelector("#pai-insurance") as HTMLSelectElement)?.value;
      const gdpr = (modal.querySelector("#pai-gdpr") as HTMLInputElement)?.checked;
      const errEl = modal.querySelector<HTMLElement>("#pai-form-error")!;

      if (!fname || !lname || !email || !phone) { showErr(errEl, "Bitte alle Pflichtfelder ausfüllen."); return; }
      if (!gdpr) { showErr(errEl, "Bitte Datenschutz-Einwilligung bestätigen."); return; }
      errEl.style.display = "none";

      const submitBtn = modal.querySelector<HTMLButtonElement>("#pai-submit")!;
      submitBtn.disabled = true;
      submitBtn.textContent = "…";

      try {
        const res = await fetch(`${apiBase}/api/bookings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clinicId: clinic.id,
            doctorId: selectedSlot.doctorId,
            appointmentTypeId: selectedType.id,
            startTime: selectedSlot.startTime,
            patientFirstName: fname,
            patientLastName: lname,
            patientEmail: email,
            patientPhone: phone,
            insuranceType: insurance,
            gdprConsent: true,
            language,
          }),
        });
        if (!res.ok) { const e = await res.json(); showErr(errEl, e.error ?? "Fehler"); submitBtn.disabled = false; submitBtn.textContent = t.book; return; }
        step = "done";
        render();
      } catch {
        showErr(errEl, "Netzwerkfehler. Bitte versuchen Sie es erneut.");
        submitBtn.disabled = false;
        submitBtn.textContent = t.book;
      }
    });
  }

  async function loadSlots(date: string) {
    const container = modal.querySelector<HTMLElement>("#pai-slots-container")!;
    container.innerHTML = `<span style="color:#9ca3af;font-size:12px;grid-column:1/-1;">Lade…</span>`;
    try {
      const res = await fetch(`${apiBase}/api/slots?clinicId=${clinic.id}&appointmentTypeId=${selectedType.id}&date=${date}`);
      const slots: any[] = await res.json();
      if (!slots.length) { container.innerHTML = `<span style="color:#9ca3af;font-size:12px;grid-column:1/-1;">${t.noSlots}</span>`; return; }
      container.innerHTML = slots.slice(0, 12).map((s) => {
        const time = new Date(s.startTime).toLocaleTimeString(language === "de" ? "de-DE" : "en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" });
        return `<button class="pai-slot-btn" data-slot='${JSON.stringify(s)}' style="
          border:1px solid #dbeafe;border-radius:8px;padding:8px 4px;cursor:pointer;
          background:#fff;font-size:12px;font-weight:600;color:#1d4ed8;
          transition:background .15s,color .15s;
        ">${time}</button>`;
      }).join("");
      container.querySelectorAll<HTMLElement>(".pai-slot-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          selectedSlot = JSON.parse(btn.dataset.slot!);
          step = "form";
          render();
        });
        btn.addEventListener("mouseenter", () => { btn.style.background = color; btn.style.color = "#fff"; });
        btn.addEventListener("mouseleave", () => { btn.style.background = "#fff"; btn.style.color = "#1d4ed8"; });
      });
    } catch {
      container.innerHTML = `<span style="color:#dc2626;font-size:12px;grid-column:1/-1;">Fehler beim Laden.</span>`;
    }
  }

  function showErr(el: HTMLElement, msg: string) { el.textContent = msg; el.style.display = "block"; }

  function open() {
    overlay.style.display = "flex";
    step = "type";
    loadTypes().then(() => render());
  }

  function close() {
    overlay.style.display = "none";
  }

  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });

  return { openBooking: open };
}
