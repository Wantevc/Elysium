"use client";

import React, { useEffect, useMemo, useState } from "react";
import PageShell from "../components/PageShell";
import { Card, SectionTitle, TOKENS, GlowButton, GoldCTA } from "../components/ui";

/* =============== Types =============== */
type BrandInputs = {
  product: string;
  themes: string;        // kernwoorden/thema's/gevoelens (vrij tekst)
  primaryColor?: string; // #hex of naam
  logoUrl?: string;      // optioneel geüpload of geplakt
};

type BrandOutput = {
  templates?: Array<{ title: string; post: string }>;
  caption?: string;
  slogan?: string;
  hashtags?: string[];
};

/* =============== Helpers =============== */
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

// Wallet (zoals in je andere pagina’s)
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
  if (rest > 0) {
    const useSub = Math.min(sub, rest);
    sub -= useSub; rest -= useSub;
  }
  walletWrite({ plan: w.plan, sub, top });
  return { deducted: amount - rest, remaining: walletRead().total };
}

// Fallbacks (als je /api/ai/brand nog niet hebt)
function fallbackTemplates(inp: BrandInputs) {
  const base = (s: string) => s.trim() ? s : "je brand";
  return [
    { title: "Introductie", post: `Maak kennis met ${base(inp.product)} — ${inp.themes}. Waarom dit bij jou past.` },
    { title: "Voordeel", post: `3 redenen waarom ${base(inp.product)} onmisbaar is. (${inp.themes})` },
    { title: "Social proof", post: `Review uitgelicht: klanten over ${base(inp.product)}. Deel jouw ervaring!` },
    { title: "Behind the scenes", post: `Zo maken we het: blik achter de schermen bij ${base(inp.product)}.` },
    { title: "Aanbieding", post: `Actie deze week: profiteer nu. (${inp.themes})` },
  ];
}
function fallbackCaption(inp: BrandInputs) {
  const h = (inp.themes || "").split(/[,\s]+/).filter(Boolean).slice(0,3).map(x=>`#${x.replace(/#+/g,"")}`).join(" ");
  return `Elke dag is een nieuwe kans om te groeien met ${inp.product}. ${h}`;
}
function fallbackSlogan(inp: BrandInputs) {
  return `${inp.product}: waar ${inp.themes || "kwaliteit en gevoel"} samenkomen.`;
}
function fallbackHashtags(inp: BrandInputs) {
  const base = (inp.themes || "brand marketing growth").split(/[\s,]+/).filter(Boolean).slice(0,5);
  return Array.from(new Set([...base.map(x => `#${x.replace(/#+/g,"")}`), "#brand", "#marketing"])).slice(0,8);
}

/* =============== Upload helper =============== */
async function uploadFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const r = await fetch("/api/upload", { method: "POST", body: fd });
  const j = await r.json().catch(() => ({}));
  if (!j?.ok || !j?.url) throw new Error(j?.error || "Upload mislukt");
  return j.url as string;
}

