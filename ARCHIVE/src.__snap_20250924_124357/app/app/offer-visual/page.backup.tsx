"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import PageShell from "../components/PageShell";
import { Card, SectionTitle, TOKENS, GlowButton, GoldCTA } from "../components/ui";

/** ============ Helpers ============ */
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

// Wallet (zelfde patroon als andere pagina's)
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
  const nowTotal = walletRead().total;
  return { deducted: amount - rest, remaining: nowTotal };
}

/** ============ Types ============ */
type GenResponse = { ok: boolean; url?: string; error?: string; seed?: string };

/** ============ Fallback (client-canvas) ============ 
  Veilig, geen CORS nodig; als logoUrl cross-origin is, tekenen we een “logo box”.
**/
async function fallbackRenderImage({
  prompt,
  offer,
  theme = "gold",
  logoUrl,
  width = 1024,
  height = 1024,
}: {
  prompt: string; offer: string; theme?: "gold" | "purple" | "mono"; logoUrl?: string | null; width?: number; height?: number;
}): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  // BG gradient
  const grad = ctx.createLinearGradient(0, 0, width, height);
  if (theme === "gold") { grad.addColorStop(0, "#0b0b0b"); grad.addColorStop(1, "#1a1a1a"); }
  else if (theme === "purple") { grad.addColorStop(0, "#0b0620"); grad.addColorStop(1, "#1a0f3a"); }
  else { grad.addColorStop(0, "#0a0a0a"); grad.addColorStop(1, "#171717"); }
  ctx.fillStyle = grad; ctx.fillRect(0,0,width,height);

  // Offer badge
  ctx.fillStyle = "rgba(255,215,0,0.12)";
  const badgeW = Math.min(width * 0.8, 760);
  const badgeH = 160;
  const bx = (width - badgeW) / 2;
  const by = height * 0.15;
  ctx.fillRect(bx, by, badgeW, badgeH);
  ctx.strokeStyle = "rgba(255,215,0,0.4)";
  ctx.lineWidth = 2;
  ctx.strokeRect(bx, by, badgeW, badgeH);

  // Offer text
  ctx.fillStyle = "#F5C044";
  ctx.font = "bold 72px system-ui, -apple-system, Segoe UI, Roboto";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(offer || "Special Offer", width/2, by + badgeH/2);

  // Prompt block
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  const pbW = Math.min(width * 0.86, 880);
  const pbH = 280;
  const px = (width - pbW) / 2;
  const py = by + badgeH + 40;
  ctx.fillRect(px, py, pbW, pbH);

  ctx.fillStyle = "#EEE";
  ctx.font = "600 40px system-ui, -apple-system, Segoe UI, Roboto";
  ctx.textAlign = "left"; ctx.textBaseline = "top";

  // Wrap prompt text
  const lines: string[] = [];
  const words = (prompt || "Marketing visual").split(/\s+/);
  let line = "";
  for (const w of words) {
    const test = line ? line + " " + w : w;
    const widthTest = ctx.measureText(test).width;
    if (widthTest < pbW - 40) line = test;
    else { lines.push(line); line = w; }
  }
  if (line) lines.push(line);
  const maxLines = 4;
  lines.slice(0, maxLines).forEach((l, i) => {
    ctx.fillText(l, px + 20, py + 20 + i * 44);
  });

  // Logo placeholder / try draw
  if (logoUrl) {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.referrerPolicy = "no-referrer";
      img.src = logoUrl;
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
      const size = 160;
      ctx.drawImage(img, width - size - 40, height - size - 40, size, size);
    } catch {
      // placeholder
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.strokeRect(width - 200, height - 200, 160, 160);
      ctx.font = "bold 22px system-ui";
      ctx.fillStyle = "#aaa";
      ctx.textAlign = "center";
      ctx.fillText("LOGO", width - 120, height - 120);
    }
  }

  return canvas.toDataURL("image/png");
}

