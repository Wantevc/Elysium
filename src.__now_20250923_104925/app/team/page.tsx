"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
// 👉 Als jouw bestand in src/app/app/team/page.tsx staat, verander dit naar: "../../components/WalletBadge"
import WalletBadge from "../components/WalletBadge";

type TeamConfig = {
  seatsIncluded: number;
  seatsMax: number;
  members: string[];
};

function loadPlan(): "basic" | "premium" | "diamond" | "" {
  try { return (localStorage.getItem("wallet.plan") || "") as any; } catch { return ""; }
}
function loadTeam(): TeamConfig {
  try {
    const raw = localStorage.getItem("team.config");
    if (raw) return JSON.parse(raw);
  } catch {}
  return { seatsIncluded: 0, seatsMax: 0, members: [] };
}
function saveTeam(t: TeamConfig) {
  try {
    localStorage.setItem("team.config", JSON.stringify(t));
    window.dispatchEvent(new Event("team:update"));
  } catch {}
}

export default function TeamPage() {
  const [mounted, setMounted] = useState(false);
  const [plan, setPlan] = useState<"basic" | "premium" | "diamond" | "">("");
  const [team, setTeam] = useState<TeamConfig>({ seatsIncluded: 0, seatsMax: 0, members: [] });
  const [email, setEmail] = useState("");

  useEffect(() => {
    setMounted(true);
    setPlan(loadPlan());
    setTeam(loadTeam());
    const sync = () => { setTeam(loadTeam()); setPlan(loadPlan()); };
    window.addEventListener("team:update", sync as any);
    window.addEventListener("wallet:update", sync as any);
    return () => {
      window.removeEventListener("team:update", sync as any);
      window.removeEventListener("wallet:update", sync as any);
    };
  }, []);

  const seatsUsed = team.members.length;
  const limit = team.seatsMax || team.seatsIncluded || 0;
  const canAdd = mounted && plan === "diamond" && seatsUsed < limit;

  function addMember() {
    const e = email.trim().toLowerCase();
    if (!e || !e.includes("@")) return alert("Enter a valid email.");
    if (team.members.includes(e)) return alert("Already added.");
    if (!canAdd) return alert("Seat limit reached or no Diamond plan.");
    const next = { ...team, members: [...team.members, e] };
    setTeam(next);
    saveTeam(next);
    setEmail("");
  }

  function removeMember(e: string) {
    const next = { ...team, members: team.members.filter((m) => m !== e) };
    setTeam(next);
    saveTeam(next);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header met terugknoppen */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team</h1>
          <p className="text-sm text-neutral-600" suppressHydrationWarning>
            {mounted ? (
              plan === "diamond" ? (
                <>Diamond actief — seats: {team.seatsIncluded} inbegrepen (max {team.seatsMax}).</>
              ) : (
                <>Geen Diamond plan. <a className="underline" href="/packs">Upgrade in Packs</a>.</>
              )
            ) : (
              <>Loading…</>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Pas href aan als jouw dashboard NIET onder /app staat */}
          <Link
            href="/app"
            className="px-3 py-2 rounded-2xl border bg-white hover:bg-neutral-100 text-sm"
          >
            ← Dashboard
          </Link>
          <Link
            href="/app/planner"
            className="px-3 py-2 rounded-2xl border bg-white hover:bg-neutral-100 text-sm"
          >
            Planner
          </Link>
          <WalletBadge />
        </div>
      </header>

      {/* Seats-kaart */}
      <div className="rounded-2xl border bg-white p-4">
        <div className="text-sm text-neutral-700 mb-2" suppressHydrationWarning>
          Seats: <strong>{mounted ? seatsUsed : 0}</strong> / {mounted ? limit : 0}{" "}
          {mounted && plan !== "diamond" && "(upgrade voor teamtoegang)"}
        </div>

        <div className="flex gap-2 mb-3">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="member@email.com"
            className="w-full rounded-lg border px-3 py-2 text-sm"
            disabled={!mounted || plan !== "diamond"}
          />
          <button
            onClick={addMember}
            disabled={!canAdd}
            className="rounded-lg border px-3 py-2 text-sm hover:bg-neutral-100 disabled:opacity-50"
            type="button"
          >
            Add
          </button>
        </div>

        {!mounted ? (
          <div className="text-sm text-neutral-500">Loading…</div>
        ) : team.members.length === 0 ? (
          <div className="text-sm text-neutral-500">No members yet.</div>
        ) : (
          <ul className="space-y-2">
            {team.members.map((m) => (
              <li key={m} className="flex items-center justify-between rounded-xl border px-3 py-2 text-sm">
                <span>{m}</span>
                <button
                  onClick={() => removeMember(m)}
                  className="rounded-lg border px-2 py-1 hover:bg-neutral-100"
                  title="Remove"
                  type="button"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Tip-teksten */}
      <div className="text-sm text-neutral-600">
        Tip: dit is een <code>localStorage</code>-simulatie. In productie koppel je dit aan je backend (teams, invites, rollen).
      </div>
    </div>
  );
}