/* =============== Component =============== */
export default function BrandVoicePage() {
  // hydration & wallet
  const [hydrated, setHydrated] = useState(false);
  const [credits, setCredits] = useState(0);

  // inputs
  const [product, setProduct] = useState("");
  const [themes, setThemes] = useState("");
  const [primaryColor, setPrimaryColor] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  // status & outputs
  const [busy, setBusy] = useState<null | "templates" | "caption" | "slogan" | "hashtags">(null);
  const [err, setErr] = useState<string | null>(null);

  const [outTemplates, setOutTemplates] = useState<Array<{ title: string; post: string }>>([]);
  const [outCaption, setOutCaption] = useState<string>("");
  const [outSlogan, setOutSlogan] = useState<string>("");
  const [outHashtags, setOutHashtags] = useState<string[]>([]);

  const COST = 4;
  const baseValid = useMemo(() => product.trim().length > 0 && hydrated, [product, hydrated]);

  useEffect(() => {
    setHydrated(true);
    const sync = () => setCredits(walletRead().total);
    sync();
    const h = sync as any;
    window.addEventListener("storage", sync);
    window.addEventListener("wallet:update", h);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("wallet:update", h);
    };
  }, []);

  async function generate(kind: "templates" | "caption" | "slogan" | "hashtags") {
    setErr(null);
    if (!baseValid) { setErr("Vul minstens het product/brand in."); return; }
    if (credits < COST) { setErr(`Onvoldoende credits (${credits}). Nodig: ${COST}.`); return; }

    setBusy(kind);
    const payload: BrandInputs = { product, themes, primaryColor, logoUrl };
    try {
      let out: BrandOutput | null = null;
      try {
        // jouw API (optioneel)
        const r = await jfetch<{ ok: boolean; data: BrandOutput }>("/api/ai/brand", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind, input: payload }),
        });
        out = r?.data ?? null;
      } catch {
        // fallback gebruiken
      }

      if (!out) out = {};
      if (kind === "templates") out.templates = out.templates ?? fallbackTemplates(payload);
      if (kind === "caption")   out.caption   = out.caption   ?? fallbackCaption(payload);
      if (kind === "slogan")    out.slogan    = out.slogan    ?? fallbackSlogan(payload);
      if (kind === "hashtags")  out.hashtags  = out.hashtags  ?? fallbackHashtags(payload);

      // toekennen + credits aftrekken
      if (out.templates) setOutTemplates(out.templates);
      if (out.caption) setOutCaption(out.caption);
      if (out.slogan) setOutSlogan(out.slogan);
      if (out.hashtags) setOutHashtags(out.hashtags);

      const { remaining } = walletDeduct(COST);
      setCredits(remaining);
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setBusy(null);
    }
  }

  function clearAll() {
    setOutTemplates([]);
    setOutCaption("");
    setOutSlogan("");
    setOutHashtags([]);
    setErr(null);
  }

  // Brand seed → doorgeven aan Campaign Builder
  function sendToCampaignBuilder() {
    const seed = {
      brand: {
        product,
        themes,
        primaryColor,
        logoUrl,
        caption: outCaption || "",
        slogan: outSlogan || "",
        hashtags: outHashtags || [],
        templates: outTemplates || [],
      },
      ts: Date.now(),
    };
    try {
      localStorage.setItem("campaign.brandSeed", JSON.stringify(seed));
    } catch {}
    alert("Brand info klaar gezet voor Campaign Builder. Open daar de pagina en klik op 'Import from Brand Voice'.");
  }

  async function onPickLogo(file: File | null) {
    if (!file) return;
    try {
      const url = await uploadFile(file);
      setLogoUrl(url);
    } catch (e: any) {
      setErr(String(e?.message || e));
    }
  }

  return (
    <PageShell title="Brand Voice" desc="Maak je merkstem en herbruikbare bouwstenen (4 credits per generatie).">
      {/* Inputs */}
      <Card>
        <SectionTitle title="Brand inputs" desc="Vertel ons over je brand. Dit stuurt alle generaties aan." />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Product / Brand</label>
            <input
              className="mt-1 w-full rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 text-sm"
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              placeholder="bv. Hondenspeeltjes merk"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Primaire kleur (optioneel)</label>
            <input
              className="mt-1 w-full rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 text-sm"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              placeholder="#F5C044 of 'goud'"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-sm font-medium">Thema’s / gevoelens</label>
            <textarea
              className="mt-1 w-full rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 text-sm h-24"
              value={themes}
              onChange={(e) => setThemes(e.target.value)}
              placeholder="bv. speels, warm, empathisch; focus op dierenliefde, blijdschap, veiligheid"
            />
            <div className={`mt-1 text-xs ${TOKENS.SUBTLE}`}>Gebruik komma’s of spaties; we maken er wel wat van.</div>
          </div>

          <div>
            <label className="text-sm font-medium">Logo upload (optioneel)</label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => onPickLogo(e.target.files?.[0] || null)}
                className="text-sm"
              />
              {logoUrl && (
                <a href={logoUrl} target="_blank" rel="noreferrer" className="text-xs underline">
                  Bekijk logo
                </a>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Logo URL (optioneel)</label>
            <input
              className="mt-1 w-full rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 text-sm"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://…/logo.png"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <GoldCTA onClick={() => generate("templates")} disabled={!baseValid || busy !== null}>
            {busy === "templates" ? "Bezig…" : "Generate Templates (4 cr.)"}
          </GoldCTA>
          <GlowButton onClick={() => generate("caption")} disabled={!baseValid || busy !== null}>
            {busy === "caption" ? "Bezig…" : "Generate Caption (4 cr.)"}
          </GlowButton>
          <GlowButton onClick={() => generate("slogan")} disabled={!baseValid || busy !== null}>
            {busy === "slogan" ? "Bezig…" : "Generate Slogan (4 cr.)"}
          </GlowButton>
          <GlowButton onClick={() => generate("hashtags")} disabled={!baseValid || busy !== null}>
            {busy === "hashtags" ? "Bezig…" : "Generate Hashtags (4 cr.)"}
          </GlowButton>

          {hydrated && (
            <div className={`ml-2 text-xs ${TOKENS.SUBTLE}`}>
              Je credits: <strong className={credits < 4 ? "text-red-300" : "text-emerald-300"}>{credits}</strong>
            </div>
          )}

          <button
            type="button"
            onClick={clearAll}
            className="ml-auto rounded-xl px-3 py-2 text-sm border border-white/10 hover:bg-white/5"
          >
            Clear
          </button>
        </div>

        {err && (
          <div className="mt-3 rounded-lg border border-red-400/40 bg-red-400/10 text-red-200 px-3 py-2 text-sm">
            {err}
          </div>
        )}
      </Card>

      {/* Outputs */}
      {(outTemplates.length > 0 || outCaption || outSlogan || outHashtags.length > 0) && (
        <Card>
          <div className="flex items-center justify-between gap-3">
            <SectionTitle title="Resultaten" desc="Sla op in je eigen notities of stuur door naar de Campaign Builder." />
            <GlowButton onClick={sendToCampaignBuilder}>Use in Campaign Builder</GlowButton>
          </div>

          {outTemplates.length > 0 && (
            <div className="mt-4">
              <div className="text-sm font-medium mb-2">Templates (5)</div>
              <div className="grid gap-3 sm:grid-cols-2">
                {outTemplates.map((t, idx) => (
                  <div key={idx} className="rounded-xl border border-white/10 p-3">
                    <div className="font-semibold mb-1">{t.title}</div>
                    <div className="text-sm whitespace-pre-wrap">{t.post}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {outCaption && (
            <div className="mt-5">
              <div className="text-sm font-medium mb-1">Caption</div>
              <div className="rounded-xl border border-white/10 p-3 text-sm whitespace-pre-wrap">
                {outCaption}
              </div>
            </div>
          )}

          {outSlogan && (
            <div className="mt-5">
              <div className="text-sm font-medium mb-1">Slogan</div>
              <div className="rounded-xl border border-white/10 p-3 text-sm">{outSlogan}</div>
            </div>
          )}

          {outHashtags.length > 0 && (
            <div className="mt-5">
              <div className="text-sm font-medium mb-1">Hashtags</div>
              <div className="rounded-xl border border-white/10 p-3 text-sm flex flex-wrap gap-2">
                {outHashtags.map((h, i) => (
                  <span key={i} className="rounded-full border border-white/10 px-2 py-1 text-xs">{h}</span>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}
    </PageShell>
  );
}