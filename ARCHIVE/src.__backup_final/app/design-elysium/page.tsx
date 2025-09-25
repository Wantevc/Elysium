"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

/**
 * DEMO: Elysium Gold — ultra-premium Black & Gold met echte 3D (Three.js)
 * URL: http://localhost:3000/design-elysium
 */
export default function DesignElysium() {
  const [collapsed, setCollapsed] = useState(false);
  const [perf, setPerf] = useState<"high" | "lite">("high"); // performance toggle
  const mountRef = useRef<HTMLDivElement | null>(null);
  const reduceMotion = false; // forceer animatie AAN voor diagnose


  // auto collapse op small
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 900px)");
    const apply = () => setCollapsed(mql.matches);
    apply();
    mql.addEventListener?.("change", apply);
    return () => mql.removeEventListener?.("change", apply);
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // ---- Renderer / Scene / Camera
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x060607, 18, 60);

    const camera = new THREE.PerspectiveCamera(
      45,
      mount.clientWidth / mount.clientHeight,
      0.1,
      200
    );
    camera.position.set(0.8, 0.6, 3.4);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 2.2;
    controls.maxDistance = 6.5;
    controls.autoRotate = !reduceMotion;
    controls.autoRotateSpeed = 0.4;

    // ---- Environment (goede reflecties voor goud)
    const pmrem = new THREE.PMREMGenerator(renderer);
    const env = pmrem.fromScene(new RoomEnvironment(renderer), 0.2).texture;
    scene.environment = env;

    // ---- Lights (warm, subtiel)
    const keyLight = new THREE.DirectionalLight(0xffe7b0, 1.1);
    keyLight.position.set(2.2, 2.0, 1.2);
    scene.add(keyLight);

    const rim = new THREE.DirectionalLight(0xf7d58a, 0.6);
    rim.position.set(-2.0, 1.2, -1.8);
    scene.add(rim);

    const fill = new THREE.AmbientLight(0xffffff, 0.18);
    scene.add(fill);

    // ---- Gold material (PBR)
    const gold = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#d9bf7a"),
      metalness: 1.0,
      roughness: 0.18,
      reflectivity: 1.0,
      clearcoat: 0.45,
      clearcoatRoughness: 0.2,
      envMapIntensity: 1.0,
    });

    // ---- Hero shape (torus knot) – “liquid gold”
    const knotGeo = new THREE.TorusKnotGeometry(0.7, 0.24, 400, 64, 2, 3);
    const knot = new THREE.Mesh(knotGeo, gold);
    knot.castShadow = false;
    knot.receiveShadow = false;
    scene.add(knot);

    // ---- Ground plate (glas met hairline) voor luxe feel
    const plate = new THREE.Mesh(
      new THREE.CylinderGeometry(2.8, 2.8, 0.02, 120),
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#0f0f12"),
        roughness: 0.35,
        metalness: 0.6,
        transmission: 0.04,
        ior: 1.3,
        transparent: true,
      })
    );
    plate.position.set(0, -0.9, 0);
    scene.add(plate);

    // ---- Gold dust particles (parallax)
    const particles: THREE.Points[] = [];
    const particleLayers = perf === "high" ? [1200, 900] : [400];
    particleLayers.forEach((count, idx) => {
      const g = new THREE.BufferGeometry();
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        pos[i * 3 + 0] = (Math.random() - 0.5) * 18;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 18;
      }
      g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      const m = new THREE.PointsMaterial({
        size: idx === 0 ? 0.018 : 0.014,
        color: idx === 0 ? new THREE.Color("#f1dfad") : new THREE.Color("#d9bf7a"),
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
      });
      const p = new THREE.Points(g, m);
      p.rotation.set(Math.random(), Math.random(), Math.random());
      particles.push(p);
      scene.add(p);
    });

    // ---- Postprocessing (Bloom)
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    let bloom: UnrealBloomPass | null = null;
    if (perf === "high" && !reduceMotion) {
      bloom = new UnrealBloomPass(
        new THREE.Vector2(mount.clientWidth, mount.clientHeight),
        0.8, // strength
        0.6, // radius
        0.85 // threshold
      );
      composer.addPass(bloom);
    }

    // ---- Resize handling
    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    // ---- Animate
    let raf = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      const t = clock.getElapsedTime();

      // zachte beweging
      knot.rotation.x = 0.3 + Math.sin(t * 0.3) * 0.08;
      knot.rotation.y = t * 0.25;
      knot.position.y = Math.sin(t * 0.8) * 0.05;

      particles.forEach((p, i) => {
        p.rotation.y += 0.0006 + i * 0.0002;
        p.position.y = Math.sin(t * (0.3 + i * 0.1)) * 0.04;
      });

      controls.update();
      if (bloom) composer.render();
      else renderer.render(scene, camera);

      if (!reduceMotion) raf = requestAnimationFrame(animate);
    };
    if (!reduceMotion) raf = requestAnimationFrame(animate);
    else {
      // 1 still frame
      renderer.render(scene, camera);
    }

    // ---- Cleanup
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      knotGeo.dispose();
      plate.geometry.dispose();
      (gold as any).dispose?.();
      particles.forEach((p) => {
        (p.geometry as THREE.BufferGeometry).dispose();
        (p.material as THREE.PointsMaterial).dispose();
        scene.remove(p);
      });
      composer.dispose();
      pmrem.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [perf, reduceMotion]);

  return (
    <div className={`elysium ${collapsed ? "el-collapsed" : ""}`}>
      {/* 3D layer */}
      <div ref={mountRef} className="el-hero3d" aria-hidden />

      {/* Sidebar */}
      <aside className="el-sidebar">
        <div className="el-logo">
          <div className="el-gdot" />
          <span className="el-logotext">Elysium Gold</span>
        </div>
        <nav className="el-nav">
          <a className="el-link el-active"><i className="el-ic">🏛️</i><span>Dashboard</span></a>
          <a className="el-link"><i className="el-ic">📆</i><span>Campaigns</span></a>
          <a className="el-link"><i className="el-ic">🗣️</i><span>Brand Voice</span></a>
          <a className="el-link"><i className="el-ic">🖼️</i><span>Offer + Visual</span></a>
          <a className="el-link"><i className="el-ic">📤</i><span>Publishing</span></a>
          <a className="el-link"><i className="el-ic">⚙️</i><span>Settings</span></a>
        </nav>

        <div className="el-controls">
          <label className="el-switch">
            <input
              type="checkbox"
              checked={perf === "high"}
              onChange={(e) => setPerf(e.target.checked ? "high" : "lite")}
            />
            <span>{perf === "high" ? "High effects" : "Lite mode"}</span>
          </label>
          <button className="el-collapse" onClick={() => setCollapsed((v) => !v)}>
            {collapsed ? "»" : "«"}
          </button>
        </div>

        <div className="el-sidefoot">© {new Date().getFullYear()}</div>
      </aside>

      {/* Content chrome (professioneel & rustig) */}
      <main className="el-main">
        <header className="el-topbar">
          <div>
            <h1 className="el-title">Premium Dashboard</h1>
            <p className="el-sub">Black & Gold • high trust • cinematic</p>
          </div>
          <div className="el-actions">
            <button className="el-btn el-btn--gold"><span>New Project</span></button>
            <button className="el-btn el-btn--ghost"><span>Quick Start</span></button>
          </div>
        </header>

        <section className="el-grid">
          {["Campaign Builder","Brand Voice","Offer + Visual","Publishing"].map((t,i)=>(
            <article key={i} className="el-card el-sheen">
              <div className="el-cardhead">
                <h3>{t}</h3>
                <span className="el-chip">Premium</span>
              </div>
              <p className="el-muted">Elegant, minimal UI met gouden accenten en subtiele diepte.</p>
              <div className="el-card-actions">
                <button className="el-btn el-btn--gold"><span>Open</span></button>
                <button className="el-btn el-btn--ghost"><span>Docs</span></button>
              </div>
            </article>
          ))}
        </section>

        <section className="el-card el-form">
          <div className="el-cardhead"><h3>Snelle generator</h3></div>
          <div className="el-formgrid">
            <div>
              <label className="el-label">Product / dienst</label>
              <input className="el-input" placeholder="bv. Black label set" />
            </div>
            <div>
              <label className="el-label">Doel</label>
              <select className="el-select">
                <option>Sales</option><option>Leads</option><option>Traffic</option><option>Views</option>
              </select>
            </div>
            <div className="el-span">
              <label className="el-label">Promo (optioneel)</label>
              <input className="el-input" placeholder='bv. "Limited — 24u"' />
            </div>
            <div className="el-form-actions el-span">
              <button className="el-btn el-btn--gold"><span>Genereer</span></button>
              <span className="el-muted">50 credits</span>
            </div>
          </div>
        </section>

        <footer className="el-bottom">Elysium Gold demo</footer>
      </main>

      {/* SCOPED STYLES */}
      <style jsx global>{`
        .elysium{
          --bg:#090909; --pane:#101011; --pane2:#0e0e0f;
          --text:#f4f5f7; --muted:#9ea6b2; --line:rgba(255,255,255,.07);
          --gold:#d9bf7a; --gold-2:#f1dfad; --ring:rgba(217,191,122,.22);
          --hair:#1b1b1d; --hair-2:#202023; --radius:14px; --shadow:0 18px 48px rgba(0,0,0,.55);
          min-height:100vh; display:flex; color:var(--text);
          background:
            radial-gradient(1100px 520px at 12% -10%, rgba(217,191,122,.07), transparent 52%),
            linear-gradient(180deg,#090909,#0b0b0c);
          font:15px/1.6 ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
        }
        .el-hero3d{
          position:fixed; inset:0; z-index:0; pointer-events:none;
        }

        /* Sidebar */
        .el-sidebar{
          position:relative; z-index:2;
          width:264px; flex:0 0 264px; transition:width .2s ease;
          border-right:1px solid var(--hair);
          background:
            linear-gradient(180deg,rgba(255,255,255,.015),rgba(255,255,255,.02)),
            radial-gradient(800px 200px at 0% 0%, rgba(217,191,122,.07), transparent 40%),
            var(--pane);
          display:flex; flex-direction:column; gap:10px; padding:14px; position:sticky; top:0; height:100vh;
        }
        .el-logo{display:flex; align-items:center; gap:10px; padding:8px 8px 12px; border-bottom:1px solid var(--hair)}
        .el-gdot{width:12px; height:12px; border-radius:999px; background:var(--gold); box-shadow:0 0 12px var(--gold)}
        .el-logotext{font-weight:900; letter-spacing:.28px; white-space:nowrap}

        .el-nav{display:flex; flex-direction:column; gap:6px; margin-top:8px}
        .el-link{
          display:flex; align-items:center; gap:10px; padding:9px 11px; border-radius:10px;
          border:1px solid transparent; color:inherit; text-decoration:none; cursor:pointer; transition:.15s;
        }
        .el-ic{width:22px; display:inline-block; text-align:center; opacity:.95}
        .el-link:hover{ background:rgba(255,255,255,.03); border-color:var(--hair) }
        .el-active{ background:rgba(217,191,122,.12); border-color:rgba(217,191,122,.35) }

        .el-controls{ margin-top:auto; display:flex; align-items:center; gap:8px; }
        .el-switch{display:flex; align-items:center; gap:8px; font-size:13px; color:var(--muted)}
        .el-collapse{
          margin-left:auto; border:1px solid var(--hair);
          background:linear-gradient(180deg,#141416,#0f0f12);
          color:var(--text); padding:8px; border-radius:10px; cursor:pointer; transition:.16s;
        }
        .el-collapse:hover{ border-color:rgba(255,255,255,.18) }

        .el-sidefoot{ font-size:12.5px; color:var(--muted); margin-top:10px; text-align:center }

        .el-collapsed .el-sidebar{ width:76px; flex:0 0 76px }
        .el-collapsed .el-logotext{ display:none }
        .el-collapsed .el-link span{ display:none }
        .el-collapsed .el-link{ justify-content:center; padding:9px 8px }
        .el-collapsed .el-controls{ flex-direction:column; gap:6px }
        .el-collapsed .el-sidefoot{ display:none }

        /* Main */
        .el-main{flex:1; min-width:0; display:flex; flex-direction:column; position:relative; z-index:1}
        .el-topbar{
          display:flex; justify-content:space-between; align-items:flex-end; gap:14px;
          padding:16px 22px; border-bottom:1px solid var(--hair-2);
          background: linear-gradient(180deg, rgba(217,191,122,.06), transparent);
          position:sticky; top:0; z-index:3; backdrop-filter: blur(10px) saturate(1.02);
        }
        .el-title{
          margin:0; font-weight:900; font-size:22px; letter-spacing:.22px;
          background:linear-gradient(90deg,var(--gold-2),var(--gold));
          -webkit-background-clip:text; background-clip:text; color:transparent;
          text-shadow:0 0 12px rgba(217,191,122,.25);
        }
        .el-sub{margin:2px 0 0; color:var(--muted)}
        .el-actions{display:flex; gap:10px}

        /* Buttons (slank + sheen + ghost) */
        .el-btn{
          position:relative; overflow:hidden;
          border:1px solid var(--hair); background:linear-gradient(180deg,#151518,#101013);
          color:var(--text); padding:8px 12px; border-radius:10px; font-weight:600; letter-spacing:.1px;
          box-shadow:0 8px 22px rgba(0,0,0,.35); cursor:pointer; transition:transform .14s, border-color .14s, background .14s;
        }
        .el-btn:hover{ transform:translateY(-1px); border-color:rgba(255,255,255,.14) }
        .el-btn span{ position:relative; z-index:2 }
        .el-btn::after{
          content:""; position:absolute; inset:0;
          background:linear-gradient(120deg, transparent 0%, rgba(255,255,255,.08) 45%, rgba(255,255,255,.18) 50%, rgba(255,255,255,.08) 55%, transparent 100%);
          transform:translateX(-130%); transition:transform .6s ease;
        }
        .el-btn:hover::after{ transform:translateX(130%) }
        .el-btn--gold{
          color:#0b0b0c;
          background:
            linear-gradient(180deg, rgba(241,223,173,.42), rgba(217,191,122,.28)),
            linear-gradient(180deg,#171717,#101010);
          border-color: rgba(217,191,122,.48);
          text-shadow:0 0 8px rgba(241,223,173,.28);
        }
        .el-btn--ghost{ background:transparent; border-color:rgba(255,255,255,.12) }
        .el-btn--ghost:hover{ border-color:rgba(217,191,122,.45); background:rgba(217,191,122,.06) }

        /* Cards */
        .el-grid{ padding:18px; display:grid; grid-template-columns: repeat(4, 1fr); gap:14px }
        @media (max-width:1100px){ .el-grid{ grid-template-columns: repeat(2, 1fr) } }
        @media (max-width:640px){ .el-grid{ grid-template-columns: 1fr } }

        .el-card{
          position:relative; overflow:hidden;
          background: linear-gradient(180deg, rgba(255,255,255,.02), rgba(255,255,255,.01)), var(--pane2);
          border:1px solid var(--hair-2); border-radius:var(--radius); padding:14px; box-shadow: var(--shadow);
          transition: transform .18s, border-color .18s, box-shadow .18s;
        }
        .el-card:hover{ transform:translateY(-2px); border-color: rgba(217,191,122,.28) }
        .el-sheen::before{
          content:""; position:absolute; inset:-1px; pointer-events:none;
          background:
            linear-gradient(130deg, rgba(217,191,122,.16), transparent 28%),
            linear-gradient(310deg, rgba(241,223,173,.10), transparent 35%);
          opacity:0; transition:opacity .25s ease;
        }
        .el-sheen:hover::before{ opacity:.9 }
        .el-cardhead{ display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:6px }
        .el-chip{
          font-size:12px; letter-spacing:.12px; color:var(--gold-2);
          border:1px solid rgba(217,191,122,.35); background:rgba(217,191,122,.08);
          border-radius:999px; padding:3px 8px;
        }
        .el-muted{ color:var(--muted) }
        .el-card-actions{ margin-top:8px; display:flex; gap:8px }

        /* Form */
        .el-form{ margin:6px 18px 14px }
        .el-formgrid{ display:grid; grid-template-columns: repeat(3, 1fr); gap:14px }
        .el-span{ grid-column:1 / -1 }
        @media (max-width:900px){ .el-formgrid{ grid-template-columns:1fr } .el-span{ grid-column:auto } }
        .el-label{ display:block; font-weight:700; margin:4px 0 6px; color:#f1e8d5; letter-spacing:.15px }
        .el-input, .el-select, .el-textarea{
          width:100%; background:linear-gradient(180deg,#0f0f12,#0d0d10);
          border:1px solid rgba(217,191,122,.25); color:var(--text); border-radius:10px; padding:10px 12px; outline:none; transition:.15s;
        }
        .el-input::placeholder, .el-textarea::placeholder{ color:#8f96a3 }
        .el-input:focus, .el-select:focus, .el-textarea:focus{
          border-color: rgba(241,223,173,.70); box-shadow: 0 0 0 4px var(--ring);
        }

        .el-bottom{ padding:8px 20px 20px; color:var(--muted) }
      `}</style>
    </div>
  );
}