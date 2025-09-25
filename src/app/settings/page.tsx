"use client";
import React, { useEffect, useState } from "react";
import PageShell from "../../components/PageShell";
import { walletRead, walletSetPlan, walletAddTopup } from "../../lib/wallet";

type PlanDef = {
  id: "basic" | "premium" | "diamond";
  name: string;
  price: number;
  credits: number;
  perks: string[];
  badge?: string;
};
type PackDef = { name: string; credits: number; price: number };

const PLANS: PlanDef[] = [
  { id: "basic",   name: "Basic",   price: 9,  credits: 100, perks: ["Access to AI tools", "Standard storage"] },
  { id: "premium", name: "Premium", price: 24, credits: 300, perks: ["Content Library+", "Advanced suggestions"] },
  { id: "diamond", name: "Diamond", price: 30, credits: 450, perks: ["3 Team seats", "AI Sales/Marketing Coach", "All Premium features"], badge: "Best value" },
];
const YEAR_DISCOUNT = 2; // months free
const PACKS: PackDef[] = [
  { name: "Pack Small",  credits: 50,  price: 7 },
  { name: "Pack Medium", credits: 120, price: 15 },
  { name: "Pack Large",  credits: 300, price: 32 },
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
    alert(`${p.name} activated (${p.credits} credits).`);
  }
  function chooseYearly(p: PlanDef) {
    const yearlyPrice = p.price * (12 - YEAR_DISCOUNT);
    walletSetPlan(p.id, p.credits);
    alert(`${p.name} (yearly plan) activated: €${yearlyPrice} / year · ${p.credits}/mo.`);
  }
  function buyPack(pack: PackDef) {
    walletAddTopup(pack.credits);
    alert(`${pack.name}: +${pack.credits} credits added.`);
  }

  return (
    <PageShell title="Settings" desc="Manage your subscription and buy extra credits.">
      <div className="el-card">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12}}>
          <div>
            <div className="label" style={{marginBottom:6}}>Current plan</div>
            <div style={{fontWeight:800, fontSize:18, letterSpacing:.2}}>{w.plan || "—"}</div>
            <div style={{fontSize:12, opacity:.7, marginTop:4}}>Monthly credits: {w.sub} · Top-ups: {w.top}</div>
          </div>
          <div>
            <div className="label" style={{marginBottom:6}}>Total credits</div>
            <div style={{fontSize:26, fontWeight:900}}>{w.total}</div>
          </div>
        </div>
      </div>

      <div className="el-card" style={{marginTop:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div className="label">Subscriptions</div>
            <div style={{fontSize:12, opacity:.75}}>Choose monthly or yearly plan (2 months free).</div>
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

              <div style={{fontSize:28, fontWeight:900}}>€{p.price}<span style={{fontSize:13,opacity:.7}}> / month</span></div>
              <div style={{fontSize:13, opacity:.8, marginTop:4}}>{p.credits} credits / month</div>

              <ul style={{margin:"10px 0 0 16px", padding:0, fontSize:13, opacity:.9}}>
                {p.perks.map((perk,i)=> <li key={i} style={{marginBottom:4}}>• {perk}</li>)}
              </ul>

              <div style={{display:"flex", gap:8, marginTop:12}}>
                <button className="el-btn" onClick={()=>chooseMonthly(p)}>Choose monthly</button>
                <button className="el-btn" onClick={()=>chooseYearly(p)}>Yearly plan (2 mo. free)</button>
              </div>

              {w.plan === p.id && <div style={{fontSize:12, opacity:.7, marginTop:8}}>Currently active</div>}
            </div>
          ))}
        </div>
      </div>

      <div className="el-card" style={{marginTop:16}}>
        <div className="label">Credit packs (one-time)</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:12, marginTop:12}}>
          {PACKS.map(p => (
            <div key={p.name} className="el-card" style={{padding:12}}>
              <div style={{fontWeight:800}}>{p.name}</div>
              <div style={{fontSize:13, opacity:.8, marginTop:4}}>{p.credits} credits</div>
              <div style={{fontSize:22, fontWeight:900, marginTop:6}}>€{p.price}</div>
              <button className="el-btn" style={{marginTop:8}} onClick={()=>buyPack(p)}>Buy pack</button>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
