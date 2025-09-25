"use client";
import React, { useEffect, useState } from "react";
import ElysiumLayout from "../../components/elysium/Layout";

type Member = { email: string };

const KEY_MEMBERS = "team.seats.members";
const KEY_EXTRA   = "team.seats.extraPurchased";  // 0..3
const INCLUDED    = 3;     // included with Diamond
const MAX_EXTRA   = 3;     // purchasable
const EXTRA_PRICE = 5;     // € per extra seat
const MAX_TOTAL   = INCLUDED + MAX_EXTRA; // 6
const hasDiamond = () =>
  (typeof window !== "undefined") &&
  (localStorage.getItem("wallet.plan") || "").toLowerCase() === "diamond";

export default function TeamPage() {
  const [ok, setOk] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [email, setEmail] = useState("");
  const [extraPurchased, setExtraPurchased] = useState(0);

  const allowance = INCLUDED + extraPurchased;
  const used = members.length;
  const freeIncludedLeft = Math.max(0, INCLUDED - used);
  const extraUsed = Math.max(0, used - INCLUDED);
  const extraLeftToBuy = Math.max(0, MAX_EXTRA - extraPurchased);

  useEffect(() => {
    setOk(hasDiamond());
    try {
      const m = localStorage.getItem(KEY_MEMBERS);
      if (m) {
        const arr = JSON.parse(m);
        if (Array.isArray(arr)) setMembers(arr.filter(Boolean));
      }
      const x = Number(localStorage.getItem(KEY_EXTRA) ?? 0);
      setExtraPurchased(Number.isFinite(x) ? Math.max(0, Math.min(MAX_EXTRA, x)) : 0);
    } catch {}
  }, []);

  function persistMembers(next: Member[]) {
    setMembers(next);
    localStorage.setItem(KEY_MEMBERS, JSON.stringify(next));
  }

  function addMember() {
    const e = email.trim().toLowerCase();
    if (!e || !e.includes("@")) return alert("Enter a valid email address.");
    if (members.find((m) => m.email === e)) return alert("This member already exists.");
    if (used >= allowance) return alert("Seat limit reached. Buy an extra seat or remove someone.");
    persistMembers([...members, { email: e }]);
    setEmail("");
  }

  function removeMember(e: string) {
    persistMembers(members.filter((m) => m.email !== e));
  }

  function buyOneExtra() {
    if (extraPurchased >= MAX_EXTRA) return;
    if (!confirm(`Confirm purchase?\n\n1 extra seat costs €${EXTRA_PRICE}.\nMaximum ${MAX_EXTRA} extra seats.`)) return;
    const next = extraPurchased + 1;
    setExtraPurchased(next);
    localStorage.setItem(KEY_EXTRA, String(next));
    alert(`Purchased 1 extra seat for €${EXTRA_PRICE}. Allowed seats: ${INCLUDED}+${next} = ${INCLUDED + next}.`);
  }

  if (!ok) {
    return (
      <ElysiumLayout title="Team (Diamond)" subtitle="Available with the Diamond plan only.">
        <div className="el-card">
          <div className="text-[15px] text-[color:var(--muted)]">
            This page is locked. Upgrade to <b>Diamond</b> to use Team Seats.
          </div>
          <div className="mt-3 flex gap-8 text-[13px] text-[color:var(--muted)]">
            <div>✓ 3 seats included</div>
            <div>✓ Expandable up to 6</div>
            <div>✓ Invites & roles (future)</div>
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
      subtitle={`Diamond active — ${INCLUDED} seats included. Up to ${MAX_TOTAL} total.`}
    >
      <div className="el-card">
        <div className="flex flex-wrap items-center gap-10">
          <div className="text-[15px]">
            <b>Usage:</b> {used} / {allowance}
            <span className="ml-2 opacity-70 text-[13px]">
              ({INCLUDED} included, {extraPurchased} extra purchased)
            </span>
          </div>

          <div className="text-[13px] opacity-80">
            {freeIncludedLeft > 0
              ? <>You still have <b>{freeIncludedLeft}</b> included seat(s) left.</>
              : <>Extra in use: <b>{extraUsed}</b>. Purchased allowance: <b>{extraPurchased}</b>.</>}
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="text-[13px] opacity-80">
              Extra seats available to buy: <b>{extraLeftToBuy}</b> (at €{EXTRA_PRICE}/seat)
            </div>
            <button
              className="el-btn"
              onClick={buyOneExtra}
              disabled={extraLeftToBuy <= 0}
              title={extraLeftToBuy <= 0 ? "Max extra seats reached" : "Buy 1 extra seat"}
            >
              Buy 1 extra seat (€{EXTRA_PRICE})
            </button>
          </div>

          {used >= allowance && (
            <div className="w-full text-[13px] text-red-300/90">
              You reached your seat limit. Remove a member or buy an extra seat.
            </div>
          )}
        </div>
      </div>

      <div className="el-card">
        <div className="mb-3 text-[15px]">
          <b>Manage seats</b>
          <span className="ml-2 opacity-70 text-[13px]">
            You can currently occupy <b>{allowance}</b> seat(s) ({INCLUDED} included + {extraPurchased} extra).
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
            members.map((m, idx) => (
              <div key={m.email} className="flex items-center justify-between rounded-[10px] border border-[color:var(--hair)] px-3 py-2">
                <div className="text-sm">{m.email}</div>
                <div className="flex items-center gap-3">
                  <span className="text-xs opacity-60">
                    seat: {idx < INCLUDED ? "included" : `extra (€${EXTRA_PRICE})`}
                  </span>
                  <button className="el-btn" onClick={() => removeMember(m.email)}>Remove</button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 text-[13px] opacity-70">
          Demo: purchases & members are stored in <code>localStorage</code>. In production, connect to
          payments + backend (checkout, invoice, invites, roles).
        </div>
      </div>
    </ElysiumLayout>
  );
}
