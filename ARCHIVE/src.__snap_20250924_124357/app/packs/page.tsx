"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

/** types */
type FeatureKey = "team_access" | "exclusive_templates";
type PlanId = "basic" | "premium" | "diamond";
type TopupId = "pack_small" | "pack_large";

type Plan = {
  id: PlanId;
  name: string;
  price: number;
  credits: number;
  features: FeatureKey[];
  team?: { included_seats: number; max_seats: number; additional_seat_price: number };
};
type Topup = { id: TopupId; name: string; price: number; credits: number };

/** data */
const PLANS: Plan[] = [
  { id: "basic", name: "Abonnement Basis", price: 10, credits: 100, features: [] },
  { id: "premium", name: "Abonnement Premium", price: 20, credits: 250, features: [] },
  {
    id: "diamond",
    name: "Abonnement Diamond",
    price: 30,
    credits: 400,
    features: ["team_access", "exclusive_templates"],
    team: { included_seats: 3, max_seats: 5, additional_seat_price: 5 },
  },
];
const TOPUPS: Topup[] = [
  { id: "pack_small", name: "Extra Pack (50)", price: 5, credits: 50 },
  { id: "pack_large", name: "Extra Pack Groot (120)", price: 10, credits: 120 },
];

/** localStorage helpers */
function loadWallet() {
  try {
    const plan = (localStorage.getItem("wallet.plan") || "") as PlanId | "";
    const sub = parseInt(localStorage.getItem("wallet.subCredits") || "0", 10) || 0;
    const top = parseInt(localStorage.getItem("wallet.topupCredits") || "0", 10) || 0;
    return { plan: (plan || null) as PlanId | null, subCredits: sub, topupCredits: top, total: sub + top };
  } catch {
    return { plan: null as PlanId | null, subCredits: 0, topupCredits: 0, total: 0 };
  }
}
function saveWallet(plan: PlanId | null, subCredits: number, topupCredits: number) {
  const total = subCredits + topupCredits;
  try {
    localStorage.setItem("wallet.plan", plan ?? "");
    localStorage.setItem("wallet.subCredits", String(subCredits));
    localStorage.setItem("wallet.topupCredits", String(topupCredits));
    localStorage.setItem("wallet.total", String(total));
    window.dispatchEvent(new Event("wallet:update"));
  } catch {}
}

function Card({ children, className = "" }: { children: any; className?: string }) {
  return <div className={`rounded-2xl border bg-white shadow-sm ${className}`}>{children}</div>;
}
function Badge({ children }: { children: any }) {
  return <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">{children}</span>;
}

export default function PacksPage() {
  const router = useRouter();

  /** BELANGRIJK: start met stabiele SSR-waarden en laad pas NA mount */
  const [mounted, setMounted] = useState(false);
  const [subscription, setSubscription] = useState<PlanId | null>(null);
  const [subCredits, setSubCredits] = useState(0);
  const [topupCredits, setTopupCredits] = useState(0);

  const totalCredits = subCredits + topupCredits;
  const activePlan = useMemo(() => PLANS.find((p) => p.id === subscription) ?? null, [subscription]);

  useEffect(() => {
    setMounted(true);
    const w = loadWallet();
    setSubscription(w.plan);
    setSubCredits(w.subCredits);
    setTopupCredits(w.topupCredits);
  }, []);

  // elke wijziging wegschrijven (client only)
  useEffect(() => {
    if (!mounted) return;
    saveWallet(subscription, subCredits, topupCredits);
  }, [mounted, subscription, subCredits, topupCredits]);

  function goToDashboard() {
    router.push("/app/planner");
  }
  function upgradeTo(p: Plan) {
  setSubscription(p.id);
  setSubCredits(p.credits);

  // 🟦 Diamond team defaults in localStorage (only when choosing Diamond)
  try {
    if (p.id === "diamond") {
      const exists = localStorage.getItem("team.config");
      if (!exists) {
        const team = {
          seatsIncluded: 3,
          seatsMax: 5,
          members: [] as string[], // emails
        };
        localStorage.setItem("team.config", JSON.stringify(team));
      }
    } else {
      // Optional: if you downgrade, you can keep team or clear it.
      // localStorage.removeItem("team.config");
    }
  } catch {}

  alert(`Gekozen: ${p.name} — (+${p.credits} credits)`);
}
  function buyTopup(t: Topup) {
    setTopupCredits((c) => c + t.credits);
    alert(`Top-up: ${t.name} (+${t.credits})`);
  }

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kies je plan</h1>
          <p className="text-sm text-neutral-600">Selecteer een abonnement of koop een extra pack om te starten.</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-neutral-500">Beschikbare credits</div>
          {/* voorkom hydration mismatch */}
          <div className="text-2xl font-bold" suppressHydrationWarning>
            {mounted ? totalCredits : 0}
          </div>
          {mounted && activePlan && (
            <div className="text-xs text-neutral-500 mt-0.5">Plan: {activePlan.name}</div>
          )}
        </div>
      </div>

      {/* Abonnementen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map((p) => {
          const isActive = mounted && p.id === activePlan?.id;
          return (
            <Card key={p.id}>
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-lg font-semibold">{p.name}</div>
                    <div className="text-sm text-neutral-500">€{p.price} / maand</div>
                  </div>
                  {isActive && <Badge>Geselecteerd</Badge>}
                </div>

                <div className="mt-2 text-sm">
                  <strong>{p.credits}</strong> credits / maand
                  {p.features.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {p.features.includes("team_access") && <Badge>Teamtoegang</Badge>}
                      {p.features.includes("exclusive_templates") && <Badge>Exclusieve Templates</Badge>}
                    </div>
                  )}
                  {p.id === "diamond" && p.team && (
                    <div className="mt-2 text-xs text-neutral-500">
                      Inclusief {p.team.included_seats} seats (max {p.team.max_seats}). Extra seat €{p.team.additional_seat_price}/m.
                    </div>
                  )}
                </div>

                <button
                  className="mt-4 w-full rounded-xl border px-3 py-2 text-sm hover:bg-neutral-100"
                  onClick={() => upgradeTo(p)}
                >
                  {isActive ? "Plan beheren" : `Kies ${p.name}`}
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Top-ups */}
      <Card>
        <div className="p-4">
          <div className="text-lg font-semibold mb-1">Extra Packs</div>
          <div className="text-sm text-neutral-600 mb-3">Voeg direct credits toe.</div>
          <div className="flex flex-wrap gap-2">
            {TOPUPS.map((t) => (
              <button
                key={t.id}
                onClick={() => buyTopup(t)}
                className="rounded-xl border px-3 py-2 text-sm hover:bg-neutral-100"
                title={`€${t.price} • +${t.credits} credits`}
              >
                {t.name} — +{t.credits} credits
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Door naar dashboard */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-neutral-600">
          Je kunt verder zodra je <strong>credits &gt; 0</strong> of een plan gekozen hebt.
        </div>
        <button
          disabled={!mounted || totalCredits <= 0}
          onClick={goToDashboard}
          className="rounded-xl border px-4 py-2 text-sm hover:bg-neutral-900 hover:text-white disabled:opacity-50"
        >
          Ga naar Dashboard
        </button>
      </div>
    </div>
  );
}
