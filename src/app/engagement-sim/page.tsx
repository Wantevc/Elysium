"use client";
import React, { useEffect, useMemo, useState } from "react";
import PageShell from "../components/PageShell";
import { Card, SectionTitle, TOKENS, GlowButton, GoldCTA } from "../components/ui";

/* ========== Wallet helpers ========== */
function walletRead(){try{const s=parseInt(localStorage.getItem("wallet.subCredits")||"0")||0;const t=parseInt(localStorage.getItem("wallet.topupCredits")||"0")||0;return{total:s+t,plan:localStorage.getItem("wallet.plan")||""}}catch{return{total:0,plan:""}}}
function walletWrite(next:{plan:string|null;sub:number;top:number}){const total=Math.max(0,(next.sub||0)+(next.top||0));try{localStorage.setItem("wallet.plan",next.plan??"");localStorage.setItem("wallet.subCredits",String(Math.max(0,next.sub)));localStorage.setItem("wallet.topupCredits",String(Math.max(0,next.top)));localStorage.setItem("wallet.total",String(total));window.dispatchEvent(new Event("wallet:update"));}catch{}}
function walletDeduct(amount:number){const w=walletRead();let sub=parseInt(localStorage.getItem("wallet.subCredits")||"0")||0;let top=parseInt(localStorage.getItem("wallet.topupCredits")||"0")||0;let rest=amount;const useTop=Math.min(top,rest);top-=useTop;rest-=useTop;if(rest>0){const useSub=Math.min(sub,rest);sub-=useSub;rest-=useSub;}walletWrite({plan:w.plan,sub,top});return{deducted:amount-rest,remaining:walletRead().total}}

/* ========== Types/consts ========== */
type SimBucket = { label: string; sampleComments: string[]; suggestedReply: string };
const COST = 4;

/* ========== Utils: dynamic simulation ========== */

// very light seeded RNG so same caption -> stable variety
function hash(s: string){ let h=0; for(let i=0;i<s.length;i++){ h=(h<<5)-h + s.charCodeAt(i); h|=0; } return Math.abs(h); }
function rng(seed:number){ let x = seed % 2147483647; if (x<=0) x+=2147483646; return () => (x = x*16807 % 2147483647) / 2147483647; }

function pick<T>(arr:T[], r:()=>number){ return arr[Math.floor(r()*arr.length)] }
function cap(s:string, n:number){ return s.length>n ? s.slice(0,n-1)+"…" : s }

