interface Message { role: "user" | "assistant"; content: string }

export function createChatUI(
  root: HTMLElement,
  clinic: any,
  apiBase: string,
  language: string,
  color: string,
  onOpenBooking: () => void
) {
  const messages: Message[] = [
    { role: "assistant", content: clinic.widgetGreeting ?? (language === "de" ? "Hallo! Wie kann ich Ihnen helfen?" : "Hello! How can I help you?") },
  ];

  /* ── DOM ── */
  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div id="pai-chat-panel" style="
      display:none; position:absolute; bottom:64px; right:0;
      width:320px; background:#fff; border-radius:16px;
      box-shadow:0 8px 32px rgba(0,0,0,.15); border:1px solid #e5e7eb;
      overflow:hidden; flex-direction:column;
    ">
      <div id="pai-chat-header" style="
        background:${color}; color:#fff; padding:12px 16px;
        display:flex; align-items:center; justify-content:space-between;
      ">
        <span style="font-weight:600;font-size:13px;">🤖 KI-Rezeptionist</span>
        <button id="pai-chat-close" style="background:none;border:none;color:#fff;cursor:pointer;font-size:18px;line-height:1;">×</button>
      </div>
      <div id="pai-chat-messages" style="
        flex:1; overflow-y:auto; padding:12px; display:flex;
        flex-direction:column; gap:8px; height:320px;
      "></div>
      <div style="padding:8px;border-top:1px solid #f1f5f9;display:flex;gap:6px;">
        <input id="pai-chat-input" class="pai-input" placeholder="${language === "de" ? "Nachricht…" : "Message…"}"
          style="flex:1;border-radius:20px;padding:8px 14px;" />
        <button id="pai-chat-send" style="
          background:${color};color:#fff;border:none;border-radius:50%;
          width:36px;height:36px;cursor:pointer;font-size:18px;flex-shrink:0;
        ">→</button>
      </div>
    </div>
    <button id="pai-chat-bubble" style="
      width:56px;height:56px;border-radius:50%;background:${color};color:#fff;
      border:none;cursor:pointer;font-size:26px;box-shadow:0 4px 16px rgba(0,0,0,.2);
      display:flex;align-items:center;justify-content:center;
      transition:transform .15s;
    ">💬</button>
  `;
  root.appendChild(wrap);

  const panel = wrap.querySelector<HTMLElement>("#pai-chat-panel")!;
  const bubble = wrap.querySelector<HTMLElement>("#pai-chat-bubble")!;
  const messagesEl = wrap.querySelector<HTMLElement>("#pai-chat-messages")!;
  const input = wrap.querySelector<HTMLInputElement>("#pai-chat-input")!;
  const sendBtn = wrap.querySelector<HTMLElement>("#pai-chat-send")!;
  const closeBtn = wrap.querySelector<HTMLElement>("#pai-chat-close")!;

  function renderMessages() {
    messagesEl.innerHTML = messages
      .map((m) => `
        <div style="display:flex;justify-content:${m.role === "user" ? "flex-end" : "flex-start"};">
          <div style="
            max-width:80%;padding:8px 12px;border-radius:14px;font-size:13px;line-height:1.5;
            background:${m.role === "user" ? color : "#f1f5f9"};
            color:${m.role === "user" ? "#fff" : "#1f2937"};
            border-bottom-${m.role === "user" ? "right" : "left"}-radius:4px;
          ">${escHtml(m.content)}</div>
        </div>
      `)
      .join("");
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function escHtml(s: string) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function addTyping() {
    const el = document.createElement("div");
    el.id = "pai-typing";
    el.style.cssText = "display:flex;justify-content:flex-start;";
    el.innerHTML = `<div style="background:#f1f5f9;padding:8px 12px;border-radius:14px;font-size:20px;">…</div>`;
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function removeTyping() {
    wrap.querySelector("#pai-typing")?.remove();
  }

  async function send() {
    const text = input.value.trim();
    if (!text) return;
    messages.push({ role: "user", content: text });
    input.value = "";
    renderMessages();
    addTyping();
    sendBtn.style.opacity = "0.5";

    try {
      const res = await fetch(`${apiBase}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clinicSlug: clinic.slug, messages: messages.slice(-10), language }),
      });
      const data = await res.json();
      removeTyping();
      messages.push({ role: "assistant", content: data.message });
      renderMessages();
      if (data.suggestBooking) {
        setTimeout(onOpenBooking, 400);
        togglePanel(false);
      }
    } catch {
      removeTyping();
      messages.push({ role: "assistant", content: language === "de" ? "Entschuldigung, ein Fehler ist aufgetreten." : "Sorry, an error occurred." });
      renderMessages();
    } finally {
      sendBtn.style.opacity = "1";
    }
  }

  function togglePanel(show?: boolean) {
    const visible = show ?? panel.style.display === "none";
    panel.style.display = visible ? "flex" : "none";
    bubble.textContent = visible ? "×" : "💬";
    if (visible) { input.focus(); renderMessages(); }
  }

  bubble.addEventListener("click", () => togglePanel());
  closeBtn.addEventListener("click", () => togglePanel(false));
  sendBtn.addEventListener("click", send);
  input.addEventListener("keydown", (e) => e.key === "Enter" && send());

  return { togglePanel };
}