/** ============ Component ============ */
export default function OfferVisualPage() {
  // hydration & credits
  const [hydrated, setHydrated] = useState(false);
  const [credits, setCredits] = useState(0);
  const COST = 5;

  // inputs
  const [prompt, setPrompt] = useState("");
  const [offer, setOffer] = useState("");
  const [theme, setTheme] = useState<"gold"|"purple"|"mono">("gold");
  const [logoUrl, setLogoUrl] = useState("");

  // state
  const [busy, setBusy] = useState<null | "gen" | "variant">(null);
  const [err, setErr] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");  // uiteindelijke afbeelding
  const [seed, setSeed] = useState<string | null>(null); // server-side seed voor variant

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

  const canGenerate = useMemo(() => {
    if (!hydrated) return false;
    if (!prompt.trim()) return false;
    if (!offer.trim()) return false;
    if (credits < COST) return false;
    return true;
  }, [hydrated, prompt, offer, credits]);

  async function onPickLogo(file: File | null) {
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      const j = await r.json().catch(() => ({}));
      if (!j?.ok || !j?.url) throw new Error(j?.error || "Upload mislukt");
      setLogoUrl(j.url);
    } catch (e: any) {
      setErr(String(e?.message || e));
    }
  }

  async function doGenerate(mode: "gen" | "variant") {
    setErr(null);
    if (!canGenerate) { setErr("Vul prompt en offer in, en zorg voor voldoende credits."); return; }

    setBusy(mode);
    try {
      let out: GenResponse | null = null;

      // 1) Probeer server-AI (optioneel)
      try {
        const r = await jfetch<GenResponse>("/api/ai/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            offer,
            theme,
            logoUrl: logoUrl || null,
            variantOf: mode === "variant" ? (seed || imageUrl || null) : null,
          }),
        });
        out = r ?? null;
      } catch {
        // negeren, ga naar fallback
      }

      // 2) Resultaat bepalen
      if (out?.ok && out.url) {
        setImageUrl(out.url);
        setSeed(out.seed || out.url);
      } else {
        // Fallback: client-canvas
        const dataUrl = await fallbackRenderImage({ prompt, offer, theme, logoUrl });
        setImageUrl(dataUrl);
        setSeed(dataUrl);
      }

      // 3) Credits aftrekken
      const { remaining } = walletDeduct(COST);
      setCredits(remaining);
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setBusy(null);
    }
  }

  function clearAll() {
    setPrompt(""); setOffer(""); setLogoUrl("");
    setImageUrl(""); setSeed(null);
    setErr(null);
  }

  async function downloadImage() {
    try {
      if (!imageUrl) return;
      // data URL? → direct downloaden
      if (imageUrl.startsWith("data:")) {
        const a = document.createElement("a");
        a.href = imageUrl;
        a.download = "offer-visual.png";
        document.body.appendChild(a);
        a.click();
        a.remove();
        return;
      }
      // remote url? → blob fetchen
      const r = await fetch(imageUrl, { mode: "cors" }).catch(() => null);
      if (r && r.ok) {
        const blob = await r.blob();
        const obj = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = obj; a.download = "offer-visual.png";
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(obj), 2000);
      } else {
        // Als CORS blokkeert: open in tab zodat user kan saven
        window.open(imageUrl, "_blank", "noopener,noreferrer");
      }
    } catch {
      window.open(imageUrl, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <PageShell title="Offer + Visual" desc="Genereer promotionele visuals met merk- en aanbodtekst (5 credits per generatie).">
      {/* Inputs */}
      <Card>
        <SectionTitle title="Input" desc="Beschrijf de gewenste visual en je aanbod. Optioneel: upload je logo." />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-sm font-medium">Prompt (beschrijving van de afbeelding)</label>
            <textarea
              className="mt-1 w-full rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 text-sm h-24"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder='bv. "Realistische foto van sneeuwman in de sneeuw die een bord vasthoudt"'
            />
          </div>

          <div>
            <label className="text-sm font-medium">Offer / Tekst op beeld</label>
            <input
              className="mt-1 w-full rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 text-sm"
              value={offer}
              onChange={(e) => setOffer(e.target.value)}
              placeholder='bv. "-10%" of "Winter Sale" of "Elke dag een nieuwe kans"'
            />
            <div className={`mt-1 text-xs ${TOKENS.SUBTLE}`}>
              Tip: Vermeld exact de tekst zoals ze op het bord/beeld moet verschijnen.
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Stijl thema</label>
            <div className="mt-1 flex flex-wrap gap-2">
              {(["gold","purple","mono"] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTheme(t)}
                  className={`rounded-full px-3 py-1.5 text-sm border ${theme===t ? "border-amber-300 bg-amber-300/15 text-amber-300" : "border-white/10 text-neutral-200 hover:bg-white/5"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Logo upload (optioneel)</label>
            <div className="mt-1 flex items-center gap-2">
              <input type="file" accept="image/*" onChange={(e)=>onPickLogo(e.target.files?.[0]||null)} className="text-sm" />
              {logoUrl && <a href={logoUrl} target="_blank" rel="noreferrer" className="text-xs underline">Bekijk logo</a>}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <GoldCTA onClick={() => doGenerate("gen")} disabled={!canGenerate || busy !== null}>
            {busy === "gen" ? "Bezig…" : "Generate (5 cr.)"}
          </GoldCTA>
          <GlowButton onClick={() => doGenerate("variant")} disabled={!imageUrl || credits < COST || busy !== null}>
            {busy === "variant" ? "Bezig…" : "Make variant (5 cr.)"}
          </GlowButton>

          {hydrated && (
            <div className={`ml-2 text-xs ${TOKENS.SUBTLE}`}>
              Je credits: <strong className={credits < COST ? "text-red-300" : "text-emerald-300"}>{credits}</strong>
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
          <div className="mt-3 rounded-lg border border-red-400/40 bg-red-400/10 text-red-200 px-3 py-2 text-sm">{err}</div>
        )}
      </Card>

      {/* Preview & actions */}
      <Card>
        <SectionTitle title="Preview" desc="Controleer je resultaat en download als PNG." />
        <div className="rounded-2xl border border-white/10 bg-neutral-900 overflow-hidden">
          <div className="w-full grid place-items-center p-4">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="preview" className="max-h-[560px] w-auto object-contain rounded-xl" />
            ) : (
              <div className={`h-[320px] w-full grid place-items-center ${TOKENS.SUBTLE}`}> geen afbeelding.</div>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <GlowButton onClick={downloadImage} disabled={!imageUrl}>Download image</GlowButton>
          <button
            type="button"
            onClick={() => { setPrompt(""); setOffer(""); }}
            className="rounded-xl px-3 py-2 text-sm border border-white/10 hover:bg-white/5"
          >
            Again (nieuwe input)
          </button>
        </div>
      </Card>
    </PageShell>
  );
}

