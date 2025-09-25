"use client";
import React, { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import GoldWaves from "./GoldWaves";
import Logo from "../ui/Logo";
import AuroraCurtains from "../AuroraCurtains";

/* ---- Diamond gating (hydrate-safe) ---- */
const hasDiamondLS = () =>
  (typeof window !== "undefined") &&
  (localStorage.getItem("wallet.plan") || "").toLowerCase() === "diamond";

/* ---- Persisted sidebar pref ---- */
const LS_SIDEBAR = "ui.sidebar.collapsed";

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

  // Default collapsed = true
  const [collapsed, setCollapsed] = useState<boolean>(true);
  const [isDiamond, setIsDiamond] = useState(false);

  // Hydrate: load sidebar pref + diamond + responsive collapse
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_SIDEBAR);
      setCollapsed(raw === "true" || raw === "false" ? raw === "true" : true);
    } catch {}

    const syncDiamond = () => setIsDiamond(hasDiamondLS());
    syncDiamond();
    window.addEventListener("wallet:update", syncDiamond);
    window.addEventListener("storage", syncDiamond);

    const mql = window.matchMedia("(max-width: 900px)");
    const apply = () => { if (mql.matches) setCollapsed(true); };
    apply();
    mql.addEventListener?.("change", apply);

    return () => {
      window.removeEventListener("wallet:update", syncDiamond);
      window.removeEventListener("storage", syncDiamond);
      mql.removeEventListener?.("change", apply);
    };
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((v) => {
      const next = !v;
      try { localStorage.setItem(LS_SIDEBAR, String(next)); } catch {}
      return next;
    });
  };

  /* ---- Nav model ---- */
  const BASE_LINKS = [
    { href: "/", label: "Dashboard", icon: "🏛️" },
    { href: "/campaign-builder", label: "Campaigns", icon: "📆" },
    { href: "/brand-voice", label: "Brand Voice", icon: "🗣️" },
    { href: "/offer-visual", label: "Offer + Visual", icon: "🖼️" },
    { href: "/publishing", label: "Publishing", icon: "📤" },
    { href: "/trend-radar", label: "Trend Radar", icon: "📈" },
    { href: "/engagement-sim", label: "Engage Sim", icon: "💬" },
  ];
  const DIAMOND_LINKS = [
    { href: "/team", label: "Team", icon: "👥" },
    { href: "/ai-coach", label: "AI Coach", icon: "🧠" },
  ];
  const TAIL_LINKS = [{ href: "/settings", label: "Settings", icon: "⚙️" }];

  function LinkEl({ href, label, icon }: { href: string; label: string; icon: string }) {
    return (
      <Link
        href={href}
        className={`el-link ${isActive(href) ? "el-active" : ""}`}
        title={collapsed ? label : undefined}
        aria-label={label}
        style={{ display: "flex", alignItems: "center", gap: 10 }}
      >
        <span className="el-ic" aria-hidden="true">{icon}</span>
        <span className="el-txt">{label}</span>
      </Link>
    );
  }

  return (
    <div className={`elysium ${collapsed ? "el-collapsed" : ""}`}>
      <GoldWaves />
      <AuroraCurtains opacity={0.22} />

      {/* SIDEBAR */}
      <aside className="el-sidebar">
        {/* Logo row */}
        <div className="el-logo">
          <Logo size={32} />
          <span className="el-logotext"></span>
        </div>

        {/* NAV (scrollable) */}
        <nav className="el-nav">
          {[...BASE_LINKS, ...(isDiamond ? DIAMOND_LINKS : []), ...TAIL_LINKS].map((l) => (
            <LinkEl key={l.href} {...l} />
          ))}
        </nav>

        {/* Collapse button + footer */}
        <div className="el-controls">
          <button className="el-collapse" onClick={toggleCollapsed}>
            {collapsed ? "»" : "«"}
          </button>
        </div>
        <div className="el-sidefoot">© {new Date().getFullYear()}</div>
      </aside>

      {/* MAIN */}
      <main className="el-main">
        <div className="el-topbar">
          <div>
            <h1 className="el-title">{title}</h1>
            {subtitle && <div className="el-sub">{subtitle}</div>}
          </div>
          <div className="el-actions" />
        </div>

        <section className="el-content">{children}</section>
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
          background: radial-gradient(1100px 520px at 12% -10%, rgba(217,191,122,0.07), transparent 52%),
                      linear-gradient(180deg, #090909, #0b0b0c);
          font: 15px/1.6 ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
        }
        .el-waves { position: fixed; inset: 0; z-index: 0; pointer-events: none; }

        /* ==== SIDEBAR ==== */
        .el-sidebar {
          position: sticky; top: 0;
          z-index: 2;
          width: 264px; flex: 0 0 264px;
          transition: width 0.2s ease;
          border-right: 1px solid var(--hair);
          background:
            linear-gradient(180deg, rgba(255,255,255,0.015), rgba(255,255,255,0.02)),
            radial-gradient(800px 200px at 0% 0%, rgba(217,191,122,0.07), transparent 40%),
            var(--pane);

          /* GRID: logo | nav (scroll) | controls | footer */
          display: grid;
          grid-template-rows: auto 1fr auto auto;
          gap: 10px;

          padding: 14px;
          height: 100vh;
          overflow: hidden; /* nav krijgt de scroll */
        }

        .el-logo {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 8px 12px; border-bottom: 1px solid var(--hair);
          max-height: 48px; opacity: 1; transform: translateX(0);
          transition: max-height .25s, padding .25s, opacity .25s, transform .25s, border-color .25s;
        }
        .el-logotext { font-weight: 900; letter-spacing: .28px; white-space: nowrap; transition: opacity .2s; }

        .el-collapsed .el-sidebar { width: 76px; flex: 0 0 76px; }
        .el-collapsed .el-logo { max-height: 0; padding: 0; opacity: 0; transform: translateX(-8px); overflow: hidden; border-color: transparent; }
        .el-collapsed .el-logotext { opacity: 0 !important; display: none !important; }

       /* NAV (scrollable) */
.el-nav {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;

  /* scroll alleen hier */
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding-bottom: 8px;
  scrollbar-gutter: stable;
  overscroll-behavior: contain;

  /* Firefox scrollbar kleur/dikte */
  scrollbar-width: thin;                                /* thin | auto */
  scrollbar-color: rgba(217,191,122,.5) transparent;    /* thumb | track */
}

/* WebKit (Chromium/Edge/Safari) – slanke gouden scrollbar */
.el-nav::-webkit-scrollbar {
  width: 8px;                                           /* slank */
}
.el-nav::-webkit-scrollbar-track {
  background: transparent;                              /* geen grijze baan */
}
.el-nav::-webkit-scrollbar-thumb {
  border-radius: 9999px;
  border: 2px solid transparent;                        /* optische “padding” */
  background-clip: padding-box;
  background: linear-gradient(
    180deg,
    rgba(217,191,122,.85),
    rgba(217,191,122,.55)
  );
  box-shadow: 0 0 0 1px rgba(0,0,0,.2) inset;            /* subtiele edge */
}
.el-nav::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(
    180deg,
    rgba(241,223,173,.95),
    rgba(217,191,122,.85)
  );
}
.el-nav::-webkit-scrollbar-button {                      /* pijltjes verbergen (Windows) */
  height: 0;
  display: none;
}

