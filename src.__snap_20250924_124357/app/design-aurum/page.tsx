"use client";
import React, { useEffect, useRef, useState } from "react";

/**
 * DEMO: Aurelius Noir — Black & Gold ultra-premium + 3D-ish moving background + refined buttons
 * URL: http://localhost:3000/design-aurum
 */
export default function DesignAurum() {
  const [collapsed, setCollapsed] = useState(false);
  const cvsRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  // Collapsing sidebar (auto on small)
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 900px)");
    const apply = () => setCollapsed(mql.matches);
    apply();
    mql.addEventListener?.("change", apply);
    return () => mql.removeEventListener?.("change", apply);
  }, []);

  // ===== Background: “3D-ish” moving gold orbs (no libs) =====
  useEffect(() => {
    const canvas = cvsRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let w = (canvas.width = canvas.offsetWidth * devicePixelRatio);
    let h = (canvas.height = canvas.offsetHeight * devicePixelRatio);
    ctx.scale(devicePixelRatio, devicePixelRatio);

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Parallax layers
    const LAYERS = [
      { z: 0.15, n: 8, color1: "rgba(217,191,122,0.10)", color2: "rgba(241,223,173,0.08)" },
      { z: 0.30, n: 10, color1: "rgba(217,191,122,0.12)", color2: "rgba(241,223,173,0.10)" },
      { z: 0.55, n: 12, color1: "rgba(217,191,122,0.14)", color2: "rgba(241,223,173,0.12)" },
    ];

    type Orb = { x: number; y: number; r: number; vx: number; vy: number; z: number };
    const orbs: Orb[] = [];
    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    for (const L of LAYERS) {
      for (let i = 0; i < L.n; i++) {
        orbs.push({
          x: rand(-0.1 * w, 1.1 * w),
          y: rand(-0.1 * h, 1.1 * h),
          r: rand(60, 140) * (1 + L.z),
          vx: rand(-0.15, 0.15) * (1 + L.z),
          vy: rand(-0.10, 0.10) * (1 + L.z),
          z: L.z,
        });
      }
    }

    // Mouse parallax
    const mouse = { x: w / 2, y: h / 2 };
    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = (e.clientX - rect.left) * devicePixelRatio;
      mouse.y = (e.clientY - rect.top) * devicePixelRatio;
    };
    window.addEventListener("mousemove", onMove);

    const onResize = () => {
      w = canvas.width = canvas.offsetWidth * devicePixelRatio;
      h = canvas.height = canvas.offsetHeight * devicePixelRatio;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    };
    window.addEventListener("resize", onResize);

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);

      // Subtle vignette
      const vg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7);
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, "rgba(0,0,0,0.35)");
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, w, h);

      for (const o of orbs) {
        // motion
        o.x += o.vx;
        o.y += o.vy;
        if (o.x < -200 || o.x > w + 200) o.vx *= -1;
        if (o.y < -200 || o.y > h + 200) o.vy *= -1;

        // parallax offset towards mouse
        const dx = (mouse.x - w / 2) * (o.z * 0.02);
        const dy = (mouse.y - h / 2) * (o.z * 0.02);

        const x = o.x + dx;
        const y = o.y + dy;

        // soft dual radial “gold” glow
        const g = ctx.createRadialGradient(x, y, 0, x, y, o.r);
        g.addColorStop(0, "rgba(241,223,173,0.18)");
        g.addColorStop(0.5, "rgba(217,191,122,0.10)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, o.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = "source-over";
      }

      if (!reduce) rafRef.current = requestAnimationFrame(draw);
    };

    if (!reduce) rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className={`aurum ${collapsed ? "au-collapsed" : ""}`}>
      {/* Background layer (no pointer events) */}
      <canvas ref={cvsRef} className="au-bg" aria-hidden />

      <aside className="au-sidebar">
        <div className="au-logo">
          <div className="au-logo-mark" />
          <span className="au-logo-text">Aurelius</span>
        </div>
        <nav className="au-nav">
          <a className="au-link au-active"><i className="au-ic">🏛️</i><span>Dashboard</span></a>
          <a className="au-link"><i className="au-ic">📆</i><span>Campaigns</span></a>
          <a className="au-link"><i className="au-ic">🗣️</i><span>Brand Voice</span></a>
          <a className="au-link"><i className="au-ic">🖼️</i><span>Offer + Visual</span></a>
          <a className="au-link"><i className="au-ic">📤</i><span>Publishing</span></a>
          <a className="au-link"><i className="au-ic">⚙️</i><span>Settings</span></a>
        </nav>
        <button className="au-collapse" onClick={() => setCollapsed(v => !v)}>
          {collapsed ? "»" : "«"}
        </button>
        <div className="au-foot">© {new Date().getFullYear()}</div>
      </aside>

      <main className="au-main">
        <header className="au-topbar">
          <div>
            <h1 className="au-title">Aurelius Dashboard</h1>
            <p className="au-sub">Black & Gold — discreet, exact, high-end</p>
          </div>
          <div className="au-actions">
            <button className="au-btn au-btn--gold"><span>New Project</span></button>
            <button className="au-btn au-btn--ghost"><span>Quick Start</span></button>
          </div>
        </header>

        <section className="au-grid">
          {[
            ["Campaign Builder","Plan en orkestreer multi-channel campagnes."],
            ["Brand Voice","Definieer tone-of-voice en stijlregels."],
            ["Offer + Visual","Combineer aanbiedingen met visuals."],
            ["Publishing","Plan & publiceer naar kanalen."],
          ].map(([t,d],i)=>(
            <article key={i} className="au-card au-sheen">
              <div className="au-card-head">
                <h3>{t}</h3>
                <div className="au-chip">Premium</div>
              </div>
              <p className="au-muted">{d}</p>
              <div className="au-card-actions">
                <button className="au-btn au-btn--gold"><span>Open</span></button>
                <button className="au-btn au-btn--ghost"><span>Docs</span></button>
              </div>
            </article>
          ))}
        </section>

        <section className="au-card au-form">
          <div className="au-card-head"><h3>Snelle generator</h3></div>
          <div className="au-formgrid">
            <div>
              <label className="au-label">Product / dienst</label>
              <input className="au-input" placeholder="bv. Black label set" />
            </div>
            <div>
              <label className="au-label">Doel</label>
              <select className="au-select">
                <option>Sales</option><option>Leads</option><option>Traffic</option><option>Views</option>
              </select>
            </div>
            <div className="au-span">
              <label className="au-label">Promo (optioneel)</label>
              <input className="au-input" placeholder='bv. "Limited — 24u"' />
            </div>
            <div className="au-form-actions au-span">
              <button className="au-btn au-btn--gold"><span>Genereer</span></button>
              <span className="au-muted">50 credits</span>
            </div>
          </div>
        </section>

        <footer className="au-bottom">Aurelius Noir demo</footer>
      </main>

      {/* Styles (scoped) */}
      <style jsx global>{`
        /* ===== Tokens ===== */
        .aurum{
          --bg:#0a0a0b; --pane:#101011; --pane2:#0e0e0f;
          --text:#f4f5f7; --muted:#9ea6b2; --line:rgba(255,255,255,.07);
          --gold:#d9bf7a; --gold-2:#f1dfad; --ring:rgba(217,191,122,.22);
          --radius:14px; --shadow:0 18px 48px rgba(0,0,0,.55);
          --hair:#1b1b1d; --hair-2:#202023;
          min-height:100vh; display:flex; color:var(--text);
          background: linear-gradient(180deg,#090909,#0b0b0c);
          font:15px/1.6 ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
        }
        .au-bg{
          position:fixed; inset:0; z-index:0; pointer-events:none;
          width:100%; height:100%;
        }

        /* ===== Sidebar ===== */
        .au-sidebar{
          position:relative; z-index:1;
          width:264px; flex:0 0 264px; transition:width .2s ease;
          background:linear-gradient(180deg,rgba(255,255,255,.015),rgba(255,255,255,.02)), var(--pane);
          border-right:1px solid var(--hair);
          display:flex; flex-direction:column; gap:10px; padding:14px; position:sticky; top:0; height:100vh;
        }
        .au-logo{display:flex; align-items:center; gap:10px; padding:8px 8px 12px; border-bottom:1px solid var(--hair)}
        .au-logo-mark{width:12px; height:12px; border-radius:999px; background:var(--gold); box-shadow:0 0 12px var(--gold)}
        .au-logo-text{font-weight:800; letter-spacing:.2px; white-space:nowrap}

        .au-nav{display:flex; flex-direction:column; gap:6px; margin-top:8px}
        .au-link{
          display:flex; align-items:center; gap:10px; padding:9px 11px; border-radius:10px;
          border:1px solid transparent; color:inherit; text-decoration:none; cursor:pointer; transition:.15s;
        }
        .au-ic{width:22px; display:inline-block; text-align:center; opacity:.95}
        .au-link:hover{ background:rgba(255,255,255,.03); border-color:var(--hair) }
        .au-active{ background:rgba(217,191,122,.12); border-color:rgba(217,191,122,.35) }

        .au-collapse{
          margin-top:auto; border:1px solid var(--hair);
          background:linear-gradient(180deg,#141416,#0f0f12);
          color:var(--text); padding:8px; border-radius:10px; cursor:pointer; transition:.16s;
        }
        .au-collapse:hover{ border-color:rgba(255,255,255,.18) }
        .au-foot{ font-size:12.5px; color:var(--muted); margin-top:10px; text-align:center }

        .au-collapsed .au-sidebar{ width:76px; flex:0 0 76px }
        .au-collapsed .au-logo-text{ display:none }
        .au-collapsed .au-link span{ display:none }
        .au-collapsed .au-link{ justify-content:center; padding:9px 8px }
        .au-collapsed .au-foot{ display:none }

        /* ===== Main + Topbar ===== */
        .au-main{flex:1; min-width:0; display:flex; flex-direction:column; position:relative; z-index:1}
        .au-topbar{
          display:flex; justify-content:space-between; align-items:flex-end; gap:14px;
          padding:16px 22px; border-bottom:1px solid var(--hair-2);
          background: linear-gradient(180deg, rgba(217,191,122,.06), transparent);
          position:sticky; top:0; z-index:2; backdrop-filter: blur(10px) saturate(1.02);
        }
        .au-title{
          margin:0; font-weight:800; font-size:21px; letter-spacing:.18px;
          background:linear-gradient(90deg,var(--gold-2),var(--gold));
          -webkit-background-clip:text; background-clip:text; color:transparent;
          text-shadow:0 0 10px rgba(217,191,122,.22);
        }
        .au-sub{margin:2px 0 0; color:var(--muted)}
        .au-actions{display:flex; gap:10px}

        /* ===== Buttons — refined, slim, pro ===== */
        .au-btn{
          position:relative; overflow:hidden;
          border:1px solid var(--hair); background:linear-gradient(180deg,#151518,#101013);
          color:var(--text); padding:8px 12px; border-radius:10px; font-weight:600; letter-spacing:.1px;
          box-shadow:0 8px 22px rgba(0,0,0,.35); cursor:pointer; transition:transform .14s, border-color .14s, background .14s;
        }
        .au-btn:hover{ transform:translateY(-1px); border-color:rgba(255,255,255,.14) }
        .au-btn span{ position:relative; z-index:2 }
        /* gentle sheen */
        .au-btn::after{
          content:""; position:absolute; inset:0;
          background:linear-gradient(120deg, transparent 0%, rgba(255,255,255,.08) 45%, rgba(255,255,255,.18) 50%, rgba(255,255,255,.08) 55%, transparent 100%);
          transform:translateX(-130%); transition:transform .6s ease;
        }
        .au-btn:hover::after{ transform:translateX(130%) }
        /* primary gold */
        .au-btn--gold{
          color:#0b0b0c;
          background:
            linear-gradient(180deg, rgba(241,223,173,.42), rgba(217,191,122,.28)),
            linear-gradient(180deg,#171717,#101010);
          border-color: rgba(217,191,122,.48);
          text-shadow:0 0 8px rgba(241,223,173,.28);
        }
        /* ghost (outline) */
        .au-btn--ghost{
          background:transparent; border-color:rgba(255,255,255,.12);
        }
        .au-btn--ghost:hover{ border-color:rgba(217,191,122,.45); background:rgba(217,191,122,.06) }

        /* ===== Cards + sheen ===== */
        .au-grid{ padding:18px; display:grid; grid-template-columns: repeat(4, 1fr); gap:14px }
        @media (max-width:1100px){ .au-grid{ grid-template-columns: repeat(2, 1fr) } }
        @media (max-width:640px){ .au-grid{ grid-template-columns: 1fr } }

        .au-card{
          position:relative; overflow:hidden;
          background:
            linear-gradient(180deg, rgba(255,255,255,.02), rgba(255,255,255,.01)),
            var(--pane2);
          border:1px solid var(--hair-2); border-radius:var(--radius); padding:14px;
          box-shadow: var(--shadow); transition: transform .18s, border-color .18s, box-shadow .18s;
        }
        .au-card:hover{ transform:translateY(-2px); border-color:rgba(217,191,122,.28) }

        .au-sheen::before{
          content:""; position:absolute; inset:-1px; pointer-events:none;
          background:
            linear-gradient(130deg, rgba(217,191,122,.16), transparent 28%),
            linear-gradient(310deg, rgba(241,223,173,.10), transparent 35%);
          opacity:0; transition:opacity .25s ease;
        }
        .au-sheen:hover::before{ opacity:.9 }

        .au-card-head{ display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:6px }
        .au-chip{
          font-size:12px; letter-spacing:.12px; color:var(--gold-2);
          border:1px solid rgba(217,191,122,.35);
          background:rgba(217,191,122,.08);
          border-radius:999px; padding:3px 8px;
        }
        .au-muted{ color:var(--muted) }
        .au-card-actions{ margin-top:8px; display:flex; gap:8px }

        /* ===== Form ===== */
        .au-form{ margin:6px 18px 14px }
        .au-formgrid{ display:grid; grid-template-columns: repeat(3, 1fr); gap:14px }
        .au-span{ grid-column:1 / -1 }
        @media (max-width:900px){ .au-formgrid{ grid-template-columns:1fr } .au-span{ grid-column:auto } }

        .au-label{ display:block; font-weight:700; margin:4px 0 6px; color:#f1e8d5; letter-spacing:.15px }
        .au-input, .au-select, .au-textarea{
          width:100%; background:linear-gradient(180deg,#0f0f12,#0d0d10);
          border:1px solid rgba(217,191,122,.25); color:var(--text);
          border-radius:10px; padding:10px 12px; outline:none; transition:.15s;
        }
        .au-input::placeholder, .au-textarea::placeholder{ color:#8f96a3 }
        .au-input:focus, .au-select:focus, .au-textarea:focus{
          border-color: rgba(241,223,173,.70); box-shadow: 0 0 0 4px var(--ring);
        }

        .au-bottom{ padding:8px 20px 20px; color:var(--muted) }
      `}</style>
    </div>
  );
}
