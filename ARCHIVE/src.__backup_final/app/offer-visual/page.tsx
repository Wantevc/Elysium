"use client";
import React, { useEffect, useMemo, useState } from "react";
import PageShell from "../components/PageShell";
import { Card, SectionTitle, TOKENS, GlowButton, GoldCTA } from "../components/ui";

/** Helpers */
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
function walletRead() {
  try {
    const sub = parseInt(localStorage.getItem("wallet.subCredits") || "0", 10) || 0;
    const top = parseInt(localStorage.getItem("wallet.topupCredits") || "0", 10) || 0;
    const plan = localStorage.getItem("wallet.plan") || "";
    return { plan, sub, top, total: sub + top };
  } catch { return { plan: "", sub: 0, top: 0, total: 0 }; }
}
function walletWrite(next:{plan:string|null; sub:number; top:number}) {
  const total = Math.max(0, (next.sub||0)+(next.top||0));
  try {
    localStorage.setItem("wallet.plan", next.plan ?? "");
    localStorage.setItem("wallet.subCredits", String(Math.max(0, next.sub)));
    localStorage.setItem("wallet.topupCredits", String(Math.max(0, next.top)));
    localStorage.setItem("wallet.total", String(total));
    window.dispatchEvent(new Event("wallet:update"));
  } catch {}
}
function walletDeduct(amount:number){
  const w = walletRead();
  let top=w.top, sub=w.sub, rest=amount;
  const useTop = Math.min(top, rest); top-=useTop; rest-=useTop;
  if(rest>0){ const useSub=Math.min(sub,rest); sub-=useSub; rest-=useSub; }
  walletWrite({plan:w.plan, sub, top});
  return {deducted:amount-rest, remaining: walletRead().total};
}

type GenResponse = { ok: boolean; url?: string; bg?: string; error?: string; seed?: string };

/** Fallback client-canvas (noodoplossing) */
async function fallbackRenderImage({ prompt, offer, theme = "gold", logoUrl, width = 1024, height = 1024 }:{
  prompt:string; offer:string; theme?: "gold"|"purple"|"mono"; logoUrl?: string | null; width?:number; height?:number;
}): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createLinearGradient(0,0,width,height);
  if (theme === "gold") { grad.addColorStop(0,"#0b0b0b"); grad.addColorStop(1,"#1a1a1a"); }
  else if (theme === "purple") { grad.addColorStop(0,"#0b0620"); grad.addColorStop(1,"#1a0f3a"); }
  else { grad.addColorStop(0,"#0a0a0a"); grad.addColorStop(1,"#171717"); }
  ctx.fillStyle = grad; ctx.fillRect(0,0,width,height);

  ctx.fillStyle = "rgba(255,215,0,0.12)";
  const badgeW = Math.min(width * 0.8, 760);
  const badgeH = 160;
  const bx = (width - badgeW) / 2;
  const by = height * 0.15;
  ctx.fillRect(bx, by, badgeW, badgeH);
  ctx.strokeStyle = "rgba(255,215,0,0.4)";
  ctx.lineWidth = 2; ctx.strokeRect(bx, by, badgeW, badgeH);

  ctx.fillStyle = "#F5C044";
  ctx.font = "bold 72px system-ui, -apple-system, Segoe UI, Roboto";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(offer || "Special Offer", width/2, by + badgeH/2);

  ctx.fillStyle = "rgba(255,255,255,0.08)";
  const pbW = Math.min(width * 0.86, 880);
  const pbH = 280; const px = (width - pbW) / 2; const py = by + badgeH + 40;
  ctx.fillRect(px, py, pbW, pbH);
  ctx.fillStyle = "#EEE";
  ctx.font = "600 40px system-ui, -apple-system, Segoe UI, Roboto";
  ctx.textAlign = "left"; ctx.textBaseline = "top";
  const lines: string[] = []; const words = (prompt || "Marketing visual").split(/\s+/);
  let line = ""; for (const w of words) { const test = line ? line+" "+w : w; if (ctx.measureText(test).width < pbW - 40) line = test; else { lines.push(line); line = w; } }
  if (line) lines.push(line); lines.slice(0,4).forEach((l, i) => ctx.fillText(l, px + 20, py + 20 + i * 44));

  if (logoUrl) {
    try {
      const img = new Image(); img.crossOrigin = "anonymous"; img.referrerPolicy = "no-referrer"; img.src = logoUrl;
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
      const size = 160; ctx.drawImage(img, width - size - 40, height - size - 40, size, size);
    } catch {
      ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.strokeRect(width - 200, height - 200, 160, 160);
      ctx.font = "bold 22px system-ui"; ctx.fillStyle = "#aaa"; ctx.textAlign = "center"; ctx.fillText("LOGO", width - 120, height - 120);
    }
  }
  return canvas.toDataURL("image/png");
}

