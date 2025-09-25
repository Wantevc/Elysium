"use client";
import React, { useEffect, useState } from "react";
import PageShell from "../components/PageShell";
import { Card, SectionTitle, TOKENS, GlowButton } from "../components/ui";

export default function PublishingPage() {
  const [dev, setDev] = useState(false);
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("dev") === "1") setDev(true);
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "d") { setDev(v => !v); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <PageShell title="Publishing" desc="Facebook & Instagram planner / connect (Coming Soon)">
      {!dev && (
        <Card>
          <SectionTitle title="Coming Soon" desc="Binnenkort plannen & publiceren." />
          <div className={`subtle`} style={{fontSize:14}}>
            Tip: toon Developer Mode met <code>Ctrl+Shift+D</code> of met <code>?dev=1</code> in de URL.
          </div>
        </Card>
      )}
      {dev && (
        <Card>
          <SectionTitle title="Developer Mode" desc="Alleen zichtbaar met ?dev=1 of Ctrl+Shift+D." />
          <div className={TOKENS.SUBTLE} style={{fontSize:14, marginBottom:12}}>Plak hier je WIP UI’s.</div>
          <div className="card" style={{padding:16}}>
            <div style={{fontSize:14}}>TODO: Connect (Page ID/Token) + Planner composer & queue…</div>
          </div>
          <div style={{marginTop:12}}>
            <GlowButton onClick={() => setDev(false)}>Verberg Developer Mode</GlowButton>
          </div>
        </Card>
      )}
    </PageShell>
  );
}