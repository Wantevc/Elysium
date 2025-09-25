"use client";
import React, { useEffect, useMemo, useState } from "react";
import PageShell from "../components/PageShell";
import { Card, SectionTitle, TOKENS, GlowButton, GoldCTA } from "../components/ui";

/* wallet helpers */
function walletRead(){try{const s=parseInt(localStorage.getItem("wallet.subCredits")||"0")||0;const t=parseInt(localStorage.getItem("wallet.topupCredits")||"0")||0;return{total:s+t,plan:localStorage.getItem("wallet.plan")||""}}catch{return{total:0,plan:""}}}
function walletWrite(next:{plan:string|null;sub:number;top:number}){const total=Math.max(0,(next.sub||0)+(next.top||0));try{localStorage.setItem("wallet.plan",next.plan??"");localStorage.setItem("wallet.subCredits",String(Math.max(0,next.sub)));localStorage.setItem("wallet.topupCredits",String(Math.max(0,next.top)));localStorage.setItem("wallet.total",String(total));window.dispatchEvent(new Event("wallet:update"));}catch{}}
function walletDeduct(amount:number){const w=walletRead();let sub=parseInt(localStorage.getItem("wallet.subCredits")||"0")||0;let top=parseInt(localStorage.getItem("wallet.topupCredits")||"0")||0;let rest=amount;const useTop=Math.min(top,rest);top-=useTop;rest-=useTop;if(rest>0){const useSub=Math.min(sub,rest);sub-=useSub;rest-=useSub;}walletWrite({plan:w.plan,sub,top});return{deducted:amount-rest,remaining:walletRead().total}}

type Trend = { name: string; score: number; sampleHook: string; hashtags: string[] };
const COST = 6;

function fallbackTrends(topic:string, geo:string): Trend[] {
  const base = topic || "your niche";
  return [
    { name: "Micro-stories", score: 89, sampleHook: `“I tried ${base} for 7 days — here’s the result.”`, hashtags: ["#microstory","#authentic","#real"] },
    { name: "Before/After carousel", score: 83, sampleHook: `Swipe → Step-by-step ${base} transformation`, hashtags: ["#beforeafter","#howto","#results"] },
    { name: "Local twist", score: 78, sampleHook: `${geo ? geo+" • " : ""}${base}: 3 spots you must know`, hashtags: ["#local","#insider","#hidden"] },
    { name: "POV short", score: 74, sampleHook: `POV: You finally find a ${base} that actually works`, hashtags: ["#POV","#relatable","#firstperson"] },
  ];
}

