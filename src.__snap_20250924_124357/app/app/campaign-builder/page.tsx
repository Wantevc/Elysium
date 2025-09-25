"use client";

import React, { useMemo, useState, useEffect } from "react";

/** ---------- Kleine UI helpers (Black & Gold) ---------- */
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-black/50 p-5 ${className}`}>
      {children}
    </div>
  );
}
function SectionTitle({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="mb-3">
      <div className="text-lg font-semibold">{title}</div>
      {desc ? <div className="text-sm text-neutral-400">{desc}</div> : null}
    </div>
  );
}

/** ---------- Types ---------- */
type Goal = "sales" | "website" | "views" | "leads";
type Platform = "facebook" | "instagram" | "both";

type CampaignInput = {
  product: string;
  audience: string;
  goal: Goal;
  platforms: Platform;
  offer?: string;
  notes?: string;
};

type DayPlan = {
  day: number;               // 1..30
  channel: "FB" | "IG" | "FB+IG";
  contentType: "text" | "image" | "image+text" | "story" | "reel";
  caption: string;
  idea: string;
};

type CampaignPlan = {
  meta: {
    product: string;
    goal: Goal;
    platforms: Platform;
    createdAt: string;
  };
  calendar: DayPlan[];
};

/** ---------- Helpers ---------- */
function formatGoal(goal: Goal) {
  return goal === "sales" ? "Sales"
    : goal === "website" ? "Website conversies"
    : goal === "views" ? "Views / bereik"
    : "Leads";
}

function pick<T>(arr: T[], i: number) {
  return arr[i % arr.length];
}

function buildPlan(input: CampaignInput): CampaignPlan {
  const calendar: DayPlan[] = [];
  const channel: "FB" | "IG" | "FB+IG" =
    input.platforms === "facebook" ? "FB"
    : input.platforms === "instagram" ? "IG"
    : "FB+IG";

  const contentCycle: DayPlan["contentType"][] = ["image+text", "text", "reel", "image+text", "story", "image+text", "text"];
  const hookPool = [
    "🔥 Nieuw & exclusief",
    "✅ Probleem → Oplossing",
    "💡 Tip van de dag",
    "🎯 Resultaten / Review",
    "⏳ Tijdelijke actie",
    "🙌 Behind-the-scenes",
    "❓ FAQ / Q&A"
  ];

  for (let d = 1; d <= 30; d++) {
    const ctype = pick(contentCycle, d);
    const hook = pick(hookPool, d);
    const withOffer = (input.offer || "").trim().length > 0;

    const base = `(${hook}) ${input.product} — voor ${input.audience}. Doel: ${formatGoal(input.goal)}.`;
    const caption =
      ctype === "text"
        ? `${base}${withOffer ? ` Actie: ${input.offer}.` : ""}`
        : `${base}${withOffer ? ` • ${input.offer}` : ""} #${input.goal} #${input.platforms}`;

    const idea =
      ctype === "reel"
        ? "Korte video (7–12s): probleem → oplossing → CTA."
        : ctype === "story"
        ? "3 Stories: teaser • bewijs • CTA met link sticker."
        : "Visual met 1 duidelijke boodschap + sterke CTA.";

    calendar.push({
      day: d,
      channel,
      contentType: ctype,
      caption,
      idea
    });
  }

  return {
    meta: {
      product: input.product,
      goal: input.goal,
      platforms: input.platforms,
      createdAt: new Date().toISOString(),
    },
    calendar,
  };
}

/** ---------- Download helpers ---------- */
function downloadJSON(obj: any, filename: string) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  a.remove(); URL.revokeObjectURL(url);
}

