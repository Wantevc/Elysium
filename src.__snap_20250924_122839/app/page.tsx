"use client";
import React from "react";
import PageShell from "../components/PageShell"; // let op: '..' naar src/components

export default function DashboardPage() {
  return (
    <PageShell title="Dashboard" desc="Welkom! Kies een module om te starten.">
      {/* Hint / callout bovenaan */}
      <div
        className="el-card"
       style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}
>
  <div>
    <div className="label">Welcome</div>
    <div style={{ fontSize: 13, opacity: 0.8 }}>
      Your AI assistant for smarter, faster social media marketing.
    </div>
    <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>
      Low on credits? Buy more in{" "}
      <a href="/settings" className="el-link" style={{ padding: 0, border: "none" }}>
        Settings
      </a>
    </div>
  </div>
  <a href="/settings" className="el-btn">Buy credits</a>
</div>

      {/* Tegels */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 16,
        }}
      >
        <a href="/campaign-builder" style={{ textDecoration: "none", color: "inherit" }} className="el-card">
          <h3 style={{ margin: 0, fontWeight: 800, fontSize: 18 }}>Campaign Builder</h3>
          <p className="subtle" style={{ marginTop: 6 }}>2 posts/week · 4 weken · platform-specifiek.</p>
          <div className="subtle" style={{ marginTop: 8 }}>Openen →</div>
        </a>

        <a href="/brand-voice" style={{ textDecoration: "none", color: "inherit" }} className="el-card">
          <h3 style={{ margin: 0, fontWeight: 800, fontSize: 18 }}>Brand Voice</h3>
          <p className="subtle" style={{ marginTop: 6 }}>Templates, captions, slogans & hashtags op maat.</p>
          <div className="subtle" style={{ marginTop: 8 }}>Openen →</div>
        </a>

        <a href="/offer-visual" style={{ textDecoration: "none", color: "inherit" }} className="el-card">
          <h3 style={{ margin: 0, fontWeight: 800, fontSize: 18 }}>Offer + Visual</h3>
          <p className="subtle" style={{ marginTop: 6 }}>AI-beeld + tekst op beeld + logo.</p>
          <div className="subtle" style={{ marginTop: 8 }}>Openen →</div>
        </a>

        <a href="/publishing" style={{ textDecoration: "none", color: "inherit" }} className="el-card">
          <h3 style={{ margin: 0, fontWeight: 800, fontSize: 18 }}>Publishing</h3>
          <p className="subtle" style={{ marginTop: 6 }}>Connect + Planner (coming soon).</p>
          <div className="subtle" style={{ marginTop: 8 }}>Openen →</div>
        </a>

        <a href="/settings" style={{ textDecoration: "none", color: "inherit" }} className="el-card">
          <h3 style={{ margin: 0, fontWeight: 800, fontSize: 18 }}>Settings</h3>
          <p className="subtle" style={{ marginTop: 6 }}>Abonnement & credit packs beheren.</p>
          <div className="subtle" style={{ marginTop: 8 }}>Openen →</div>
        </a>
      </div>
    </PageShell>
  );
}