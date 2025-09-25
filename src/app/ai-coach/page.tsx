"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import PageShell from "../components/PageShell"; // if under /app/app/... use "../../components/PageShell"
import { Card, SectionTitle, TOKENS, GlowButton, GoldCTA } from "../components/ui";

/* ================= Wallet helpers (localStorage) ================= */
function walletRead() {
  try {
    const sub = parseInt(localStorage.getItem("wallet.subCredits") || "0", 10) || 0;
    const top = parseInt(localStorage.getItem("wallet.topupCredits") || "0", 10) || 0;
    const plan = localStorage.getItem("wallet.plan") || "";
    return { plan, sub, top, total: sub + top };
  } catch {
    return { plan: "", sub: 0, top: 0, total: 0 };
  }
}
function walletWrite(next: { plan: string | null; sub: number; top: number }) {
  const total = Math.max(0, (next.sub || 0) + (next.top || 0));
  try {
    localStorage.setItem("wallet.plan", next.plan ?? "");
    localStorage.setItem("wallet.subCredits", String(Math.max(0, next.sub)));
    localStorage.setItem("wallet.topupCredits", String(Math.max(0, next.top)));
    localStorage.setItem("wallet.total", String(total));
    window.dispatchEvent(new Event("wallet:update"));
  } catch {}
}
function walletDeduct(amount: number) {
  const w = walletRead();
  let top = w.top;
  let sub = w.sub;
  let rest = amount;
  const useTop = Math.min(top, rest);
  top -= useTop; rest -= useTop;
  if (rest > 0) { const useSub = Math.min(sub, rest); sub -= useSub; rest -= useSub; }
  walletWrite({ plan: w.plan, sub, top });
  const now = walletRead().total;
  return { deducted: amount - rest, remaining: now };
}

/* ================= Types & consts ================= */
type Msg = { role: "user" | "assistant"; content: string; ts: number };

const LS_KEY = "ai.coach.msgs.v1";
const COST = 2; // credits per message

async function jfetch<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, { cache: "no-store", ...init });
  const ct = r.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    const text = await r.text();
    throw new Error(`Non-JSON response (${r.status}): ${text.slice(0, 200)}`);
  }
  const j = await r.json();
  if (!r.ok) throw j;
  return j as T;
}