/** ---------- Local “Campaign Vault” (max 3 items) ---------- */
type VaultItem = { id: string; name: string; plan: CampaignPlan; savedAt: string; };
function readVault(): VaultItem[] {
  try {
    const raw = localStorage.getItem("campaign.vault");
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}
function writeVault(items: VaultItem[]) {
  try { localStorage.setItem("campaign.vault", JSON.stringify(items)); } catch {}
}

/** ---------- Page ---------- */
export default function CampaignBuilderPage() {
  const [product, setProduct] = useState("");
  const [audience, setAudience] = useState("");
  const [goal, setGoal] = useState<Goal>("sales");
  const [platforms, setPlatforms] = useState<Platform>("both");
  const [offer, setOffer] = useState("");
  const [notes, setNotes] = useState("");

  const [busy, setBusy] = useState(false);
  const [plan, setPlan] = useState<CampaignPlan | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [vault, setVault] = useState<VaultItem[]>([]);
  const [vaultName, setVaultName] = useState("");

  // laad vault
  useEffect(() => { setVault(readVault()); }, []);

  const canGenerate = useMemo(() => {
    return product.trim().length >= 2 && audience.trim().length >= 2;
  }, [product, audience]);

  async function generate() {
    setErr(null);
    if (!canGenerate) { setErr("Vul minstens product en doelgroep in."); return; }
    setBusy(true);
    try {
      // Hier gebruiken we een lokale generator (geen externe API nodig).
      const input: CampaignInput = { product, audience, goal, platforms, offer, notes };
      const p = buildPlan(input);
      setPlan(p);
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  }

  function saveToVault() {
    if (!plan) return;
    const name = vaultName.trim() || `${plan.meta.product} · ${new Date().toISOString().split("T")[0]}`;
    const now: VaultItem = { id: crypto.randomUUID(), name, plan, savedAt: new Date().toISOString() };
    const current = readVault();
    if (current.length >= 3) {
      current.shift(); //  oudste → max 3
    }
    const next = [...current, now];
    writeVault(next);
    setVault(next);
    setVaultName("");
  }

  function loadFromVault(id: string) {
    const v = readVault();
    const item = v.find(x => x.id === id);
    if (item) setPlan(item.plan);
  }

  function deleteFromVault(id: string) {
    const v = readVault().filter(x => x.id !== id);
    writeVault(v);
    setVault(v);
    if (plan && !v.find(x => x.plan.meta.createdAt === plan.meta.createdAt)) {
      // geladen plan is net d → leegmaken
      setPlan(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Campaign Builder</h1>
        <p className="text-sm text-neutral-400 mt-1">Genereer een 30-dagen social campagne. Black & Gold stijl.</p>
      </div>

      <Card>
        <SectionTitle title="Input" desc="Vul je basis in. Minstens product en doelgroep zijn nodig." />
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Product / dienst *</label>
            <input
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
              value={product}
              onChange={e => setProduct(e.target.value)}
              placeholder="vb. Premium hondenspeeltjes"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Doelgroep *</label>
            <input
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
              value={audience}
              onChange={e => setAudience(e.target.value)}
              placeholder="vb. Drukke hondeneigenaars in België"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Doel</label>
            <select
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
              value={goal}
              onChange={e => setGoal(e.target.value as Goal)}
            >
              <option value="sales">Sales</option>
              <option value="website">Website conversies</option>
              <option value="views">Views / bereik</option>
              <option value="leads">Leads</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Platformen</label>
            <select
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
              value={platforms}
              onChange={e => setPlatforms(e.target.value as Platform)}
            >
              <option value="both">Facebook + Instagram</option>
              <option value="facebook">Alleen Facebook</option>
              <option value="instagram">Alleen Instagram</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Promo / Offer (optioneel)</label>
            <input
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
              value={offer}
              onChange={e => setOffer(e.target.value)}
              placeholder='vb. "−10% deze week"'
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Extra notities (optioneel)</label>
            <textarea
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm h-20"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Belangrijke constraints, tone-of-voice, etc."
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            onClick={generate}
            disabled={busy || !canGenerate}
            className="rounded-xl border border-amber-300/40 bg-black px-4 py-2 text-sm hover:bg-neutral-900 disabled:opacity-50"
            type="button"
          >
            {busy ? "Bezig…" : "Generate 30-Day Plan"}
          </button>
          {err && <div className="text-sm text-red-400">{err}</div>}
        </div>
      </Card>

      {/* Vault */}
      <Card>
        <SectionTitle title="Campaign Vault (max 3)" desc="Sla je plan op, laad later terug of ." />
        <div className="flex flex-wrap gap-2 mb-3">
          <input
            className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
            placeholder="Naam voor deze campagne…"
            value={vaultName}
            onChange={e => setVaultName(e.target.value)}
          />
          <button
            onClick={saveToVault}
            disabled={!plan}
            className="rounded-lg border border-amber-300/40 bg-black px-3 py-2 text-sm hover:bg-neutral-900 disabled:opacity-50"
            type="button"
          >
            Save to Vault
          </button>
        </div>

        {vault.length === 0 ? (
          <div className="text-sm text-neutral-400"> geen opgeslagen campagnes.</div>
        ) : (
          <div className="grid md:grid-cols-3 gap-3">
            {vault.map(v => (
              <div key={v.id} className="rounded-xl border border-white/10 bg-black/40 p-3">
                <div className="text-sm font-medium">{v.name}</div>
                <div className="text-xs text-neutral-500">{new Date(v.savedAt).toLocaleString()}</div>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => loadFromVault(v.id)}
                    className="rounded border border-white/15 px-2 py-1 text-xs hover:bg-neutral-900"
                    type="button"
                  >
                    Load
                  </button>
                  <button
                    onClick={() => downloadJSON(v.plan, `${(v.name || "campaign").replace(/[^\w\-]+/g,"-")}.json`)}
                    className="rounded border border-white/15 px-2 py-1 text-xs hover:bg-neutral-900"
                    type="button"
                  >
                    Download JSON
                  </button>
                  <button
                    onClick={() => deleteFromVault(v.id)}
                    className="rounded border border-white/15 px-2 py-1 text-xs hover:bg-neutral-900"
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Result */}
      {plan && (
        <Card>
          <SectionTitle
            title="Campagneplan"
            desc={`${plan.meta.product} · ${formatGoal(plan.meta.goal)} · ${plan.meta.platforms.toUpperCase()} · ${new Date(plan.meta.createdAt).toLocaleString()}`}
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-neutral-300">
                  <th className="border-b border-white/10 pb-2 pr-3">Dag</th>
                  <th className="border-b border-white/10 pb-2 pr-3">Kanaal</th>
                  <th className="border-b border-white/10 pb-2 pr-3">Type</th>
                  <th className="border-b border-white/10 pb-2 pr-3">Idee</th>
                  <th className="border-b border-white/10 pb-2">Caption</th>
                </tr>
              </thead>
              <tbody>
                {plan.calendar.map(row => (
                  <tr key={row.day} className="align-top">
                    <td className="border-b border-white/5 py-2 pr-3">{row.day}</td>
                    <td className="border-b border-white/5 py-2 pr-3">{row.channel}</td>
                    <td className="border-b border-white/5 py-2 pr-3">{row.contentType}</td>
                    <td className="border-b border-white/5 py-2 pr-3">{row.idea}</td>
                    <td className="border-b border-white/5 py-2">{row.caption}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => {
                const name = (plan.meta.product || "campaign").toString().replace(/[^\w\-]+/g,"-").toLowerCase();
                downloadJSON(plan, `${name}-${new Date().toISOString().split("T")[0]}.json`);
              }}
              className="rounded-xl border border-amber-300/40 bg-black px-4 py-2 text-sm hover:bg-neutral-900"
              type="button"
            >
              Download JSON
            </button>
            <button
              onClick={() => setPlan(null)}
              className="rounded-xl border border-white/15 px-4 py-2 text-sm hover:bg-neutral-900"
              type="button"
            >
              Clear
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}