function analyze(text:string){
  const t = text.trim();
  const lower = t.toLowerCase();
  const words = t.split(/\s+/).filter(Boolean);
  const emojis = (t.match(/[\u{1F300}-\u{1FAFF}]/gu) || []).length;
  const hashtags = (t.match(/#[\w-]+/g) || []);
  const mentions = (t.match(/@[\w.-]+/g) || []);
  const qMarks = (t.match(/\?/g) || []).length;
  const excls = (t.match(/!/g) || []).length;
  const hasPrice = /(\$|€)\s?\d+/.test(t);
  const hasDiscount = /(sale|korting|discount|deal|promo|%)/i.test(t);
  const hasHow = /(how|hoe|tips|guide|handleiding)/i.test(lower);
  const hasCTA = /(shop now|buy|koop|bestel|link in bio|meld je aan|subscribe|volg|download)/i.test(lower);
  const negHints = /(too expensive|scam|fake|werkt niet|doesn't work|not worth|te duur)/i.test(lower);
  const posHints = /(love|amazing|geweldig|super|blij|top|beste)/i.test(lower);
  const len = t.length;
  const sentiment = posHints ? "positive" : negHints ? "negative" : (excls > 1 ? "excited" : "neutral");
  return { t, lower, words, emojis, hashtags, mentions, qMarks, excls, hasPrice, hasDiscount, hasHow, hasCTA, sentiment, len };
}

function buildBuckets(text:string): SimBucket[] {
  const a = analyze(text);
  const seed = hash(text || "seed");
  const r = rng(seed);

  // Base archetypes pool; we’ll include conditionally
  const buckets: SimBucket[] = [];

  // 1) Fans / positive
  if (a.sentiment !== "negative" || r() > 0.2) {
    const hype = ["Love this!", "This hits different 🔥", "Exactly what I needed", "Instant save ✅"];
    const ask = ["More like this?", "Do you have a full guide?", "Any beginner tips?"];
    buckets.push({
      label: "Positive fans",
      sampleComments: [
        pick(hype, r),
        (a.emojis>0 ? "Vibes are on point " : "") + (a.hashtags.length? pick(a.hashtags,r)+" " : "") + pick(hype, r),
        pick(ask, r),
      ],
      suggestedReply:
        "Thanks for the love! 🙌 Anything specific you want more of? I can share a quick follow-up or deeper tips."
    });
  }

  // 2) Skeptics
  if (a.hasPrice || a.hasDiscount || r() > 0.4) {
    const skeptical = [
      "Does this really work?",
      "Sounds good, but what's the catch?",
      a.hasPrice ? "Is the price justified?" : "Can you show results?",
    ];
    buckets.push({
      label: "Skeptical",
      sampleComments: skeptical.slice(0, 2 + Math.floor(r()*2)),
      suggestedReply:
        (a.hasHow ? "Great Q — " : "") +
        "Fair question! Here’s how it works in 3 steps and a quick proof point. Anything specific you want to achieve?"
    });
  }

  // 3) Price-sensitive
  if (a.hasPrice || a.hasDiscount) {
    const priceLines = [
      "Any discount for first-time buyers?",
      a.hasDiscount ? "How long does the promo last?" : "Do you have bundle pricing?",
      "Is there a budget option?",
    ];
    buckets.push({
      label: "Price-sensitive",
      sampleComments: priceLines.slice(0, 2 + Math.floor(r()*1)),
      suggestedReply:
        "We do run promos sometimes. What’s your budget or use case? I’ll point you to the best option (or an alternative)."
    });
  }

  // 4) Learners / “How do I…”
  if (a.hasHow || a.qMarks>0 || a.len<160 || r()>0.5) {
    const q = [
      "How do I start?",
      "Is this okay for beginners?",
      "What’s step 1?",
      "Any common mistakes to avoid?"
    ];
    buckets.push({
      label: "Question askers",
      sampleComments: q.slice(0, 2 + Math.floor(r()*2)),
      suggestedReply:
        "Yes! Start with step 1: … If you share your goal, I’ll tailor the next steps so you can apply it today."
    });
  }

  // 5) Community / social proof
  if (a.hashtags.length>0 || a.mentions.length>0 || r()>0.6) {
    const social = [
      `Anyone tried this ${a.hashtags[0] ?? ""}?`,
      a.mentions[0] ? `@${a.mentions[0].replace("@","")} what do you think?` : "Tagging a friend for thoughts",
      "Where can I see examples?"
    ];
    buckets.push({
      label: "Community",
      sampleComments: social.slice(0, 2),
      suggestedReply:
        "Great idea — if you try it, share your result and tag us. I’ll feature some of the best ones next week."
    });
  }

  // small random shuffle
  for (let i=buckets.length-1;i>0;i--){ const j=Math.floor(r()* (i+1)); [buckets[i], buckets[j]]=[buckets[j], buckets[i]]; }

  // cap to 4 buckets
  return buckets.slice(0,4);
}

/* ========== Component ========== */
export default function EngagementSimPage(){
  const [post,setPost]=useState("");
  const [credits,setCredits]=useState(0);
 const [busy, setBusy] = useState(false);
  const [err,setErr]=useState<string|null>(null);
  const [buckets,setBuckets]=useState<SimBucket[]>([]);

  useEffect(()=>{const sync=()=>setCredits(walletRead().total);sync();window.addEventListener("wallet:update",sync);window.addEventListener("storage",sync);return()=>{window.removeEventListener("wallet:update",sync);window.removeEventListener("storage",sync);}},[]);
  const canRun = useMemo(()=>post.trim().length>0 && credits>=COST && !busy,[post,credits,busy]);

  async function run(){
    setErr(null);
    if(!canRun){ if(credits<COST)setErr(`Not enough credits (${credits}/${COST}).`); return; }
    setBusy(true);
    try{
      await new Promise(r=>setTimeout(r,700)); // mini “thinking”
      const out = buildBuckets(post);
      setBuckets(out);
      walletDeduct(COST);
      setCredits(walletRead().total);
    }catch(e:any){ setErr(String(e?.message||e)); }
    finally{ setBusy(false); }
  }

  function clearAll(){
    setPost(""); setErr(null); setBuckets([]);
  }

  return (
    <PageShell title="Engagement Simulator" desc={`Predict likely comments & prepare replies. ${COST} credits per run.`}>
      <Card>
        {/* Header met Clear-knop wat hoger en extra spacing */}
        <div className="flex items-center justify-between gap-2" style={{ marginBottom: 10 }}>
          <SectionTitle title="Your draft post" desc="Paste your caption or idea. We’ll simulate reactions." />
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <button type="button" className="btn" onClick={clearAll}>Clear</button>
          </div>
        </div>

        <textarea
          className="textarea"
          rows={6}
          value={post}
          onChange={e=>setPost(e.target.value)}
          placeholder="Paste your caption here… (tip: include price, discount, questions, hashtags, or a CTA to see different reactions)"
        />

        <div style={{marginTop:10,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          <GoldCTA onClick={run} disabled={!canRun}>{busy?"Simulating…":`Simulate (${COST} cr.)`}</GoldCTA>
          <div className={TOKENS.SUBTLE} style={{fontSize:12}}>Your credits: <strong style={{color:credits<COST?"#fca5a5":"#86efac"}}>{credits}</strong></div>
        </div>

        {err && <div className="card" style={{marginTop:12,padding:12,borderColor:"rgba(255,99,99,.4)",background:"rgba(255,99,99,.08)",color:"#fecaca"}}>{err}</div>}
      </Card>

      {buckets.length>0 && (
        <Card>
          <SectionTitle title="Predicted comments & suggested replies" desc="Copy-paste or tweak your tone." />
          <div className="grid-2" style={{gap:12, marginTop:8}}>
            {buckets.map((b,idx)=>(
              <div key={idx} className="card" style={{padding:12}}>
                <div style={{fontWeight:700}}>{b.label}</div>
                <div className={TOKENS.SUBTLE} style={{fontSize:12,marginTop:6}}>Sample comments</div>
                <ul style={{margin:"6px 0 0 18px"}}>
                  {b.sampleComments.map((c,i)=>(<li key={i} style={{marginTop:4}}>{c}</li>))}
                </ul>
                <div className={TOKENS.SUBTLE} style={{fontSize:12,marginTop:10}}>Suggested reply</div>
                <div className="card" style={{padding:10, fontSize:14, whiteSpace:"pre-wrap"}}>{b.suggestedReply}</div>
              </div>
            ))}
          </div>
          <div className={TOKENS.SUBTLE} style={{fontSize:12,marginTop:10}}>
            Turn this into a full campaign in <a className="el-link" href="/campaign-builder" style={{padding:0,border:"none"}}>Campaign Builder</a>.
          </div>
        </Card>
      )}
    </PageShell>
  );
}