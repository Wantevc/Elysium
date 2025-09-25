"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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

function Card({ children, className = "" }: { children: any; className?: string }) {
  return (
    <div className={`rounded-2xl border bg-white shadow-sm dark:bg-[#12161d] dark:border-[#2a3340] ${className}`}>
      {children}
    </div>
  );
}
function Badge({ children }: { children: any }) {
  return (
    <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs dark:border-[#39485a]">
      {children}
    </span>
  );
}

export default function PacksPage() {
  const router = useRouter();

  // MOCK wallet (later vervangen door backend/Stripe)
  const [subscription, setSubscription] = useState<PlanId | null>(null);
  const [subCredits, setSubCredits] = useState<number>(0);
  const [topupCredits, setTopupCredits] = useState<number>(0);

  const totalCredits = subCredits + topupCredits;
  const activePlan = useMemo(() => PLANS.find((p) => p.id === subscription) ?? null, [subscription]);

  function goToPlanner() {
    router.push("/app/planner");
  }

  function upgradeTo(p: Plan) {
    setSubscription(p.id);
    setSubCredits(p.credits);
    alert(`Gekozen: ${p.name} — (+${p.credits} credits) — MOCK`);
  }
  function buyTopup(t: Topup) {
    setTopupCredits((c) => c + t.credits);
    alert(`Top-up: ${t.name} (+${t.credits}) — MOCK`);
  }

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6 bg-gray-50 min-h-screen dark:bg-neutral-950">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold dark:text-neutral-100">Kies je plan</h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Selecteer een abonnement of koop een extra pack om te starten.
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-neutral-500 dark:text-neutral-400">Beschikbare credits</div>
          <div className="text-2xl font-bold dark:text-neutral-100">{totalCredits}</div>
          {activePlan && <div className="text-xs text-neutral-500 mt-0.5 dark:text-neutral-400">Plan: {activePlan.name}</div>}
        </div>
      </div>

      {/* Abonnementen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map((p) => {
          const isActive = p.id === activePlan?.id;
          return (
            <Card key={p.id}>
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-lg font-semibold dark:text-neutral-100">{p.name}</div>
                    <div className="text-sm text-neutral-500 dark:text-neutral-400">€{p.price} / maand</div>
                  </div>
                  {isActive && <Badge>Geselecteerd</Badge>}
                </div>

                <div className="mt-2 text-sm dark:text-neutral-200">
                  <strong>{p.credits}</strong> credits / maand
                  {p.features.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {p.features.includes("team_access") && <Badge>Teamtoegang</Badge>}
                      {p.features.includes("exclusive_templates") && <Badge>Exclusieve Templates</Badge>}
                    </div>
                  )}
                  {p.id === "diamond" && p.team && (
                    <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                      Inclusief {p.team.included_seats} seats (max {p.team.max_seats}). Extra seat €{p.team.additional_seat_price}/m.
                    </div>
                  )}
                </div>

                <button
                  className="mt-4 w-full rounded-xl border px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-[#0f1319] dark:text-neutral-100"
                  onClick={() => upgradeTo(p)}
                >
                  {isActive ? "Plan beheren (MOCK)" : `Kies ${p.name}`}
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Top-ups */}
      <Card>
        <div className="p-4">
          <div className="text-lg font-semibold mb-1 dark:text-neutral-100">Extra Packs</div>
          <div className="text-sm text-neutral-600 mb-3 dark:text-neutral-400">Voeg direct credits toe.</div>
          <div className="flex flex-wrap gap-2">
            {TOPUPS.map((t) => (
              <button
                key={t.id}
                onClick={() => buyTopup(t)}
                className="rounded-xl border px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-[#0f1319] dark:text-neutral-100"
                title={`€${t.price} • +${t.credits} credits`}
              >
                {t.name} — +{t.credits} credits
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Door naar planner */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-neutral-600 dark:text-neutral-400">
          Je kunt verder zodra je <strong>credits &gt; 0</strong> of een plan gekozen hebt.
        </div>
        <button
          disabled={totalCredits <= 0}
          onClick={goToPlanner}
          className="rounded-xl border px-4 py-2 text-sm hover:bg-neutral-900 hover:text-white disabled:opacity-50 dark:text-neutral-100 dark:hover:bg-neutral-800"
        >
          Ga naar Planner
        </button>
      </div>
    </div>
  );
}