/** NIEUW: client-side compositing boven AI-achtergrond */
async function composeOverBackground({
  bgUrl,
  offer,
  theme = "gold",
  logoUrl,
  width = 1024,
  height = 1024,
}: {
  bgUrl: string;
  offer: string;
  theme?: "gold" | "purple" | "mono";
  logoUrl?: string | null;
  width?: number;
  height?: number;
}): Promise<string> {
  const THEME = {
    gold: { badge: "#1a1a1acc", stroke: "#d9bf7a", text: "#f1dfad" },
    purple: { badge: "#150f26cc", stroke: "#caa6ff", text: "#eadbff" },
    mono: { badge: "#0f0f12cc", stroke: "#d1d5db", text: "#e5e7eb" },
  } as const;

  const t = THEME[theme] || THEME.gold;

  // 1) Achtergrond laden
  const bg = await new Promise<HTMLImageElement>((res, rej) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = bgUrl;
    img.onload = () => res(img);
    img.onerror = rej;
  });

  // 2) Canvas opzetten
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  // 3) Achtergrond coveren (crop om beeld te vullen)
  const rCanvas = width / height;
  const rImg = bg.width / bg.height;
  let sx = 0, sy = 0, sw = bg.width, sh = bg.height;
  if (rImg > rCanvas) { sw = Math.round(bg.height * rCanvas); sx = Math.round((bg.width - sw) / 2); }
  else { sh = Math.round(bg.width / rCanvas); sy = Math.round((bg.height - sh) / 2); }
  ctx.drawImage(bg, sx, sy, sw, sh, 0, 0, width, height);

  // 4) Gouden badge
  const padX = 92, badgeW = width - padX * 2, badgeH = 160, badgeY = 120;
  ctx.fillStyle = t.badge;
  ctx.strokeStyle = t.stroke;
  ctx.lineWidth = 2;
  const rr = 18;
  ctx.beginPath();
  ctx.moveTo(padX + rr, badgeY);
  ctx.lineTo(padX + badgeW - rr, badgeY);
  ctx.quadraticCurveTo(padX + badgeW, badgeY, padX + badgeW, badgeY + rr);
  ctx.lineTo(padX + badgeW, badgeY + badgeH - rr);
  ctx.quadraticCurveTo(padX + badgeW, badgeY + badgeH, padX + badgeW - rr, badgeY + badgeH);
  ctx.lineTo(padX + rr, badgeY + badgeH);
  ctx.quadraticCurveTo(padX, badgeY + badgeH, padX, badgeY + badgeH - rr);
  ctx.lineTo(padX, badgeY + rr);
  ctx.quadraticCurveTo(padX, badgeY, padX + rr, badgeY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 5) Offer-tekst (center + wrap)
  ctx.fillStyle = t.text;
  ctx.font = "800 82px 'Segoe UI', system-ui, -apple-system, Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const maxWidth = badgeW - 40;
  const words = offer.trim().split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width <= maxWidth) line = test;
    else { if (line) lines.push(line); line = w; }
  }
  if (line) lines.push(line);
  const lineHeight = 88;
  const startY = badgeY + badgeH / 2 - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((l, i) => ctx.fillText(l, width / 2, startY + i * lineHeight));

  // 6) Optioneel: logo rechtsonder
  if (logoUrl) {
    try {
      const logo = await new Promise<HTMLImageElement>((res, rej) => {
        const im = new Image();
        im.crossOrigin = "anonymous";
        im.src = logoUrl;
        im.onload = () => res(im);
        im.onerror = rej;
      });
      const size = 160, margin = 24;
      ctx.globalAlpha = 0.95;
      ctx.drawImage(logo, width - size - margin, height - size - margin, size, size);
      ctx.globalAlpha = 1;
    } catch {
      // negeer logo-fouten (CORS e.d.)
    }
  }

  return canvas.toDataURL("image/png");
}

