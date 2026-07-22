"use client";

import { useState, useRef, useEffect } from "react";
import { getRuleBasedReply, GREETING, type ChatMsg } from "@/lib/ruleChat";
import { cn } from "@/lib/utils";
import { MessageCircle, X, Send } from "lucide-react";

interface Props {
  clinic: any;
  primaryColor?: string;
  onBookingRequested?: (treatmentHint?: string) => void;
}

export function RuleBasedChat({ clinic, primaryColor = "#2563eb", onBookingRequested }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "bot", text: GREETING.text, buttons: GREETING.buttons },
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  function handleInput(text: string) {
    const userMsg: ChatMsg = { role: "user", text };
    const reply = getRuleBasedReply(text, clinic);
    const botMsg: ChatMsg = { role: "bot", text: reply.text, buttons: reply.buttons, action: reply.action };

    setMessages((m) => [...m, userMsg, botMsg]);
    setInput("");

    if (reply.action === "show_slots" || reply.action === "show_booking_form") {
      setTimeout(() => {
        setOpen(false);
        onBookingRequested?.(text);
      }, 800);
    }
  }

  const color = clinic?.primaryColor || primaryColor;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div
          className="w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
          style={{ height: "480px" }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 text-white flex-shrink-0"
            style={{ backgroundColor: color }}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">🤖</span>
              <div>
                <p className="font-semibold text-sm leading-tight">KI-Rezeptionist</p>
                <p className="text-xs opacity-80">{clinic?.name}</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="hover:opacity-70 text-xl leading-none">×</button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={cn("flex flex-col", m.role === "user" ? "items-end" : "items-start")}>
                <div
                  className={cn(
                    "max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-line",
                    m.role === "user"
                      ? "text-white rounded-br-sm"
                      : "bg-gray-100 text-gray-800 rounded-bl-sm"
                  )}
                  style={m.role === "user" ? { backgroundColor: color } : {}}
                >
                  {m.text}
                </div>

                {/* Quick reply buttons */}
                {m.role === "bot" && m.buttons && (
                  <div className="flex flex-wrap gap-1.5 mt-2 max-w-[90%]">
                    {m.buttons.map((btn) => (
                      <button
                        key={btn}
                        onClick={() => handleInput(btn)}
                        className="text-xs px-3 py-1.5 rounded-full border transition-colors hover:text-white"
                        style={{
                          borderColor: color,
                          color: color,
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.backgroundColor = color;
                          (e.currentTarget as HTMLButtonElement).style.color = "#fff";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.backgroundColor = "";
                          (e.currentTarget as HTMLButtonElement).style.color = color;
                        }}
                      >
                        {btn}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Free-text input */}
          <div className="border-t border-gray-100 p-3 flex gap-2 flex-shrink-0">
            <input
              className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2"
              style={{ "--tw-ring-color": color } as any}
              placeholder="Oder schreiben Sie hier…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && input.trim() && handleInput(input.trim())}
            />
            <button
              onClick={() => input.trim() && handleInput(input.trim())}
              disabled={!input.trim()}
              className="p-2 rounded-full text-white disabled:opacity-40"
              style={{ backgroundColor: color }}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Bubble */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-14 h-14 rounded-full shadow-lg text-white flex items-center justify-center text-2xl transition-transform hover:scale-105"
        style={{ backgroundColor: color }}
        aria-label="Chat öffnen"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </div>
  );
}
