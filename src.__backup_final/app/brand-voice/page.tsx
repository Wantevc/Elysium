"use client";
import React, { useEffect, useMemo, useState } from "react";
import PageShell from "../components/PageShell";
import { Card, SectionTitle, TOKENS, GlowButton, GoldCTA } from "../components/ui";

/* =============== Types =============== */
type BrandInputs = {
  product: string;
  themes: string;
  primaryColor?: string;
  logoUrl?: string;
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
function walletRead() {
  try {
    const sub = parseInt(localStorage.getItem("wallet.subCredits") || "0", 10) || 0;
    const top = parseInt(localStorage.getItem("wallet.topupCredits") || "0", 10) || 0;
    const plan = localStorage.getItem("wallet.plan") || "";
    return { plan, sub, top, total: sub + top };
  } catch { return { plan: "", sub: 0, top: 0, total: 0 }; }
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
  let top = w.top; let sub = w.sub; let rest = amount;
  const useTop = Math.min(top, rest); top -= useTop; rest -= useTop;
  if (rest > 0) { const useSub = Math.min(sub, rest); sub -= useSub; rest -= useSub; }
  walletWrite({ plan: w.plan, sub, top });
  return { deducted: amount - rest, remaining: walletRead().total };
}
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
  const [hydrated, setHydrated] = useState(false);
  const [credits, setCredits] = useState(0);

  const [product, setProduct] = useState("");
  const [themes, setThemes] = useState("");
  const [primaryColor, setPrimaryColor] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

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
        const r = await jfetch<{ ok: boolean; data: BrandOutput }>("/api/ai/brand", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, input: payload }),
        });
        out = r?.data ?? null;
      } catch {}
      if (!out) out = {};
      if (kind === "templates") out.templates = out.templates ?? fallbackTemplates(payload);
      if (kind === "caption")   out.caption   = out.caption   ?? fallbackCaption(payload);
      if (kind === "slogan")    out.slogan    = out.slogan    ?? fallbackSlogan(payload);
      if (kind === "hashtags")  out.hashtags  = out.hashtags  ?? fallbackHashtags(payload);

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
    setOutTemplates([]); setOutCaption(""); setOutSlogan(""); setOutHashtags([]); setErr(null);
  }

  function sendToCampaignBuilder() {
    const seed = { brand: { product, themes, primaryColor, logoUrl, caption: outCaption || "", slogan: outSlogan || "", hashtags: outHashtags || [], templates: outTemplates || [], }, ts: Date.now() };
    try { localStorage.setItem("campaign.brandSeed", JSON.stringify(seed)); } catch {}
    alert("Brand info klaar gezet voor Campaign Builder. Open daar de pagina en klik op 'Import from Brand Voice'.");
  }

  async function onPickLogo(file: File | null) {
    if (!file) return;
    try { const url = await uploadFile(file); setLogoUrl(url); }
    catch (e: any) { setErr(String(e?.message || e)); }
  }

  return (
    <PageShell title="Brand Voice" desc="Maak je merkstem en herbruikbare bouwstenen (4 credits per generatie).">
      <Card>
        <SectionTitle title="Brand inputs" desc="Vertel ons over je brand. Dit stuurt alle generaties aan." />
        <div className="grid-2">
          <div>
            <label className="label">Product / Brand</label>
            <input className="input" value={product} onChange={(e) => setProduct(e.target.value)} placeholder="bv. Hondenspeeltjes merk" />
          </div>
          <div>
            <label className="label">Primaire kleur (optioneel)</label>
            <input className="input" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} placeholder="#F5C044 of 'goud'" />
          </div>
          <div style={{gridColumn:"1 / -1"}}>
            <label className="label">Thema’s / gevoelens</label>
            <textarea className="textarea" value={themes} onChange={(e) => setThemes(e.target.value)} placeholder="bv. speels, warm, empathisch; focus op dierenliefde, blijdschap, veiligheid" />
            <div className={TOKENS.SUBTLE} style={{fontSize:12, marginTop:6}}>Gebruik komma’s of spaties; we maken er wel wat van.</div>
          </div>
          <div>
            <label className="label">Logo upload (optioneel)</label>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <input type="file" accept="image/*" onChange={(e) => onPickLogo(e.target.files?.[0] || null)} />
              {logoUrl && <a href={logoUrl} target="_blank" rel="noreferrer" className="subtle" style={{textDecoration:"underline", fontSize:12}}>Bekijk logo</a>}
            </div>
          </div>
          <div>
            <label className="label">Logo URL (optioneel)</label>
            <input className="input" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://…/logo.png" />
          </div>
        </div>

        <div style={{marginTop:14, display:"flex", flexWrap:"wrap", gap:8, alignItems:"center"}}>
          <GoldCTA onClick={() => generate("templates")} disabled={!baseValid || busy !== null}>{busy === "templates" ? "Bezig…" : "Generate Templates (4 cr.)"}</GoldCTA>
          <GlowButton onClick={() => generate("caption")} disabled={!baseValid || busy !== null}>{busy === "caption" ? "Bezig…" : "Generate Caption (4 cr.)"}</GlowButton>
          <GlowButton onClick={() => generate("slogan")} disabled={!baseValid || busy !== null}>{busy === "slogan" ? "Bezig…" : "Generate Slogan (4 cr.)"}</GlowButton>
          <GlowButton onClick={() => generate("hashtags")} disabled={!baseValid || busy !== null}>{busy === "hashtags" ? "Bezig…" : "Generate Hashtags (4 cr.)"}</GlowButton>
          {hydrated && (<div className={TOKENS.SUBTLE} style={{fontSize:12, marginLeft:8}}>Je credits: <strong style={{color: credits < 4 ? "#fca5a5" : "#86efac"}}>{credits}</strong></div>)}
          <button type="button" onClick={clearAll} className="btn" style={{marginLeft:"auto"}}>Clear</button>
        </div>

        {err && (<div className="card" style={{borderColor:"rgba(255,99,99,.4)", background:"rgba(255,99,99,.08)", color:"#fecaca", padding:12, marginTop:12}}>{err}</div>)}
      </Card>

      {(outTemplates.length > 0 || outCaption || outSlogan || outHashtags.length > 0) && (
        <Card>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
            <SectionTitle title="Resultaten" desc="Sla op in je eigen notities of stuur door naar de Campaign Builder." />
            <GlowButton onClick={sendToCampaignBuilder}>Use in Campaign Builder</GlowButton>
          </div>

          {outTemplates.length > 0 && (
            <div style={{marginTop:16}}>
              <div style={{fontWeight:600, fontSize:14, marginBottom:8}}>Templates (5)</div>
              <div className="grid-2">
                {outTemplates.map((t, idx) => (
                  <div key={idx} className="card" style={{padding:12}}>
                    <div style={{fontWeight:600, marginBottom:6}}>{t.title}</div>
                    <div style={{fontSize:14, whiteSpace:"pre-wrap"}}>{t.post}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {outCaption && (
            <div style={{marginTop:20}}>
              <div style={{fontWeight:600, fontSize:14, marginBottom:6}}>Caption</div>
              <div className="card" style={{padding:12, fontSize:14, whiteSpace:"pre-wrap"}}>{outCaption}</div>
            </div>
          )}

          {outSlogan && (
            <div style={{marginTop:20}}>
              <div style={{fontWeight:600, fontSize:14, marginBottom:6}}>Slogan</div>
              <div className="card" style={{padding:12, fontSize:14}}>{outSlogan}</div>
            </div>
          )}

          {outHashtags.length > 0 && (
            <div style={{marginTop:20}}>
              <div style={{fontWeight:600, fontSize:14, marginBottom:6}}>Hashtags</div>
              <div className="card" style={{padding:12, display:"flex", flexWrap:"wrap", gap:8}}>
                {outHashtags.map((h, i) => (
                  <span key={i} className="btn" style={{borderRadius:9999, padding:"4px 10px", fontSize:12}}>{h}</span>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}
    </PageShell>
  );
}