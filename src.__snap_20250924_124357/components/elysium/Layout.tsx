"use client";
import React, { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import GoldWaves from "./GoldWaves";
import Logo from "../ui/Logo";

// Diamond-gating (client-side)
const hasDiamond = () =>
  (typeof window !== "undefined") &&
  (localStorage.getItem("wallet.plan") || "").toLowerCase() === "diamond";

export default function ElysiumLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href;
  const [collapsed, setCollapsed] = useState(false);

  // Auto-collapse op small screens
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 900px)");
    const apply = () => setCollapsed(mql.matches);
    apply();
    mql.addEventListener?.("change", apply);
    return () => mql.removeEventListener?.("change", apply);
  }, []);

  return (
    <div className={`elysium ${collapsed ? "el-collapsed" : ""}`}>
      <GoldWaves />

      {/* SIDEBAR */}
      <aside className="el-sidebar">
        {/* Logo-rij (icoon + woordmerk) */}
        <div className="el-logo">
          <Logo size={32} />
          <span className="el-logotext"></span>
        </div>

        {/* Navigatie */}
        <nav className="el-nav">
          <Link href="/" className={`el-link ${isActive("/") ? "el-active" : ""}`}>
            <i className="el-ic">🏛️</i>
            <span>Dashboard</span>
          </Link>
          <Link
            href="/campaign-builder"
            className={`el-link ${isActive("/campaign-builder") ? "el-active" : ""}`}
          >
            <i className="el-ic">📆</i>
            <span>Campaigns</span>
          </Link>
          <Link
            href="/brand-voice"
            className={`el-link ${isActive("/brand-voice") ? "el-active" : ""}`}
          >
            <i className="el-ic">🗣️</i>
            <span>Brand Voice</span>
          </Link>
          <Link
            href="/offer-visual"
            className={`el-link ${isActive("/offer-visual") ? "el-active" : ""}`}
          >
            <i className="el-ic">🖼️</i>
            <span>Offer + Visual</span>
          </Link>
          <Link
            href="/publishing"
            className={`el-link ${isActive("/publishing") ? "el-active" : ""}`}
          >
            <i className="el-ic">📤</i>
            <span>Publishing</span>
          </Link>

         {/* ==== DIAMOND LINKS ==== */}
{hasDiamond() ? (
  <>
    <Link
      href="/team"
      className={`el-link ${isActive("/team") ? "el-active" : ""}`}
    >
      <span className="el-ic" aria-hidden="true">👥</span>
      <span>Team</span>
    </Link>

    <Link
      href="/ai-coach"
      className={`el-link ${isActive("/ai-coach") ? "el-active" : ""}`}
    >
      <span className="el-ic" aria-hidden="true">🧠</span>
      <span>AI Coach</span>
    </Link>
  </>
) : null}
{/* ==== /DIAMOND LINKS ==== */}

          <Link
            href="/settings"
            className={`el-link ${isActive("/settings") ? "el-active" : ""}`}
          >
            <i className="el-ic">⚙️</i>
            <span>Settings</span>
          </Link>
        </nav>

        {/* Collapse button + footer */}
        <div className="el-controls">
          <button className="el-collapse" onClick={() => setCollapsed((v) => !v)}>
            {collapsed ? "»" : "«"}
          </button>
        </div>
        <div className="el-sidefoot">© {new Date().getFullYear()}</div>
      </aside>

      {/* MAIN */}
      <main className="el-main">
        {/* TOPBAR (alleen titel/subtitel) */}
        <div className="el-topbar">
          <div>
            <h1 className="el-title">{title}</h1>
            {subtitle && <div className="el-sub">{subtitle}</div>}
          </div>
          <div className="el-actions" />
        </div>

        {/* CONTENT */}
        <section className="el-content">{children}</section>

        {/* FOOTER */}
        <footer className="el-bottom">Elysium layout</footer>
      </main>

      {/* STYLES */}
      <style jsx global>{`
        .elysium {
          --bg: #090909;
          --pane: #101011;
          --pane2: #0e0e0f;
          --text: #f4f5f7;
          --muted: #9ea6b2;
          --line: rgba(255, 255, 255, 0.07);
          --gold: #d9bf7a;
          --gold-2: #f1dfad;
          --hair: #1b1b1d;
          --hair-2: #202023;
          --radius: 14px;
          --shadow: 0 18px 48px rgba(0, 0, 0, 0.55);

          min-height: 100vh;
          display: flex;
          color: var(--text);
          background: radial-gradient(
              1100px 520px at 12% -10%,
              rgba(217, 191, 122, 0.07),
              transparent 52%
            ),
            linear-gradient(180deg, #090909, #0b0b0c);
          font: 15px/1.6 ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
        }

        .el-waves {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
        }

        /* ==== SIDEBAR ==== */
        .el-sidebar {
          position: relative;
          z-index: 2;
          width: 264px;
          flex: 0 0 264px;
          transition: width 0.2s ease;
          border-right: 1px solid var(--hair);
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.015), rgba(255, 255, 255, 0.02)),
            radial-gradient(800px 200px at 0% 0%, rgba(217, 191, 122, 0.07), transparent 40%), var(--pane);
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 14px;
          position: sticky;
          top: 0;
          height: 100vh;
        }

        /* Logo rij */
        .el-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 8px 12px;
          border-bottom: 1px solid var(--hair);

          /* animaties voor in-/uitklap */
          max-height: 48px;
          opacity: 1;
          transform: translateX(0);
          transition: max-height 0.25s ease, padding 0.25s ease, opacity 0.25s ease,
            transform 0.25s ease, border-color 0.25s ease;
        }

        .el-logotext {
          font-weight: 900;
          letter-spacing: 0.28px;
          white-space: nowrap;
          transition: opacity 0.2s ease;
        }

        /* Sidebar collapsed: logo verdwijnt volledig */
        .el-collapsed .el-sidebar {
          width: 76px;
          flex: 0 0 76px;
        }
        .el-collapsed .el-logo {
          max-height: 0;
          padding: 0;
          opacity: 0;
          transform: translateX(-8px);
          overflow: hidden;
          border-color: transparent;
        }
        .el-collapsed .el-logotext {
          opacity: 0 !important;
          display: none !important;
        }

        /* Luxe glow wanneer sidebar opent */
        @keyframes el-logo-glow {
          0% {
            filter: drop-shadow(0 0 0 rgba(217, 191, 122, 0));
          }
          55% {
            filter: drop-shadow(0 0 18px rgba(217, 191, 122, 0.35));
          }
          100% {
            filter: drop-shadow(0 0 0 rgba(217, 191, 122, 0));
          }
        }
        .elysium:not(.el-collapsed) .el-logo {
          animation: el-logo-glow 0.65s ease;
        }

        /* Nav */
        .el-nav {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-top: 8px;
        }
        .el-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 11px;
          border-radius: 10px;
          border: 1px solid transparent;
          color: inherit;
          text-decoration: none;
          cursor: pointer;
          transition: 0.15s;
        }
        .el-ic {
          width: 22px;
          display: inline-block;
          text-align: center;
          opacity: 0.95;
        }
        .el-link:hover {
          background: rgba(255, 255, 255, 0.03);
          border-color: var(--hair);
        }
        .el-active {
          background: rgba(217, 191, 122, 0.12);
          border-color: rgba(217, 191, 122, 0.35);
        }

        .el-controls {
          margin-top: auto;
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .el-collapse {
          margin-left: auto;
          border: 1px solid var(--hair);
          background: linear-gradient(180deg, #141416, #0f0f12);
          color: var(--text);
          padding: 8px;
          border-radius: 10px;
          cursor: pointer;
          transition: 0.16s;
        }
        .el-collapse:hover {
          border-color: rgba(255, 255, 255, 0.18);
        }
        .el-sidefoot {
          font-size: 12.5px;
          color: var(--muted);
          margin-top: 10px;
          text-align: center;
        }

        /* ==== MAIN ==== */
        .el-main {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          position: relative;
          z-index: 1;
        }
        .el-topbar {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 14px;
          padding: 16px 22px;
          border-bottom: 1px solid var(--hair-2);
          background: linear-gradient(180deg, rgba(217, 191, 122, 0.06), transparent);
          position: sticky;
          top: 0;
          z-index: 3;
          backdrop-filter: blur(10px) saturate(1.02);
        }
        .el-title {
          margin: 0;
          font-weight: 900;
          font-size: 22px;
          letter-spacing: 0.22px;
          background: linear-gradient(90deg, var(--gold-2), var(--gold));
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          text-shadow: 0 0 12px rgba(217, 191, 122, 0.25);
        }
        .el-sub {
          margin: 2px 0 0;
          color: var(--muted);
        }

        .el-content {
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .el-bottom {
          padding: 8px 20px 20px;
          color: var(--muted);
        }

        /* Cards & buttons */
        .el-content > .el-card,
        .el-card {
          position: relative;
          overflow: hidden;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0.01)), var(--pane2);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: var(--radius);
          padding: 14px;
          box-shadow: var(--shadow);
          transition: transform 0.18s, border-color 0.18s, box-shadow 0.18s;
        }
        .el-card:hover {
          transform: translateY(-2px);
          border-color: rgba(217, 191, 122, 0.28);
        }

        .el-btn {
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: linear-gradient(180deg, #151518, #101013);
          color: var(--text);
          padding: 8px 12px;
          border-radius: 10px;
          font-weight: 600;
        }
        .el-btn:hover {
          border-color: rgba(217, 191, 122, 0.45);
          background: rgba(217, 191, 122, 0.08);
        }

        /* Donkere form controls (fix witte dropdowns) */
        :root {
          color-scheme: dark;
        }
        select {
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          background-color: var(--pane2);
          color: var(--text);
          border: 1px solid var(--hair);
          border-radius: 10px;
          padding: 8px 34px 8px 10px;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s, background-color 0.15s;
        }
        select:hover {
          border-color: rgba(217, 191, 122, 0.35);
        }
        select:focus {
          border-color: rgba(217, 191, 122, 0.55);
          box-shadow: 0 0 0 3px rgba(217, 191, 122, 0.15);
        }
        select::-ms-expand {
          display: none;
        }
        option {
          background-color: #0f0f12;
          color: var(--text);
        }
        .el-select {
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23d9bf7a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>");
          background-repeat: no-repeat;
          background-position: right 10px center;
          background-size: 12px;
        }

        /* Wanneer collapsed: nav labels weg, centreren */
        .el-collapsed .el-link span {
          display: none;
        }
        .el-collapsed .el-link {
          justify-content: center;
          padding: 9px 8px;
        }
        .el-collapsed .el-controls {
          justify-content: center;
        }
        .el-collapsed .el-sidefoot {
          display: none;
        }
      `}</style>
    </div>
  );
}
