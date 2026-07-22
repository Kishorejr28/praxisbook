"use client";

import { useState, useRef, useEffect } from "react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { MessageCircle, X, Send, Loader2, Bot } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  clinicSlug: string;
  greeting?: string;
  primaryColor?: string;
  language?: string;
  onSuggestBooking?: () => void;
}

export function ChatWidget({ clinicSlug, greeting, primaryColor = "#2563eb", language = "de", onSuggestBooking }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: greeting ?? "Hallo! Wie kann ich Ihnen helfen?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg: Message = { role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const history = [...messages, userMsg];
      const res = await api.chat.send(clinicSlug, history, language);
      setMessages((m) => [...m, { role: "assistant", content: res.message }]);
      if (res.suggestBooking && onSuggestBooking) onSuggestBooking();
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Entschuldigung, ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat panel */}
      {open && (
        <div className="w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden" style={{ height: "480px" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 text-white" style={{ backgroundColor: primaryColor }}>
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <span className="font-semibold text-sm">KI-Rezeptionist</span>
            </div>
            <button onClick={() => setOpen(false)} className="hover:opacity-70">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed",
                    m.role === "user"
                      ? "text-white rounded-br-sm"
                      : "bg-gray-100 text-gray-800 rounded-bl-sm"
                  )}
                  style={m.role === "user" ? { backgroundColor: primaryColor } : {}}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-3 py-2 rounded-2xl rounded-bl-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-100 p-3 flex gap-2">
            <input
              className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Nachricht eingeben…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              disabled={loading}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="p-2 rounded-full text-white disabled:opacity-50 transition-opacity"
              style={{ backgroundColor: primaryColor }}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Bubble button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-14 h-14 rounded-full shadow-lg text-white flex items-center justify-center transition-transform hover:scale-105"
        style={{ backgroundColor: primaryColor }}
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </div>
  );
}
