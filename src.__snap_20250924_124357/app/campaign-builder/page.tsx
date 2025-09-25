"use client";
import React, { useEffect, useMemo, useState } from "react";
import PageShell from "../components/PageShell";
import { Card, SectionTitle, TOKENS, GlowButton, GoldCTA } from "../components/ui";

/* ===================== Types ===================== */
type PostItem = {
  platform: "facebook" | "instagram";
  type: "feed" | "story" | "reel";
  caption: string;
  cta: string;
  hashtags?: string[];
  assetHint?: string;
};
type WeekPlan = {
  title: string;
  persona?: string;
  angle?: string;
  items: PostItem[];
};
type CampaignPlan = {
  meta: {
    product: string;
    goal: "Sales" | "Leads" | "Traffic" | "Views";
    promos?: string;
    platforms: ("facebook" | "instagram")[];
    cadence: "standard" | "light" | "intense";
    weeks: number;
    createdAt: string;
  };
  weeks: WeekPlan[];
};

/* ===================== Helpers ===================== */
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

// Wallet (localStorage)
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
  const nowTotal = walletRead().total;
  return { deducted: amount - rest, remaining: nowTotal };
}

/* ===================== LocalStorage keys ===================== */
const LS_LAST = "campaign.last";
const LS_VAULT = "campaign.vault";

/* ===================== Fallback generator ===================== */
function buildFallbackPlan(input: {
  product: string;
  goal: CampaignPlan["meta"]["goal"];
  promos: string;
  platforms: ("facebook" | "instagram")[];
  cadence: "standard" | "light" | "intense";
  weeks: number;
}): CampaignPlan {
  const { product, goal, promos, platforms, cadence, weeks } = input;
  const perWeek = cadence === "intense" ? 3 : cadence === "light" ? 1 : 2;
  const weekTitles = [
    `Introductie van de ${product}`,
    `Voordelen & bewijs`,
    `Social proof & community`,
    `Aanbieding & urgentie`,
    `Behind the scenes`,
    `Finale push`,
  ];
  const outWeeks: WeekPlan[] = Array.from({ length: weeks }, (_, i) => {
    const title = weekTitles[i] || `Week ${i + 1}`;
    const items: PostItem[] = [];
    for (let k = 0; k < perWeek; k++) {
      for (const p of platforms) {
        items.push({
          platform: p,
          type: p === "instagram" ? (k % 2 ? "reel" : "feed") : "feed",
          caption: k === 0 && i === 0
            ? `Begin je week sterk: ontdek ${product}!`
            : `Waarom ${product} past bij jou — deel je ervaring in de comments.`,
          cta: goal === "Sales" ? "Shop nu" : goal === "Leads" ? "Schrijf je in" : goal === "Traffic" ? "Lees meer" : "Bekijk",
          hashtags: ["#promo", "#actie", "#marketing"].slice(0, 3),
          assetHint: "Gebruik een duidelijke productfoto of korte demo",
        });
      }
    }
    return {
      title,
      persona: "Ideale klant",
      angle: i === weeks - 1 ? "Urgentie & schaarste" : "Educatief & vertrouwen",
      items,
    };
  });
  return {
    meta: { product, goal, promos: promos || "", platforms, cadence, weeks, createdAt: new Date().toISOString() },
    weeks: outWeeks,
  };
}

/* ===================== Component ===================== */
export default function CampaignBuilderPage() {
  const [hydrated, setHydrated] = useState(false);
  const [product, setProduct] = useState("");
  const [goal, setGoal] = useState<CampaignPlan["meta"]["goal"]>("Sales");
  const [promos, setPromos] = useState("");
  const [platforms, setPlatforms] = useState<("facebook" | "instagram")[]>(["facebook"]);
  const [cadence, setCadence] = useState<"light" | "standard" | "intense">("standard");
  const [weeks, setWeeks] = useState(4);
  const [plan, setPlan] = useState<CampaignPlan | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [credits, setCredits] = useState(0);
  const COST = 50;

  type VaultItem = { id: string; name: string; ts: number; plan: CampaignPlan };
  const [vault, setVault] = useState<VaultItem[]>([]);
  const [saveName, setSaveName] = useState("");

  useEffect(() => {
    setHydrated(true);
    const syncWallet = () => setCredits(walletRead().total);
    syncWallet();
    const onWallet = syncWallet as any;
    window.addEventListener("wallet:update", onWallet);
    window.addEventListener("storage", syncWallet);
    try { const raw = localStorage.getItem(LS_LAST); if (raw) setPlan(JSON.parse(raw)); } catch {}
    try { const raw = localStorage.getItem(LS_VAULT); const arr = raw ? (JSON.parse(raw) as VaultItem[]) : []; setVault(Array.isArray(arr) ? arr : []); } catch {}
    return () => {
      window.removeEventListener("wallet:update", onWallet);
      window.removeEventListener("storage", syncWallet);
    };
  }, []);

  const canGenerate = useMemo(() => {
    if (!product.trim()) return false;
    if (platforms.length === 0) return false;
    if (!hydrated) return false;
    if (credits < COST) return false;
    return true;
  }, [product, platforms, hydrated, credits]);

  async function generate() {
    setErr(null);
    if (!canGenerate) return;
    setBusy(true);
    try {
      let nextPlan: CampaignPlan | null = null;
      try {
        const res = await jfetch<{ ok: boolean; plan: CampaignPlan }>("/api/ai/campaign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product, goal, promos, platforms, cadence, weeks }),
        });
        if (res?.plan) nextPlan = res.plan;
      } catch {}
      if (!nextPlan) nextPlan = buildFallbackPlan({ product, goal, promos, platforms, cadence, weeks });
      const { remaining } = walletDeduct(COST);
      setCredits(remaining);
      setPlan(nextPlan);
      try { localStorage.setItem(LS_LAST, JSON.stringify(nextPlan)); } catch {}
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  }
  function clearCurrent() {
    setPlan(null); setSaveName("");
    try { localStorage.removeItem(LS_LAST); } catch {}
  }
  function togglePlatform(p: "facebook" | "instagram") {
    setPlatforms(prev => (prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]));
  }