/* subtiele fade onderaan */
.el-nav::after{
  content:"";
  position: sticky;
  bottom:-1px;
  display:block;
  height:18px;
  margin-top:-18px;
  background: linear-gradient(180deg, rgba(16,16,17,0), rgba(217,191,122,0.06));
  pointer-events:none;
}

/* Firefox */
html {
  scrollbar-width: thin;                                 /* thin | auto */
  scrollbar-color: rgba(217,191,122,.5) transparent;     /* thumb | track */
  scrollbar-gutter: stable;                               /* geen layout jump */
}

/* WebKit (Chromium/Edge/Safari) */
html::-webkit-scrollbar {
  width: 10px;                                            /* iets breder dan sidebar */
}
html::-webkit-scrollbar-track {
  background: transparent;                                /* geen grijze baan */
}
html::-webkit-scrollbar-thumb {
  border-radius: 9999px;
  border: 2px solid transparent;                          /* optische “padding” */
  background-clip: padding-box;
  background: linear-gradient(
    180deg,
    rgba(217,191,122,.85),
    rgba(217,191,122,.55)
  );
  box-shadow: 0 0 0 1px rgba(0,0,0,.25) inset;            /* subtiele edge */
}
html::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(
    180deg,
    rgba(241,223,173,.95),
    rgba(217,191,122,.85)
  );
}
html::-webkit-scrollbar-button {
  height: 0;
  display: none;                                          /* verberg pijltjes (Windows) */
}

        .el-link {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 11px; border-radius: 10px; border: 1px solid transparent;
          color: inherit; text-decoration: none; cursor: pointer; transition: .15s;
        }
        .el-ic { width: 22px; display: inline-grid; place-items: center; opacity: .95; }
        .el-link:hover { background: rgba(255,255,255,.03); border-color: var(--hair); }
        .el-active { background: rgba(217,191,122,.12); border-color: rgba(217,191,122,.35); }

        .el-controls { display: flex; gap: 8px; align-items: center; justify-content: flex-end; }
        .el-collapse {
          border: 1px solid var(--hair);
          background: linear-gradient(180deg, #141416, #0f0f12);
          color: var(--text); padding: 8px; border-radius: 10px; cursor: pointer; transition: .16s;
        }
        .el-collapse:hover { border-color: rgba(255,255,255,.18); }
        .el-sidefoot { font-size: 12.5px; color: var(--muted); text-align: center; }

        /* ==== MAIN ==== */
        .el-main { flex: 1; min-width: 0; display: flex; flex-direction: column; position: relative; z-index: 1; }
        .el-topbar {
          display: flex; justify-content: space-between; align-items: flex-end; gap: 14px;
          padding: 16px 22px; border-bottom: 1px solid var(--hair-2);
          background: linear-gradient(180deg, rgba(217,191,122,.06), transparent);
          position: sticky; top: 0; z-index: 3; backdrop-filter: blur(10px) saturate(1.02);
        }
        .el-title {
          margin: 0; font-weight: 900; font-size: 22px; letter-spacing: .22px;
          background: linear-gradient(90deg, var(--gold-2), var(--gold));
          -webkit-background-clip: text; background-clip: text; color: transparent;
          text-shadow: 0 0 12px rgba(217,191,122,.25);
        }
        .el-sub { margin: 2px 0 0; color: var(--muted); }
        .el-content { padding: 18px; display: flex; flex-direction: column; gap: 16px; }
        .el-bottom { padding: 8px 20px 20px; color: var(--muted); }

        .el-content > .el-card, .el-card {
          position: relative; overflow: hidden;
          background: linear-gradient(180deg, rgba(255,255,255,.02), rgba(255,255,255,.01)), var(--pane2);
          border: 1px solid rgba(255,255,255,.08); border-radius: var(--radius); padding: 14px; box-shadow: var(--shadow);
          transition: transform .18s, border-color .18s, box-shadow .18s;
        }
        .el-card:hover { transform: translateY(-2px); border-color: rgba(217,191,122,.28); }

        .el-btn {
          border: 1px solid rgba(255,255,255,.12); background: linear-gradient(180deg, #151518, #101013);
          color: var(--text); padding: 8px 12px; border-radius: 10px; font-weight: 600;
        }
        .el-btn:hover { border-color: rgba(217,191,122,.45); background: rgba(217,191,122,.08); }

        :root { color-scheme: dark; }
        select {
          appearance: none; background-color: var(--pane2); color: var(--text); border: 1px solid var(--hair);
          border-radius: 10px; padding: 8px 34px 8px 10px; outline: none; transition: border-color .15s, box-shadow .15s, background-color .15s;
        }
        select:hover { border-color: rgba(217,191,122,.35); }
        select:focus { border-color: rgba(217,191,122,.55); box-shadow: 0 0 0 3px rgba(217,191,122,.15); }
        option { background-color: #0f0f12; color: var(--text); }
        .el-select {
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23d9bf7a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>");
          background-repeat: no-repeat; background-position: right 10px center; background-size: 12px;
        }

        /* Collapsed: verberg ALLEEN labels, niet iconen */
        .el-collapsed .el-link .el-txt { display: none; }
        .el-collapsed .el-link { justify-content: center; padding: 9px 8px; }
        .el-collapsed .el-controls { justify-content: center; }
        .el-collapsed .el-sidefoot { display: none; }
      `}</style>
    </div>
  );
}