"use client";

import React, { useEffect, useMemo, useState } from "react";
import PageShell from "../components/PageShell";
import { Card, SectionTitle, TOKENS, GlowButton } from "../components/ui";
import DiamondOnly from "../components/DiamondOnly";

/** mini helpers – lokaal  tot je backend klaar is */
type Member = { email: string; role: "owner"|"member" };
const TEAM_KEY = "diamond.team.members";

function loadMembers(): Member[] {
  try {
    const raw = localStorage.getItem(TEAM_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Member[];
  } catch { return []; }
}
function saveMembers(m: Member[]) {
  try { localStorage.setItem(TEAM_KEY, JSON.stringify(m)); window.dispatchEvent(new Event("team:update")); } catch {}
}

export default function TeamSeatsPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [email, setEmail] = useState("");
  const MAX_SEATS = 4; // 1 owner + 3 seats

  useEffect(() => {
    const sync = () => setMembers(loadMembers());
    sync();
    window.addEventListener("team:update", sync);
    return () => window.removeEventListener("team:update", sync);
  }, []);

  // zorg dat er een owner bestaat (jij)
  useEffect(() => {
    if (members.some(m => m.role === "owner")) return;
    const me = (localStorage.getItem("user.email") || "you@example.com");
    const base = [{ email: me, role: "owner" as const }];
    saveMembers(base);
    setMembers(base);
  }, [members]);

  const seatsLeft = useMemo(() => Math.max(0, MAX_SEATS - members.length), [members]);

  function invite() {
    const e = email.trim().toLowerCase();
    if (!e || !e.includes("@")) return alert("Enter a valid email");
    if (members.find(m => m.email === e)) return alert("This email is already in your team.");
    if (members.length >= MAX_SEATS) return alert("No seats left on Diamond.");
    const next = [...members, { email: e, role: "member" as const }];
    saveMembers(next);
    setEmail("");
  }

  function removeMember(idx: number) {
    const m = members[idx];
    if (m.role === "owner") return alert("Owner cannot be removed.");
    const next = members.filter((_, i) => i !== idx);
    saveMembers(next);
  }

  return (
    <PageShell title="Team Seats" desc="Beheer  binnen je Diamond-plan.">
      <DiamondOnly>
        <Card>
          <SectionTitle title="Team" desc="Nodig tot 3 extra  uit (Diamond). Ze delen dezelfde workspace en credits." />
          <div className="rounded-xl border border-white/10 p-3">
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="email"
                placeholder="teammate@company.com"
                value={email}
                onChange={(e)=>setEmail(e.target.value)}
                className="rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 text-sm"
              />
              <GlowButton onClick={invite} disabled={!email || seatsLeft<=0}>
                Invite seat ({seatsLeft} left)
              </GlowButton>
            </div>

            <div className="mt-4">
              <div className={`${TOKENS.SUBTLE} text-xs mb-2`}>Team members</div>
              <div className="divide-y divide-white/10 rounded-xl border border-white/10 overflow-hidden">
                {members.map((m, i) => (
                  <div key={m.email} className="flex items-center justify-between px-3 py-2">
                    <div>
                      <div className="text-sm">{m.email}</div>
                      <div className={`${TOKENS.SUBTLE} text-xs`}>{m.role === "owner" ? "Owner" : "Member"}</div>
                    </div>
                    {m.role !== "owner" && (
                      <button
                        type="button"
                        className="rounded-lg border border-white/10 px-2 py-1 text-xs hover:bg-white/5"
                        onClick={()=>removeMember(i)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                {members.length === 0 && (
                  <div className={`${TOKENS.SUBTLE} px-3 py-6 text-sm`}>No members yet.</div>
                )}
              </div>
            </div>
          </div>
        </Card>
      </DiamondOnly>
    </PageShell>
  );
}

