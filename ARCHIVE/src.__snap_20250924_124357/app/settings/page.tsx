"use client";
import React, { useEffect, useState } from "react";
import PageShell from "../../components/PageShell";
import { walletRead, walletSetPlan, walletAddTopup } from "../../lib/wallet";

type PlanDef = { id: "basic"|"premium"|"diamond"; name: string; price: number; credits: number; perks: string[]; badge?: string };
type PackDef = { name: string; credits: number; price: number };

const PLANS: PlanDef[] = [
  { id: "basic",   name: "Basic",   price: 9,  credits: 100, perks: ["AI tools toegang", "Standaard opslag"] },
  { id: "premium", name: "Premium", price: 24, credits: 300, perks: ["Content Library+", "Geavanceerde suggesties"] }, // <- badge weg
  { id: "diamond", name: "Diamond", price: 30, credits: 450, perks: ["3 Team seats", "AI Sales/Marketing Coach", "Alle Premium features"], badge: "Best value" },
];
const YEAR_DISCOUNT = 2; // maanden gratis
const PACKS: PackDef[] = [
  { name: "Pack Klein",  credits: 50,  price: 7 },
  { name: "Pack Medium", credits: 120, price: 15 },
  { name: "Pack Groot",  credits: 300, price: 32 },
  { name: "Pack XL",     credits: 600, price: 60 },
];

export default function SettingsPage() {
  const [w, setW] = useState(walletRead());
  useEffect(() => {
    const sync = () => setW(walletRead());
    sync();
    window.addEventListener("wallet:update", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("wallet:update", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  function chooseMonthly(p: PlanDef) {
    walletSetPlan(p.id, p.credits);
    alert(`${p.name} geactiveerd (${p.credits} credits).`);
  }
  function chooseYearly(p: PlanDef) {
    const yearlyPrice = p.price * (12 - YEAR_DISCOUNT);
    walletSetPlan(p.id, p.credits);
    alert(`${p.name} (jaarplan) geactiveerd: €${yearlyPrice} / jaar · ${p.credits}/mnd.`);
  }
  function buyPack(pack: PackDef) {
    walletAddTopup(pack.credits);
    alert(`${pack.name}: +${pack.credits} credits toegevoegd.`);
  }

  return (
    <PageShell title="Settings" desc="Beheer je abonnement en koop extra credits.">
      <div className="el-card">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12}}>
          <div>
            <div className="label" style={{marginBottom:6}}>Huidig plan</div>
            <div style={{fontWeight:800, fontSize:18, letterSpacing:.2}}>{w.plan || "—"}</div>
            <div style={{fontSize:12, opacity:.7, marginTop:4}}>Maandcredits (sub): {w.sub} · Top-ups: {w.top}</div>
          </div>
          <div>
            <div className="label" style={{marginBottom:6}}>Totaal credits</div>
            <div style={{fontSize:26, fontWeight:900}}>{w.total}</div>
          </div>
        </div>
      </div>

      <div className="el-card" style={{marginTop:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div className="label">Abonnementen</div>
            <div style={{fontSize:12, opacity:.75}}>Kies maandelijks of jaarplan (2 maanden gratis).</div>
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:14, marginTop:12}}>
          {PLANS.map(p => (
            <div key={p.id} className="el-card" style={{
              borderColor: p.id==="diamond" ? "rgba(217,191,122,.45)" : "rgba(255,255,255,.08)",
              boxShadow: p.id==="diamond" ? "0 18px 48px rgba(217,191,122,.18)" : undefined
            }}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <div style={{fontWeight:800, fontSize:18}}>{p.name}</div>
                {p.badge && (
                  <span style={{
                    fontSize:12, padding:"3px 8px", borderRadius:999,
                    border:"1px solid rgba(255,255,255,.14)",
                    background: p.id==="diamond" ? "rgba(217,191,122,.12)" : "rgba(255,255,255,.06)"
                  }}>{p.badge}</span>
                )}
              </div>

              <div style={{fontSize:28, fontWeight:900}}>€{p.price}<span style={{fontSize:13,opacity:.7}}> / maand</span></div>
              <div style={{fontSize:13, opacity:.8, marginTop:4}}>{p.credits} credits / maand</div>

              <ul style={{margin:"10px 0 0 16px", padding:0, fontSize:13, opacity:.9}}>
                {p.perks.map((perk,i)=> <li key={i} style={{marginBottom:4}}>• {perk}</li>)}
              </ul>

              <div style={{display:"flex", gap:8, marginTop:12}}>
                <button className="el-btn" onClick={()=>chooseMonthly(p)}>Kies maandelijks</button>
                <button className="el-btn" onClick={()=>chooseYearly(p)}>Jaarplan (2 mnd gratis)</button>
              </div>

              {w.plan === p.id && <div style={{fontSize:12, opacity:.7, marginTop:8}}>Huidig actief</div>}
            </div>
          ))}
        </div>
      </div>

      <div className="el-card" style={{marginTop:16}}>
        <div className="label">Credit packs (eenmalig)</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:12, marginTop:12}}>
          {PACKS.map(p => (
            <div key={p.name} className="el-card" style={{padding:12}}>
              <div style={{fontWeight:800}}>{p.name}</div>
              <div style={{fontSize:13, opacity:.8, marginTop:4}}>{p.credits} credits</div>
              <div style={{fontSize:22, fontWeight:900, marginTop:6}}>€{p.price}</div>
              <button className="el-btn" style={{marginTop:8}} onClick={()=>buyPack(p)}>Koop pack</button>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
