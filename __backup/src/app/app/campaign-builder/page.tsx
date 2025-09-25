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
  assetHint?: string; // korte hint voor beeld (geen echte upload hier)
};

type WeekPlan = {
  title: string; // bv. "Introductie van Product"
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
    weeks: number; // 2-6
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

// Wallet (zoals je oude code, puur localStorage)
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

/* ===================== LocalStorage keys ===================== */
const LS_LAST = "campaign.last";   // laatste gegenereerde plan
const LS_VAULT = "campaign.vault"; // [{id,name,ts,plan}] (max 3)

/* ===================== Fallback generator ===================== */
function buildFallbackPlan(input: {
  product: string; goal: CampaignPlan["meta"]["goal"]; promos: string;
  platforms: ("facebook" | "instagram")[]; cadence: "standard" | "light" | "intense"; weeks: number;
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
          caption:
            k === 0 && i === 0
              ? `Begin je week sterk: ontdek ${product}!`
              : `Waarom ${product} past bij jou — deel je ervaring in de comments.`,
          cta:
            goal === "Sales"
              ? "Shop nu"
              : goal === "Leads"
              ? "Schrijf je in"
              : goal === "Traffic"
              ? "Lees meer"
              : "Bekijk",
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
    meta: {
      product,
      goal,
      promos: promos || "",
      platforms,
      cadence,
      weeks,
      createdAt: new Date().toISOString(),
    },
    weeks: outWeeks,
  };
}

/* ===================== Component ===================== */
export default function CampaignBuilderPage() {
  // UI / hydration
  const [hydrated, setHydrated] = useState(false);

  // Inputs
  const [product, setProduct] = useState("");
  const [goal, setGoal] = useState<CampaignPlan["meta"]["goal"]>("Sales");
  const [promos, setPromos] = useState("");
  const [platforms, setPlatforms] = useState<("facebook" | "instagram")[]>(["facebook"]);
  const [cadence, setCadence] = useState<"light" | "standard" | "intense">("standard");
  const [weeks, setWeeks] = useState(4);

  // Plan & status
  const [plan, setPlan] = useState<CampaignPlan | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Credits
  const [credits, setCredits] = useState(0);
  const COST = 50;

  // Vault (max 3)
  type VaultItem = { id: string; name: string; ts: number; plan: CampaignPlan };
  const [vault, setVault] = useState<VaultItem[]>([]);
  const [saveName, setSaveName] = useState("");

  /* ---------- Hydration ---------- */
  useEffect(() => {
    setHydrated(true);
    const syncWallet = () => setCredits(walletRead().total);
    syncWallet();
    const onWallet = syncWallet as any;
    window.addEventListener("wallet:update", onWallet);
    window.addEventListener("storage", syncWallet);
    // load last
    try {
      const raw = localStorage.getItem(LS_LAST);
      if (raw) setPlan(JSON.parse(raw));
    } catch {}
    // load vault
    try {
      const raw = localStorage.getItem(LS_VAULT);
      const arr = raw ? (JSON.parse(raw) as VaultItem[]) : [];
      setVault(Array.isArray(arr) ? arr : []);
    } catch {}
    return () => {
      window.removeEventListener("wallet:update", onWallet);
      window.removeEventListener("storage", syncWallet);
    };
  }, []);

  /* ---------- Derived ---------- */
  const canGenerate = useMemo(() => {
    if (!product.trim()) return false;
    if (platforms.length === 0) return false;
    if (!hydrated) return false;
    if (credits < COST) return false;
    return true;
  }, [product, platforms, hydrated, credits]);

  /* ---------- Actions ---------- */
  async function generate() {
    setErr(null);
    if (!canGenerate) return;

    setBusy(true);
    try {
      // 1) probeer je eigen API (optioneel)
      let nextPlan: CampaignPlan | null = null;
      try {
        const res = await jfetch<{ ok: boolean; plan: CampaignPlan }>("/api/ai/campaign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product, goal, promos, platforms, cadence, weeks }),
        });
        if (res?.plan) nextPlan = res.plan;
      } catch {
        // geen probleem, we vallen terug op fallback
      }

      // 2) fallback (lokaal)
      if (!nextPlan) nextPlan = buildFallbackPlan({ product, goal, promos, platforms, cadence, weeks });

      // 3) wallet deduct pas na succes
      const { remaining } = walletDeduct(COST);
      setCredits(remaining);

      // 4) bewaar & toon
      setPlan(nextPlan);
      try { localStorage.setItem(LS_LAST, JSON.stringify(nextPlan)); } catch {}
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  }

  function clearCurrent() {
    setPlan(null);
    setSaveName("");
    try { localStorage.removeItem(LS_LAST); } catch {}
  }

  function togglePlatform(p: "facebook" | "instagram") {
    setPlatforms(prev => (prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]));
  }

  function saveToVault() {
    if (!plan) { setErr("Geen campagne om op te slaan."); return; }
    const name = saveName.trim() || plan.meta.product || "campaign";
    const item: VaultItem = {
      id: crypto.randomUUID(),
      name,
      ts: Date.now(),
      plan,
    };
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

  /* ---------- Render helpers ---------- */
  function Pill({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`rounded-full px-3 py-1.5 text-sm border ${active ? "border-amber-300 bg-amber-300/15 text-amber-300" : "border-white/10 text-neutral-200 hover:bg-white/5"}`}
      >
        {children}
      </button>
    );
  }

  return (
    <PageShell title="Campaign Builder" desc="Bouw een complete 4-weeks campagne. 50 credits per generatie.">
      {/* Vault */}
      <Card>
        <SectionTitle title="Mijn opslag (max 3)" desc="Bewaar, laad en verwijder campaigns." />
        <div className="grid gap-3 sm:grid-cols-3">
          {vault.length === 0 && (
            <div className={`${TOKENS.SUBTLE} text-sm`}>Nog geen opgeslagen campagnes.</div>
          )}
          {vault.map(v => (
            <div key={v.id} className="rounded-xl border border-white/10 p-3">
              <div className="font-medium">{v.name}</div>
              <div className={`text-xs ${TOKENS.SUBTLE}`}>{new Date(v.ts).toLocaleString()}</div>
              <div className="mt-2 flex gap-2">
                <GlowButton onClick={() => loadFromVault(v.id)}>Load</GlowButton>
                <button
                  onClick={() => deleteFromVault(v.id)}
                  className="rounded-xl px-3 py-2 text-sm border border-red-400/40 text-red-300 hover:bg-red-400/10"
                  type="button"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Inputs */}
      <Card>
        <SectionTitle title="Inputs" desc="Product, doel, promo’s, platforms, cadans en duur." />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Product/Service</label>
            <input
              className="mt-1 w-full rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 text-sm"
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              placeholder="bv. Yoga mat"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Doel</label>
            <select
              className="mt-1 w-full rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 text-sm"
              value={goal}
              onChange={(e) => setGoal(e.target.value as any)}
            >
              <option>Sales</option>
              <option>Leads</option>
              <option>Traffic</option>
              <option>Views</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="text-sm font-medium">Promo's / extra's (optioneel)</label>
            <input
              className="mt-1 w-full rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 text-sm"
              value={promos}
              onChange={(e) => setPromos(e.target.value)}
              placeholder='bv. "10% korting", "Gratis verzending", …'
            />
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <div className="text-sm font-medium mb-1">Platforms</div>
            <div className="flex flex-wrap gap-2">
              <Pill active={platforms.includes("facebook")} onClick={() => togglePlatform("facebook")}>Facebook</Pill>
              <Pill active={platforms.includes("instagram")} onClick={() => togglePlatform("instagram")}>Instagram</Pill>
            </div>
            <div className={`mt-1 text-xs ${TOKENS.SUBTLE}`}>Minstens één platform.</div>
          </div>

          <div>
            <div className="text-sm font-medium mb-1">Cadans</div>
            <div className="flex flex-wrap gap-2">
              <Pill active={cadence === "light"} onClick={() => setCadence("light")}>Licht (1/wk)</Pill>
              <Pill active={cadence === "standard"} onClick={() => setCadence("standard")}>Standaard (2/wk)</Pill>
              <Pill active={cadence === "intense"} onClick={() => setCadence("intense")}>Intens (3/wk)</Pill>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="text-sm font-medium">Aantal weken</label>
            <input
              type="number"
              min={2}
              max={6}
              className="mt-1 w-full rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 text-sm"
              value={weeks}
              onChange={(e) => setWeeks(Math.max(2, Math.min(6, parseInt(e.target.value || "4", 10))))}
            />
            <div className={`mt-1 text-xs ${TOKENS.SUBTLE}`}>2–6 weken (4 aan te raden)</div>
          </div>

          <div className="sm:col-span-2 flex items-end gap-2">
            <GoldCTA onClick={generate} disabled={!canGenerate || busy}>
              {busy ? "Bezig…" : `Generate (${COST} credits)`}
            </GoldCTA>
            {hydrated && (
              <div className={`text-xs ${TOKENS.SUBTLE}`}>
                Je credits: <strong className={credits < COST ? "text-red-300" : "text-emerald-300"}>{credits}</strong>
              </div>
            )}
          </div>
        </div>

        {err && <div className="mt-3 rounded-lg border border-red-400/40 bg-red-400/10 text-red-200 px-3 py-2 text-sm">{err}</div>}
      </Card>

      {/* Plan + Save */}
      {plan && (
        <Card>
          <div className="flex items-center justify-between gap-3">
            <SectionTitle title="Campagneplan" desc={`${plan.meta.weeks} weken · ${plan.meta.cadence} · ${plan.meta.platforms.join(" + ")}`} />
            <div className="flex items-center gap-2">
              <input
                className="rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 text-sm"
                placeholder="Naam voor opslag"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
              />
              <GlowButton onClick={saveToVault}>Save</GlowButton>
              <button
                type="button"
                onClick={clearCurrent}
                className="rounded-xl px-3 py-2 text-sm border border-white/10 hover:bg-white/5"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Render weeks */}
          <div className="mt-4 space-y-6">
            {plan.weeks.map((w, idx) => (
              <div key={idx} className="rounded-2xl border border-white/10 p-4">
                <div className="text-xl font-semibold mb-1">Week {idx + 1}: {w.title}</div>
                <div className={`text-sm ${TOKENS.SUBTLE}`}>
                  {w.persona ? <>Persona <span className="text-neutral-300">{w.persona}</span> · </> : null}
                  {w.angle ? <>Angle <span className="text-neutral-300">{w.angle}</span></> : null}
                </div>

                <div className="mt-3 overflow-x-auto">
                  <table className="min-w-[800px] w-full text-sm border-collapse">
                    <thead>
                      <tr className="text-left">
                        <th className="py-2 pr-3 font-semibold">Platform</th>
                        <th className="py-2 pr-3 font-semibold">Type</th>
                        <th className="py-2 pr-3 font-semibold">Caption</th>
                        <th className="py-2 pr-3 font-semibold">CTA</th>
                        <th className="py-2 pr-3 font-semibold">Hashtags</th>
                        <th className="py-2 pr-3 font-semibold">Asset</th>
                      </tr>
                    </thead>
                    <tbody>
                      {w.items.map((it, i2) => (
                        <tr key={i2} className="border-t border-white/10 align-top">
                          <td className="py-2 pr-3">{it.platform}</td>
                          <td className="py-2 pr-3">{it.type}</td>
                          <td className="py-2 pr-3 whitespace-pre-wrap">{it.caption}</td>
                          <td className="py-2 pr-3">{it.cta}</td>
                          <td className="py-2 pr-3">{(it.hashtags || []).join(" ")}</td>
                          <td className="py-2 pr-3">{it.assetHint || ""}</td>
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