/* ================= Component ================= */
export default function AiCoachPage() {
  const [hydrated, setHydrated] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [credits, setCredits] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);

  // initial greeting
  const GREETING: Msg = useMemo(
    () => ({
      role: "assistant",
      content:
        "Hi! I’m your AI Coach. Share your goal (campaign, copy, offer) and I’ll give concise next steps.",
      ts: Date.now(),
    }),
    []
  );

  // hydrate from localStorage + wallet
  useEffect(() => {
    setHydrated(true);
    try {
      const raw = localStorage.getItem(LS_KEY);
      const arr: Msg[] = raw ? JSON.parse(raw) : [];
      setMsgs(Array.isArray(arr) && arr.length ? arr : [GREETING]);
    } catch {
      setMsgs([GREETING]);
    }
    const syncCredits = () => setCredits(walletRead().total);
    syncCredits();
    window.addEventListener("wallet:update", syncCredits);
    window.addEventListener("storage", syncCredits);
    return () => {
      window.removeEventListener("wallet:update", syncCredits);
      window.removeEventListener("storage", syncCredits);
    };
  }, [GREETING]);

  // persist + robust autoscroll (after reflow)
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(LS_KEY, JSON.stringify(msgs)); } catch {}
    const el = scrollerRef.current;
    if (el) requestAnimationFrame(() => el.scrollTo({ top: el.scrollHeight }));
  }, [msgs, hydrated]);

  const canSend = useMemo(() => hydrated && input.trim().length > 0 && !busy, [hydrated, input, busy]);

  function pushAssistant(text: string) {
    const bot: Msg = { role: "assistant", content: text, ts: Date.now() };
    setMsgs(m => [...m, bot]);
  }

  async function send() {
    if (!canSend) return;

    // check credits BEFORE sending
    const current = walletRead().total;
    if (current < COST) {
      pushAssistant(
        `Not enough credits (${current}). This chat costs ${COST} credits per message.\n\n→ Go to Settings to buy more credits.`
      );
      return;
    }

    // deduct immediately (optimistic)
    const { remaining } = walletDeduct(COST);
    setCredits(remaining);

    const userMsg: Msg = { role: "user", content: input.trim(), ts: Date.now() };
    setInput("");
    setBusy(true);
    setMsgs((m) => [...m, userMsg]);

    try {
      const r = await jfetch<{ ok: boolean; reply?: string; error?: string }>("/api/ai/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...msgs, userMsg].map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const rawReply =
        (r && r.reply) ||
        "Quick plan:\n1) Define ICP & pain.\n2) Promise + proof.\n3) Clear CTA.";

      // hard-limit length + add module CTA
      const MAX = 600;
      const trimmed = String(rawReply).length > MAX ? String(rawReply).slice(0, MAX) + " …" : String(rawReply);
      const hint =
        `\n\n👉 Turn this into real assets:\n- Use **Campaign Builder** for a week-by-week plan\n- Use **Brand Voice** for slogans, captions & hashtags\n- Use **Offer + Visual** for images`;
      pushAssistant(trimmed + hint);
    } catch (e: any) {
      pushAssistant(
        "I couldn’t reach the AI service.\n\nTry this checklist:\n- Who exactly are we targeting?\n- What painful moment do they have?\n- 1-sentence promise with proof?\n\n👉 For full posts and visuals, use Campaign Builder / Brand Voice."
      );
    } finally {
      setBusy(false);
    }
  }

  function clearChat() {
    const fresh = [GREETING];
    setMsgs(fresh);
    try { localStorage.setItem(LS_KEY, JSON.stringify(fresh)); } catch {}
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      send();
    }
  }

  return (
    <PageShell
      title="AI Coach"
      desc={`Concise, actionable marketing help. Cost: ${COST} credits per message. Set OPENAI_API_KEY to enable real answers; otherwise a helpful fallback is used.`}
    >
      <Card>
        <div className="flex items-center justify-between gap-2">
          <SectionTitle
            title="Chat"
            desc="Use this bot to train your marketing idea's or elevate your sales talk."
          />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <div className={TOKENS.SUBTLE} style={{ fontSize: 12 }}>
              Your credits:{" "}
              <strong style={{ color: credits < COST ? "#fca5a5" : "#86efac" }}>{credits}</strong>
            </div>
            <button type="button" className="btn" onClick={clearChat}>Clear chat</button>
          </div>
        </div>

        {/* messages */}
        <div style={{ overflow: "visible" }}>
          <div
            ref={scrollerRef}
            className="card"
            style={{
              marginTop: 12,
              padding: 12,
              maxHeight: "60vh",
              minHeight: 280,
              // ensure scrolling works even if .card sets overflow:hidden
              overflow: "auto",
              overflowX: "hidden",
              display: "flex",
              flexDirection: "column",
              gap: 10,
              scrollbarGutter: "stable",
              boxSizing: "border-box",
            }}
          >
            {msgs.map((m, i) => (
              <div
                key={i}
                className="card"
                style={{
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "min(900px, 85%)",
                  background: m.role === "user" ? "rgba(245, 192, 68, .08)" : "rgba(255,255,255,.03)",
                  borderColor: m.role === "user" ? "rgba(245, 192, 68, .35)" : "rgba(255,255,255,.1)",
                  padding: 12,
                  fontSize: 14,
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                  wordBreak: "break-word",
                  // prevent clipping inside bubble
                  overflow: "visible",
                }}
              >
                <div className={TOKENS.SUBTLE} style={{ fontSize: 11, marginBottom: 6 }}>
                  {m.role === "user" ? "You" : "AI Coach"} · {new Date(m.ts).toLocaleTimeString()}
                </div>
                {m.content}
              </div>
            ))}
          </div>
        </div>

        {/* composer */}
        <div style={{ marginTop: 12 }}>
          <label className="label">Your message</label>
          <textarea
            className="textarea"
            rows={3}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="e.g., I sell ergonomic yoga mats; help me plan a 2-week launch with 2 posts/week across IG + FB."
          />
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            <GoldCTA onClick={send} disabled={!canSend}>
              {busy ? "Working…" : `Send (${COST} cr.)`}
            </GoldCTA>
            <div className={TOKENS.SUBTLE} style={{ fontSize: 12 }}>
              Tip: manage your plan & credits in <a className="el-link" href="/settings" style={{ padding: 0, border: "none" }}>Settings</a>.
            </div>
          </div>
        </div>
      </Card>

      {/* Dev hint */}
      <div className={TOKENS.SUBTLE} style={{ fontSize: 12, marginTop: 8 }}>
        API route used: <code>/api/ai/coach</code>. If <code>OPENAI_API_KEY</code> is set, real AI replies are returned; otherwise a varied fallback is used.
      </div>
    </PageShell>
  );
}