"use client";

import React, { useEffect, useRef, useState } from "react";
import PageShell from "../components/PageShell";
import { Card, SectionTitle, TOKENS, GlowButton } from "../components/ui";
import DiamondOnly from "../components/DiamondOnly";

type CoachResponse = { ok: boolean; reply?: string; error?: string };

export default function CoachPage() {
  const [messages, setMessages] = useState<{ role: "user"|"coach"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send() {
    const msg = input.trim();
    if (!msg || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: msg }]);
    setBusy(true);
    try {
      const r = await fetch("/api/ai/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });
      const ct = r.headers.get("content-type") || "";
      const data: CoachResponse = ct.includes("application/json") ? await r.json() : { ok:false, error:"Non-JSON" };
      if (data.ok && data.reply) {
        setMessages((m) => [...m, { role: "coach", text: data.reply! }]);
      } else {
        setMessages((m) => [...m, { role: "coach", text: `Error: ${data.error || r.statusText}` }]);
      }
    } catch (e: any) {
      setMessages((m) => [...m, { role: "coach", text: `Error: ${String(e?.message || e)}` }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageShell title="AI Sales & Marketing Coach" desc="Diamond: krijg coaching in het Engels, incl. deal-closing tips.">
      <DiamondOnly>
        <Card>
          <SectionTitle title="Coach" desc="Ask anything about sales, marketing, pitches, cold outreach, objection handling…" />
          <div className="rounded-2xl border border-white/10 overflow-hidden">
            <div
              ref={scroller}
              className="max-h-[520px] overflow-auto p-4 space-y-3 bg-neutral-900"
            >
              {messages.length === 0 && (
                <div className={`${TOKENS.SUBTLE} text-sm`}>
                  Try: “Help me close a deal with a hesitant SMB owner.”
                </div>
              )}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`rounded-xl px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "bg-white/5 border border-white/10"
                      : "bg-emerald-400/10 border border-emerald-400/20"
                  }`}
                >
                  <div className={`${TOKENS.SUBTLE} text-[11px] mb-1`}>
                    {m.role === "user" ? "You" : "Coach"}
                  </div>
                  <div style={{whiteSpace:"pre-wrap"}}>{m.text}</div>
                </div>
              ))}
            </div>
            <div className="border-t border-white/10 p-3 flex gap-2">
              <input
                className="flex-1 rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 text-sm"
                placeholder="Type your question in English…"
                value={input}
                onChange={(e)=>setInput(e.target.value)}
                onKeyDown={(e)=>{ if(e.key==="Enter") send(); }}
              />
              <GlowButton onClick={send} disabled={!input || busy}>
                {busy ? "Thinking…" : "Send"}
              </GlowButton>
            </div>
          </div>
        </Card>
      </DiamondOnly>
    </PageShell>
  );
}