export default function OfferVisualPage() {
  const [hydrated, setHydrated] = useState(false);
  const [credits, setCredits] = useState(0);
  const COST = 5;

  const [prompt, setPrompt] = useState("");
  const [offer, setOffer] = useState("");
  const [theme, setTheme] = useState<"gold"|"purple"|"mono">("gold");
  const [logoUrl, setLogoUrl] = useState("");

  const [busy, setBusy] = useState<null | "gen" | "variant">(null);
  const [err, setErr] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [seed, setSeed] = useState<string | null>(null);

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

  const canGenerate = useMemo(
    () => !!(hydrated && prompt.trim() && offer.trim() && credits >= COST),
    [hydrated, prompt, offer, credits]
  ) as boolean;

  async function onPickLogo(file: File | null) {
    if (!file) return;
    try {
      const fd = new FormData(); fd.append("file", file);
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      const j = await r.json().catch(() => ({} as any));
      if (!j?.ok || !j?.url) throw new Error(j?.error || "Upload mislukt");
      setLogoUrl(j.url);
    } catch (e: any) { setErr(String(e?.message || e)); }
  }

async function doGenerate(mode: "gen" | "variant") {
  setErr(null);

  if (!canGenerate) {
    setErr("Vul prompt én offer in, en zorg voor voldoende credits.");
    return;
  }

  setBusy(mode);
  try {
    // 1) Vraag de serverroute aan
    let out: GenResponse | null = null;
    try {
      const r = await jfetch<GenResponse>("/api/ai/visual", {
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
      // 🔎 Toon de serverfout expliciet (stap 2)
      if (out && !out.ok && (out as any).error) {
        setErr("Server: " + (out as any).error);
      }
      console.log("API /api/ai/visual →", out);
    } catch (e: any) {
      console.error("Call /api/ai/visual failed:", e);
      setErr("Client/Network: " + (e?.message || String(e)));
    }

    // 2) Alleen als de server een échte image-URL gaf, gebruiken we die
    if (out?.ok && out.url) {
      setImageUrl(out.url);
      setSeed(out.seed || out.url);
    } else {
      // ⚠️ TIJDELIJK: fallback UIT zetten tijdens debuggen
      // setErr(prev => prev ? prev : "Server gaf geen image-URL terug.");
      // return;

      // (laat fallback AAN als je toch iets wil zien)
      const dataUrl = await fallbackRenderImage({ prompt, offer, theme, logoUrl });
      setImageUrl(dataUrl);
      setSeed(dataUrl);
    }

    // 3) Credits aftrekken
    const { remaining } = walletDeduct(COST);
    setCredits(remaining);
  } catch (e: any) {
    console.error(e);
    setErr(String(e?.message || e));
  } finally {
    setBusy(null);
  }
}
  function clearAll(){ setPrompt(""); setOffer(""); setLogoUrl(""); setImageUrl(""); setSeed(null); setErr(null); }

  async function downloadImage() {
    try {
      if (!imageUrl) return;
      if (imageUrl.startsWith("data:")) {
        const a = document.createElement("a"); a.href = imageUrl; a.download = "offer-visual.png";
        document.body.appendChild(a); a.click(); a.remove(); return;
      }
      const r = await fetch(imageUrl, { mode: "cors" }).catch(() => null);
      if (r && r.ok) {
        const blob = await r.blob(); const obj = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = obj; a.download = "offer-visual.png";
        document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(obj),2000);
      } else { window.open(imageUrl, "_blank", "noopener,noreferrer"); }
    } catch { window.open(imageUrl, "_blank", "noopener,noreferrer"); }
  }

  return (
    <PageShell title="Offer + Visual" desc="Genereer promotionele visuals met merk- en aanbodtekst (5 credits per generatie).">
      <Card>
        <SectionTitle title="Input" desc="Beschrijf de gewenste visual en je aanbod. Optioneel: upload je logo." />
        <div className="grid-2">
          <div style={{gridColumn:"1 / -1"}}>
            <label className="label">Prompt (beschrijving van de afbeelding)</label>
            <textarea className="textarea" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder='bv. "Realistische foto van de zon bij golden hour, cinematic, soft contrast"' />
          </div>
          <div>
            <label className="label">Offer / Tekst op beeld</label>
            <input className="input" value={offer} onChange={(e) => setOffer(e.target.value)} placeholder='bv. "-10%" of "Winter Sale"' />
            <div className={TOKENS.SUBTLE} style={{fontSize:12, marginTop:6}}>Tip: zet exact de tekst die op het beeld moet.</div>
          </div>
          <div>
            <label className="label">Stijl thema</label>
            <div style={{display:"flex",flexWrap:"wrap",gap:8, marginTop:6}}>
              {(["gold","purple","mono"] as const).map(t => (
                <button key={t} type="button" onClick={() => setTheme(t)} className={`btn ${theme===t ? "btn--gold" : ""}`} style={{borderRadius:9999, padding:"6px 12px", fontSize:14}}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Logo upload (optioneel)</label>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <input type="file" accept="image/*" onChange={(e)=>onPickLogo(e.target.files?.[0]||null)} />
              {logoUrl && <a href={logoUrl} target="_blank" rel="noreferrer" className="subtle" style={{textDecoration:"underline", fontSize:12}}>Bekijk logo</a>}
            </div>
          </div>
        </div>

        <div style={{marginTop:14, display:"flex", flexWrap:"wrap", gap:8, alignItems:"center"}}>
          <GoldCTA onClick={() => doGenerate("gen")} disabled={!canGenerate || busy !== null}>{busy === "gen" ? "Bezig…" : "Generate (5 cr.)"}</GoldCTA>
          <GlowButton onClick={() => doGenerate("variant")} disabled={!imageUrl || credits < COST || busy !== null}>{busy === "variant" ? "Bezig…" : "Make variant (5 cr.)"}</GlowButton>
          {hydrated && (<div className={TOKENS.SUBTLE} style={{fontSize:12, marginLeft:8}}>Je credits: <strong style={{color: credits < COST ? "#fca5a5" : "#86efac"}}>{credits}</strong></div>)}
          <button type="button" onClick={clearAll} className="btn" style={{marginLeft:"auto"}}>Clear</button>
        </div>

        {err && (<div className="card" style={{borderColor:"rgba(255,99,99,.4)", background:"rgba(255,99,99,.08)", color:"#fecaca", padding:12, marginTop:12}}>{err}</div>)}
      </Card>

      <Card>
        <SectionTitle title="Preview" desc="Controleer je resultaat en download als PNG." />
        <div className="card" style={{background:"#0f0f12", borderColor:"rgba(255,255,255,.1)", overflow:"hidden"}}>
          <div style={{width:"100%", display:"grid", placeItems:"center", padding:16}}>
            {imageUrl
              ? <img src={imageUrl} alt="preview" style={{maxHeight:560, width:"auto", borderRadius:12}} />
              : <div className={TOKENS.SUBTLE} style={{height:320, width:"100%", display:"grid", placeItems:"center"}}>Nog geen afbeelding.</div>}
          </div>
        </div>
        <div style={{marginTop:12, display:"flex", gap:8, flexWrap:"wrap"}}>
          <GlowButton onClick={downloadImage} disabled={!imageUrl}>Download image</GlowButton>
          <button type="button" onClick={() => { setPrompt(""); setOffer(""); }} className="btn">Again (nieuwe input)</button>
        </div>
      </Card>
    </PageShell>
  );
}