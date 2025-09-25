"use client";
import React, { useEffect, useState } from "react";
import PageShell from "../../components/PageShell";
import { walletSetPlan, walletRead } from "../../lib/wallet";
import { useRouter } from "next/navigation";

const CHOICES = [
  { id:"basic",   name:"Basic",   price:9,  credits:100 },
  { id:"premium", name:"Premium", price:24, credits:300 },
  { id:"diamond", name:"Diamond", price:30, credits:450 },
];

export default function OnboardingPage() {
  const [name, setName] = useState("");
  const [plan, setPlan] = useState("basic");
  const router = useRouter();

  useEffect(() => {
    const w = walletRead();
    if (w.plan) router.replace("/");
  }, [router]);

  function start() {
    if (!name.trim()) { alert("Vul je naam/bedrijf in."); return; }
    localStorage.setItem("user.name", name.trim());
    const chosen = CHOICES.find(c => c.id === plan)!;
    walletSetPlan(chosen.id, chosen.credits);
    alert(`Welkom ${name}! ${chosen.name} geactiveerd.`);
    router.replace("/");
  }

  return (
    <PageShell title="Welcome" desc="Kies je plan om te starten.">
      <div className="el-card">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr", gap:16}}>
          <div>
            <label className="label">Naam of bedrijfsnaam</label>
            <input className="input" value={name} onChange={(e)=>setName(e.target.value)} placeholder="bv. Golden Media BV" />
          </div>
          <div>
            <label className="label">Plan</label>
            <select className="el-select" value={plan} onChange={(e)=>setPlan(e.target.value)}>
              {CHOICES.map(c => <option key={c.id} value={c.id}>{c.name} — €{c.price}/m — {c.credits} cr.</option>)}
            </select>
          </div>
        </div>
        <div style={{marginTop:12}}>
          <button className="el-btn" onClick={start}>Start</button>
        </div>
        <div style={{fontSize:12, opacity:.7, marginTop:10}}>
          * Demo-flow zonder echte betaling. In Settings kun je upgraden/downgraden of packs .
        </div>
      </div>
    </PageShell>
  );
}