export default function TrendRadarPage(){
  const [topic,setTopic]=useState("");
  const [geo,setGeo]=useState("");
  const [timeframe,setTimeframe]=useState("7 days");
  const [credits,setCredits]=useState(0);
  const [busy,setBusy]=useState(false);
  const [err,setErr]=useState<string|null>(null);
  const [trends,setTrends]=useState<Trend[]>([]);

  useEffect(()=>{const sync=()=>setCredits(walletRead().total);sync();window.addEventListener("wallet:update",sync);window.addEventListener("storage",sync);return()=>{window.removeEventListener("wallet:update",sync);window.removeEventListener("storage",sync);}},[]);
  const canScan = useMemo(()=>topic.trim().length>0 && credits>=COST && !busy,[topic,credits,busy]);

  async function scan(){
    setErr(null);
    if(!canScan){ if(credits<COST)setErr(`Not enough credits (${credits}/${COST}).`); return; }
    setBusy(true);
    try{
      // TODO: replace with real /api/ai/trends
      await new Promise(r=>setTimeout(r,900)); // kleine delay voor 'thinking' effect
      const out = fallbackTrends(topic, geo)
        .map(t => ({...t, score: Math.min(99, Math.max(60, Math.round(t.score + (Math.random()*10-5))))}))
        .sort((a,b)=>b.score-a.score);
      setTrends(out);
      walletDeduct(COST);
      setCredits(walletRead().total);
    }catch(e:any){
      setErr(String(e?.message||e));
    }finally{ setBusy(false); }
  }

  function clearAll(){
    setTopic(""); setGeo(""); setTimeframe("7 days"); setErr(null); setTrends([]);
  }

  return (
    <PageShell title="Trend Radar" desc={`Find timely content angles & hooks for your niche. ${COST} credits per scan.`}>
      <Card>
        <div className="flex items-center justify-between gap-2">
          <SectionTitle title="Inputs" desc="What marketing strategy is operating the best?" />
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <button type="button" className="btn" onClick={clearAll}>Clear</button>
          </div>
        </div>

        <div className="grid-3" style={{gap:16}}>
          <div>
            <label className="label">Topic / Niche</label>
            <input className="input" value={topic} onChange={e=>setTopic(e.target.value)} placeholder="e.g., Yoga mats" />
          </div>
          <div>
            <label className="label">Region (optional)</label>
            <input className="input" value={geo} onChange={e=>setGeo(e.target.value)} placeholder="e.g., Belgium" />
          </div>
          <div>
            <label className="label">Timeframe</label>
            <select className="el-select" value={timeframe} onChange={e=>setTimeframe(e.target.value)}>
              <option>7 days</option><option>14 days</option><option>30 days</option>
            </select>
          </div>
        </div>

        <div style={{marginTop:16,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          <GoldCTA onClick={scan} disabled={!canScan}>{busy?"Scanning…":`Scan (${COST} cr.)`}</GoldCTA>
          <div className={TOKENS.SUBTLE} style={{fontSize:12}}>Your credits: <strong style={{color:credits<COST?"#fca5a5":"#86efac"}}>{credits}</strong></div>
          {busy && (
            <div className="card" style={{padding:"6px 10px", fontSize:12, borderColor:"rgba(217,191,122,.35)", background:"rgba(217,191,122,.06)"}}>
              <span className="thinking-dot"></span>
              <span className="thinking-dot"></span>
              <span className="thinking-dot"></span>
              <span style={{marginLeft:8,opacity:.85}}>AI is thinking…</span>
            </div>
          )}
        </div>

        {err && <div className="card" style={{marginTop:12,padding:12,borderColor:"rgba(255,99,99,.4)",background:"rgba(255,99,99,.08)",color:"#fecaca"}}>{err}</div>}
      </Card>

      {trends.length>0 && (
        <Card>
          <SectionTitle title="Results" desc="Top trends by score" />
          <div style={{marginTop:10, display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:12}}>
            {trends.map((t,idx)=>(
              <div key={idx} className="card" style={{padding:12}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{fontWeight:700}}>{t.name}</div>
                  <div style={{fontSize:12,opacity:.8}}>Score <strong>{t.score}</strong></div>
                </div>
                <div className={TOKENS.SUBTLE} style={{fontSize:12,marginTop:6}}>Hook</div>
                <div style={{whiteSpace:"pre-wrap",fontSize:14}}>{t.sampleHook}</div>
                <div className={TOKENS.SUBTLE} style={{fontSize:12,marginTop:8}}>Hashtags</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:4}}>
                  {t.hashtags.map((h,i)=>(<span key={i} className="btn" style={{borderRadius:9999,padding:"2px 8px",fontSize:12}}>{h}</span>))}
                </div>
              </div>
            ))}
          </div>
          <div className={TOKENS.SUBTLE} style={{fontSize:12,marginTop:10}}>Turn trends into real posts with <a className="el-link" href="/campaign-builder" style={{padding:0,border:"none"}}>Campaign Builder</a>.</div>
        </Card>
      )}

      {/* tiny CSS for dots */}
      <style jsx>{`
        .thinking-dot{
          display:inline-block;width:6px;height:6px;border-radius:9999px;
          background: #d9bf7a; opacity:.75; margin-right:4px;
          animation: thk 1.2s infinite ease-in-out;
        }
        .thinking-dot:nth-child(1){ animation-delay: 0s; }
        .thinking-dot:nth-child(2){ animation-delay: .15s; }
        .thinking-dot:nth-child(3){ animation-delay: .3s; }
        @keyframes thk { 0%,80%,100%{transform:scale(0.6); opacity:.35} 40%{transform:scale(1); opacity:.9} }
      `}</style>
    </PageShell>
  );
}