// === Brand Voice → import ===
function importFromBrandVoice() {
  try {
    const raw = localStorage.getItem("campaign.brandSeed");
    if (!raw) {
      alert("Geen brand info gevonden. Ga eerst naar Brand Voice en klik 'Use in Campaign Builder'.");
      return;
    }
    const seed: any = JSON.parse(raw);

    // wat we invullen:
    if (seed.brand?.product) setProduct(seed.brand.product);       // productveld
    if (seed.brand?.themes) setPromos(seed.brand.themes);          // ik gebruik 'themes' als extra/promo notities
    // je kunt hier  meer doen:
    // - seed.brand.caption / slogan / hashtags doorzetten naar je eigen velden of notities
    // - setGoal("Sales") bijvoorbeeld, als je dat wil

    alert("Brand info geïmporteerd!");
  } catch (e) {
    console.error("Import mislukt", e);
    alert("Import mislukt. Check console.");
  }
}
  function saveToVault() {
    if (!plan) { setErr("Geen campagne om op te slaan."); return; }
    const name = saveName.trim() || plan.meta.product || "campaign";
    const item: VaultItem = { id: crypto.randomUUID(), name, ts: Date.now(), plan };
    const next = [item, ...vault].slice(0, 3);
    setVault(next);
    try { localStorage.setItem(LS_VAULT, JSON.stringify(next)); } catch {}
    setSaveName("");
  }
  function loadFromVault(id: string) {
    const item = vault.find(v => v.id === id);
    if (!item) return;
    setPlan(item.plan);
    try { localStorage.setItem(LS_LAST, JSON.stringify(item.plan)); } catch {}
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function deleteFromVault(id: string) {
    const next = vault.filter(v => v.id !== id);
    setVault(next);
    try { localStorage.setItem(LS_VAULT, JSON.stringify(next)); } catch {}
  }

  function Pill({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
    return (
      <button type="button" onClick={onClick} className={`btn ${active ? "btn--gold" : ""}`} style={{borderRadius:9999, padding:"6px 12px", fontSize:14}}>
        {children}
      </button>
    );
  }

  return (
    <PageShell title="Campaign Builder" desc="Bouw een complete 4-weeks campagne. 50 credits per generatie.">
      {/* Vault */}
      <Card>
        <SectionTitle title="Mijn opslag (max 3)" desc="Bewaar, laad en  campaigns." />
        <div className="grid-3">
          {vault.length === 0 && (<div className={TOKENS.SUBTLE} style={{fontSize:14}}> geen opgeslagen campagnes.</div>)}
          {vault.map(v => (
            <div key={v.id} className="card" style={{padding:12}}>
              <div className="font-medium">{v.name}</div>
              <div className={TOKENS.SUBTLE} style={{fontSize:12}}>{new Date(v.ts).toLocaleString()}</div>
              <div style={{marginTop:8, display:"flex", gap:8}}>
                <GlowButton onClick={() => loadFromVault(v.id)}>Load</GlowButton>
                <button onClick={() => deleteFromVault(v.id)} className="btn" style={{borderColor:"rgba(255,99,99,.4)", color:"#fca5a5"}} type="button">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Inputs */}
<Card>
  {/* Titel + import-knop rechts */}
  <div className="flex items-center justify-between gap-2">
    <SectionTitle title="Inputs" desc="Product, doel, promo’s, platforms, cadans en duur." />
    <button type="button" className="el-btn" onClick={importFromBrandVoice}>
      Import from Brand Voice
    </button>
  </div>

  {/* 2-koloms grid: Product + Doel, en Promo's over 2 kolommen */}
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 12 }}>
    <div>
      <label className="label">Product/Service</label>
      <input
        className="input"
        value={product}
        onChange={(e) => setProduct(e.target.value)}
        placeholder="bv. Yoga mat"
      />
    </div>

    <div>
      <label className="label">Doel</label>
      <select
        className="el-select"  // <- dark select + gouden pijl
        value={goal}
        onChange={(e) => setGoal(e.target.value as any)}
      >
        <option>Sales</option>
        <option>Leads</option>
        <option>Traffic</option>
        <option>Views</option>
      </select>
    </div>

    <div style={{ gridColumn: "1 / -1" }}>
      <label className="label">Promo's / extra's (optioneel)</label>
      <input
        className="input"
        value={promos}
        onChange={(e) => setPromos(e.target.value)}
        placeholder='bv. "10% korting", "Gratis verzending", …'
      />
    </div>
  </div>

  {/* 3-koloms grid: Platforms (2 kolommen) + Cadans */}
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginTop: 18 }}>
    <div style={{ gridColumn: "1 / 3" }}>
      <div className="label" style={{ marginBottom: 6 }}>Platforms</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <Pill active={platforms.includes("facebook")} onClick={() => togglePlatform("facebook")}>Facebook</Pill>
        <Pill active={platforms.includes("instagram")} onClick={() => togglePlatform("instagram")}>Instagram</Pill>
      </div>
      <div className={TOKENS.SUBTLE} style={{ fontSize: 12, marginTop: 6 }}>
        Minstens één platform.
      </div>
    </div>

    <div>
      <div className="label" style={{ marginBottom: 6 }}>Cadans</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <Pill active={cadence === "light"} onClick={() => setCadence("light")}>Licht (1/wk)</Pill>
        <Pill active={cadence === "standard"} onClick={() => setCadence("standard")}>Standaard (2/wk)</Pill>
        <Pill active={cadence === "intense"} onClick={() => setCadence("intense")}>Intens (3/wk)</Pill>
      </div>
    </div>
  </div>

  {/* 3-koloms grid: Weken + CTA-balk rechts */}
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginTop: 18 }}>
    <div>
      <label className="label">Aantal weken</label>
      <input
        type="number"
        min={2}
        max={6}
        className="input"
        value={weeks}
        onChange={(e) => setWeeks(Math.max(2, Math.min(6, parseInt(e.target.value || "4", 10))))}
      />
      <div className={TOKENS.SUBTLE} style={{ fontSize: 12, marginTop: 6 }}>
        2–6 weken (4 aan te raden)
      </div>
    </div>

    <div style={{ gridColumn: "2 / -1", display: "flex", alignItems: "end", gap: 8, flexWrap: "wrap" }}>
      <GoldCTA onClick={generate} disabled={!canGenerate || busy}>
        {busy ? "Bezig…" : `Generate (${COST} credits)`}
      </GoldCTA>
      {hydrated && (
        <div className={TOKENS.SUBTLE} style={{ fontSize: 12 }}>
          Je credits:{" "}
          <strong style={{ color: credits < COST ? "#fca5a5" : "#86efac" }}>
            {credits}
          </strong>
        </div>
      )}
    </div>
  </div>

  {err && (
    <div
      className="card"
      style={{
        borderColor: "rgba(255,99,99,.4)",
        background: "rgba(255,99,99,.08)",
        color: "#fecaca",
        padding: 12,
        marginTop: 12,
      }}
    >
      {err}
    </div>
  )}
