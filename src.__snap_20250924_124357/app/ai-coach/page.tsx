"use client";
import React, { useEffect, useRef, useState } from "react";
import ElysiumLayout from "../../components/elysium/Layout";

type Msg = { role: "user" | "assistant"; content: string };

const STORE = "ai.coach.msgs.v1";
const hasDiamond = () =>
  (typeof window !== "undefined") &&
  (localStorage.getItem("wallet.plan") || "").toLowerCase() === "diamond";

export default function AICoachPage() {
  const [ok, setOk] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "assistant", content: "Hi! I’m your AI Marketing & Sales Coach. What are we working on today?" },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scRef = useRef<HTMLDivElement>(null);

  // Gate & load history
  useEffect(() => {
    setOk(hasDiamond());
    try {
      const raw = localStorage.getItem(STORE);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length) setMsgs(arr);
      }
    } catch {}
  }, []);

  // Persist + autoscroll
  useEffect(() => {
    try { localStorage.setItem(STORE, JSON.stringify(msgs)); } catch {}
    scRef.current?.scrollTo({ top: 9e9, behavior: "smooth" });
  }, [msgs.length]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setMsgs((m) => [...m, { role: "user", content: text }]);
    setBusy(true);

    try {
      const r = await fetch("/api/ai/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...msgs, { role: "user", content: text }] }),
      });
      const data = await r.json().catch(() => null);
      if (r.ok && data?.reply) {
        setMsgs((m) => [...m, { role: "assistant", content: String(data.reply) }]);
      } else {
        setMsgs((m) => [
          ...m,
          { role: "assistant", content: "Hmm, I hit a snag. Try again or rephrase your question." },
        ]);
      }
    } catch {
      setMsgs((m) => [
        ...m,
        { role: "assistant", content: "Network error. Please try again." },
      ]);
    } finally {
      setBusy(false);
    }
  }

  function clearChat() {
    if (!confirm("Gesprek wissen?")) return;
    const seed: Msg[] = [
      { role: "assistant", content: "Chat cleared. What do you want to work on next?" },
    ];
    setMsgs(seed);
    try { localStorage.setItem(STORE, JSON.stringify(seed)); } catch {}
  }

  if (!ok) {
    return (
      <ElysiumLayout title="AI Coach (Diamond)" subtitle="Deze feature is alleen beschikbaar met Diamond.">
        <div className="el-card">
          <div className="text-[15px] text-[color:var(--muted)]">
            Upgrade naar <b>Diamond</b> om de AI Coach te gebruiken.
          </div>
          <div className="mt-4">
            <a href="/packs" className="el-btn">Upgrade</a>
          </div>
        </div>
      </ElysiumLayout>
    );
  }

  return (
    <ElysiumLayout title="AI Coach" subtitle="Marketing & Sales coaching chat.">
      <div className="el-card">
        <div className="mb-2 flex items-center gap-3">
          <div className="text-[13px] opacity-80">
            Tip: start met “Help me close …” of “Write a 3-step plan for …”
          </div>
          <button className="el-btn ml-auto" onClick={clearChat} title="Wis gesprek">
            Clear chat
          </button>
        </div>

        <div
          ref={scRef}
          className="mt-2 h-[460px] overflow-auto rounded-[12px] border border-[color:var(--hair)] bg-[color:var(--pane2)] p-3"
        >
          {msgs.map((m, i) => (
            <div key={i} className="mb-2">
              <div className="text-xs opacity-60">{m.role === "user" ? "You" : "Coach"}</div>
              <div
                className={
                  m.role === "user"
                    ? "rounded-lg bg-white/10 p-2"
                    : "rounded-lg bg-[rgba(217,191,122,0.12)] border border-[rgba(217,191,122,0.35)] p-2"
                }
              >
                <pre className="whitespace-pre-wrap break-words text-sm">{m.content}</pre>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-2 flex gap-2">
          <input
            className="w-full rounded-[10px] border border-[color:var(--hair)] bg-[color:var(--pane2)] px-3 py-2 text-sm"
            placeholder={busy ? "Coach is thinking…" : "Ask your coach…"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            disabled={busy}
          />
          <button className="el-btn" onClick={send} disabled={busy}>
            {busy ? "…" : "Send"}
          </button>
        </div>
      </div>
    </ElysiumLayout>
  );
}
