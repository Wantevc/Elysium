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
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "d") {
        setDev(v => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <PageShell title="Publishing" desc="Facebook & Instagram planner / connect (Coming Soon)">
      {!dev && (
        <Card>
          <SectionTitle title="Coming Soon" desc="We maken dit onderdeel productieklaar. Je kan hier binnenkort je social posts plannen & publiceren." />
          <div className={`text-sm ${TOKENS.SUBTLE}`}>
            Tip: als eigenaar kun je de ontwikkelaarsmodus tonen met <code>Ctrl+Shift+D</code> of door <code>?dev=1</code> in de URL te zetten.
          </div>
        </Card>
      )}

      {dev && (
        <Card>
          <SectionTitle title="Developer Mode" desc="Alleen zichtbaar met ?dev=1 of Ctrl+Shift+D." />
          <div className={`text-sm ${TOKENS.SUBTLE} mb-3`}>Plak hier je (work-in-progress) Connect/Planner UI’s.</div>

          {/* ---- JOUW WIP UI HIER ---- */}
          <div className="rounded-xl border border-white/10 p-4">
            <div className="text-sm">TODO: Connect (Page ID/Token) + Planner composer & queue…</div>
          </div>
          {/* -------------------------- */}

          <div className="mt-3">
            <GlowButton onClick={() => setDev(false)}>Verberg Developer Mode</GlowButton>
          </div>
        </Card>
      )}
    </PageShell>
  );
}