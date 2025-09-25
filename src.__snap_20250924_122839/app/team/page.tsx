"use client";
import React, { useEffect, useState } from "react";
import ElysiumLayout from "../../components/elysium/Layout";

type Member = { email: string };

const KEY_MEMBERS = "team.seats.members";
const KEY_EXTRA   = "team.seats.extraPurchased";  // hoeveel extra seats gekocht (0..3)
const INCLUDED    = 3;     // gratis bij Diamond
const MAX_EXTRA   = 3;     // bijkoopbaar
const EXTRA_PRICE = 5;     // € per extra seat
const MAX_TOTAL   = INCLUDED + MAX_EXTRA; // 6
const hasDiamond = () =>
  (typeof window !== "undefined") &&
  (localStorage.getItem("wallet.plan") || "").toLowerCase() === "diamond";

export default function TeamPage() {
  const [ok, setOk] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [email, setEmail] = useState("");
  const [extraPurchased, setExtraPurchased] = useState(0); // 0..3

  // derived
  const allowance = INCLUDED + extraPurchased; // zoveel seats mag je bezetten
  const used = members.length;
  const freeIncludedLeft = Math.max(0, INCLUDED - used);
  const extraUsed = Math.max(0, used - INCLUDED);
  const extraLeftToUse = Math.max(0, allowance - used);
  const extraLeftToBuy = Math.max(0, MAX_EXTRA - extraPurchased);

  useEffect(() => {
    setOk(hasDiamond());
    try {
      const rawM = localStorage.getItem(KEY_MEMBERS);
      if (rawM) {
        const arr = JSON.parse(rawM);
        if (Array.isArray(arr)) setMembers(arr.filter(Boolean));
      }
      const rawX = localStorage.getItem(KEY_EXTRA);
      const x = Math.max(0, Math.min(MAX_EXTRA, Number(rawX ?? 0)));
      setExtraPurchased(isNaN(x) ? 0 : x);
    } catch {}
  }, []);

  function persistMembers(next: Member[]) {
    setMembers(next);
    localStorage.setItem(KEY_MEMBERS, JSON.stringify(next));
  }

  function addMember() {
    const e = email.trim().toLowerCase();
    if (!e || !e.includes("@")) return alert("Geef een geldig e-mailadres.");
    if (members.find((m) => m.email === e)) return alert("Bestaat al.");
    if (used >= allowance) {
      return alert(`Je hebt alle beschikbare seats bezet. Koop eerst een extra seat of verwijder iemand.`);
    }
    persistMembers([...members, { email: e }]);
    setEmail("");
  }

  function removeMember(e: string) {
    persistMembers(members.filter((m) => m.email !== e));
  }

  function buyOneExtra() {
    if (extraPurchased >= MAX_EXTRA) return;
    const will = confirm(
      `Bevestigen?\n\n1 extra seat kost €${EXTRA_PRICE}.\n` +
      `Maximaal ${MAX_EXTRA} extra seats.`
    );
    if (!will) return;

    const next = extraPurchased + 1;
    setExtraPurchased(next);
    localStorage.setItem(KEY_EXTRA, String(next));
    alert(`✔️ Aangekocht: 1 extra seat voor €${EXTRA_PRICE}. Je totaal toegestane seats is nu ${INCLUDED}+${next} = ${INCLUDED + next}.`);
  }

  if (!ok) {
    return (
      <ElysiumLayout title="Team (Diamond)" subtitle="Alleen met Diamond-pack.">
        <div className="el-card">
          <div className="text-[15px] text-[color:var(--muted)]">
            Deze pagina is vergrendeld. Upgrade naar <b>Diamond</b> om Team Seats te gebruiken.
          </div>
          <div className="mt-3 flex gap-8 text-[13px] text-[color:var(--muted)]">
            <div>✓ 3 seats inbegrepen</div>
            <div>✓ Uitbreidbaar t/m 6</div>
            <div>✓ Toekomst: invites & rollen</div>
          </div>
          <div className="mt-4">
            <a href="/packs" className="el-btn">Upgrade</a>
          </div>
        </div>
      </ElysiumLayout>
    );
  }

  return (
    <ElysiumLayout
      title="Team"
      subtitle={`Diamond actief — ${INCLUDED} seats inbegrepen. Maximaal ${MAX_TOTAL}.`}
    >
      {/* Seats samenvatting + kopen */}
      <div className="el-card">
        <div className="flex flex-wrap items-center gap-10">
          <div className="text-[15px]">
            <b>Bezetting:</b> {used} / {allowance}
            <span className="ml-2 opacity-70 text-[13px]">
              ({INCLUDED} inbegrepen, {extraPurchased} extra gekocht)
            </span>
          </div>

          <div className="text-[13px] opacity-80">
            {freeIncludedLeft > 0 ? (
              <>Nog <b>{freeIncludedLeft}</b> gratis seat(s) over.</>
            ) : (
              <>
                Extra in gebruik: <b>{extraUsed}</b>. Toegestaan (gekocht): <b>{extraPurchased}</b>.
              </>
            )}
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="text-[13px] opacity-80">
              Extra seats beschikbaar om te kopen: <b>{extraLeftToBuy}</b> (à €{EXTRA_PRICE}/seat)
            </div>
            <button
              className="el-btn"
              onClick={buyOneExtra}
              disabled={extraLeftToBuy <= 0}
              title={extraLeftToBuy <= 0 ? "Max extra seats bereikt" : "Koop 1 extra seat"}
            >
              Koop 1 extra seat (€{EXTRA_PRICE})
            </button>
          </div>

          {used >= allowance && (
            <div className="w-full text-[13px] text-red-300/90">
              Je hebt het huidige seat-limiet bereikt. Verwijder een member of koop een extra seat.
            </div>
          )}
        </div>
      </div>

      {/* Leden beheer */}
      <div className="el-card">
        <div className="mb-3 text-[15px]">
          <b>Seats beheren</b>
          <span className="ml-2 opacity-70 text-[13px]">
            Je mag momenteel <b>{allowance}</b> seat(s) bezetten ({INCLUDED} inbegrepen + {extraPurchased} extra).
          </span>
        </div>

        <div className="flex gap-2">
          <input
            className="flex-1 rounded-[10px] border border-[color:var(--hair)] bg-[color:var(--pane2)] px-3 py-2 text-sm"
            placeholder="member@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addMember()}
          />
          <button className="el-btn" onClick={addMember} disabled={used >= allowance}>
            Add
          </button>
        </div>

        <div className="mt-4 grid gap-2">
          {members.length === 0 ? (
            <div className="opacity-70 text-sm">No members yet.</div>
          ) : (
            members.map((m, idx) => {
              const isIncluded = idx < INCLUDED;
              return (
                <div
                  key={m.email}
                  className="flex items-center justify-between rounded-[10px] border border-[color:var(--hair)] px-3 py-2"
                >
                  <div className="text-sm">{m.email}</div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs opacity-60">
                      seat: {isIncluded ? "included" : `extra (€${EXTRA_PRICE})`}
                    </span>
                    <button className="el-btn" onClick={() => removeMember(m.email)}>
                      Remove
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-4 text-[13px] opacity-70">
          Demo: aankopen & leden worden lokaal opgeslagen (<code>localStorage</code>). In productie koppel je
          dit aan je betaal- en backendlogica (checkout, factuur, invites, rollen).
        </div>
      </div>
    </ElysiumLayout>
  );
}