</Card>

      {/* Plan + Save */}
      {plan && (
        <Card>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
            <SectionTitle title="Campagneplan" desc={`${plan.meta.weeks} weken · ${plan.meta.cadence} · ${plan.meta.platforms.join(" + ")}`} />
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <input className="input" placeholder="Naam voor opslag" value={saveName} onChange={(e) => setSaveName(e.target.value)} />
              <GlowButton onClick={saveToVault}>Save</GlowButton>
              <button type="button" onClick={clearCurrent} className="btn">Clear</button>
            </div>
          </div>

          <div style={{marginTop:16}}>
            {plan.weeks.map((w, idx) => (
              <div key={idx} className="card" style={{padding:16, marginTop:16}}>
                <div style={{fontSize:20, fontWeight:700, marginBottom:6}}>Week {idx + 1}: {w.title}</div>
                <div className={TOKENS.SUBTLE} style={{fontSize:14}}>
                  {w.persona ? <>Persona <span style={{color:"#e5e7eb"}}>{w.persona}</span> · </> : null}
                  {w.angle ? <>Angle <span style={{color:"#e5e7eb"}}>{w.angle}</span></> : null}
                </div>

                <div style={{marginTop:12, overflowX:"auto"}}>
                  <table className="table" style={{minWidth:800}}>
                    <thead>
                      <tr>
                        <th>Platform</th><th>Type</th><th>Caption</th><th>CTA</th><th>Hashtags</th><th>Asset</th>
                      </tr>
                    </thead>
                    <tbody>
                      {w.items.map((it, i2) => (
                        <tr key={i2}>
                          <td>{it.platform}</td>
                          <td>{it.type}</td>
                          <td style={{whiteSpace:"pre-wrap"}}>{it.caption}</td>
                          <td>{it.cta}</td>
                          <td>{(it.hashtags || []).join(" ")}</td>
                          <td>{it.assetHint || ""}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </PageShell>
  );
}

