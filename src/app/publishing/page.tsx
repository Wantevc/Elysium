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
          <SectionTitle title="Coming Soon" desc="Plan & publish coming soon." />
          <div className="subtle" style={{ fontSize: 14 }}>
            Tip: toggle Developer Mode with <code>Ctrl+Shift+D</code> or add <code>?dev=1</code> to the URL.
          </div>
        </Card>
      )}
      {dev && (
        <Card>
          <SectionTitle title="Developer Mode" desc="Visible only with ?dev=1 or Ctrl+Shift+D." />
          <div className={TOKENS.SUBTLE} style={{ fontSize: 14, marginBottom: 12 }}>
            Paste your WIP UIs here.
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 14 }}>
              TODO: Connect (Page ID/Token) + Planner composer & queue…
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <GlowButton onClick={() => setDev(false)}>Hide Developer Mode</GlowButton>
          </div>
        </Card>
      )}
    </PageShell>
  );
}
