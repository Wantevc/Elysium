"use client";

import React, { useEffect, useState } from "react";
import PageShell from "../components/PageShell";
import { Card, SectionTitle, TOKENS, GlowButton } from "../components/ui";

// localStorage: hashtags.bundles = [{name, tags}]
type Bundle = { name: string; tags: string };

function readBundles(): Bundle[] {
  try {
    const raw = localStorage.getItem("hashtags.bundles");
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}
function writeBundles(next: Bundle[]) {
  try { localStorage.setItem("hashtags.bundles", JSON.stringify(next)); } catch {}
}

function walletRead() {
  try {
    const sub = parseInt(localStorage.getItem("wallet.subCredits") || "0", 10) || 0;
    const top = parseInt(localStorage.getItem("wallet.topupCredits") || "0", 10) || 0;
    const plan = localStorage.getItem("wallet.plan") || "";
    return { plan, sub, top, total: sub + top };
  } catch {
    return { plan: "", sub: 0, top: 0, total: 0 };
  }
}
function walletWrite(next: { plan: string | null; sub: number; top: number }) {
  const total = Math.max(0, (next.sub || 0) + (next.top || 0));
  try {
    localStorage.setItem("wallet.plan", next.plan ?? "");
    localStorage.setItem("wallet.subCredits", String(Math.max(0, next.sub)));
    localStorage.setItem("wallet.topupCredits", String(Math.max(0, next.top)));
    localStorage.setItem("wallet.total", String(total));
    window.dispatchEvent(new Event("wallet:update"));
  } catch {}
}

export default function SettingsPage() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [name, setName] = useState("");
  const [tags, setTags] = useState("");
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    setBundles(readBundles());
    const sync = () => setCredits(walletRead().total);
    sync();
    const h = sync as any;
    window.addEventListener("storage", sync);
    window.addEventListener("wallet:update", h);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("wallet:update", h);
    };
  }, []);

  function addBundle() {
    if (!name.trim() || !tags.trim()) return;
    const next = [{ name: name.trim(), tags: tags.trim() }, ...bundles].slice(0, 20);
    setBundles(next);
    writeBundles(next);
    setName(""); setTags("");
  }
  function delBundle(i: number) {
    const next = bundles.slice();
    next.splice(i, 1);
    setBundles(next);
    writeBundles(next);
  }

  return (
    <PageShell title="Settings" desc="Beheer hashtags & wallet (lokaal).">
      <Card>
        <SectionTitle title="Hashtag bundles" desc="Maak bundels die je in de composer kunt toevoegen." />
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Naam</label>
            <input
              className="mt-1 w-full rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="bv. Winter Sale"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Tags (spaties/komma’s)</label>
            <input
              className="mt-1 w-full rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 text-sm"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="#winter #sale #promo of winter, sale, promo"
            />
          </div>
        </div>
        <div className="mt-3">
          <GlowButton onClick={addBundle}>Toevoegen</GlowButton>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {bundles.length === 0 && (
            <div className={`text-sm ${TOKENS.SUBTLE}`}>Nog geen bundels.</div>
          )}
          {bundles.map((b, i) => (
            <div key={i} className="rounded-xl border border-white/10 p-3">
              <div className="font-medium">{b.name}</div>
              <div className="text-sm mt-1 whitespace-pre-wrap">{b.tags}</div>
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => delBundle(i)}
                  className="rounded-xl px-3 py-2 text-sm border border-red-400/40 text-red-300 hover:bg-red-400/10"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle title="Wallet (demo)" desc="Pas je lokale credits aan (voor test). In productie koppel je dit aan betalingen." />
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <div className="text-sm font-medium">Credits</div>
            <div className="text-2xl font-bold">{credits}</div>
          </div>
          <button
            type="button"
            onClick={() => {
              const w = walletRead();
              walletWrite({ plan: w.plan, sub: w.sub + 50, top: w.top });
            }}
            className="rounded-xl px-3 py-2 text-sm border border-white/10 hover:bg-white/5"
          >
            +50
          </button>
          <button
            type="button"
            onClick={() => {
              const w = walletRead();
              walletWrite({ plan: w.plan, sub: Math.max(0, w.sub - 50), top: w.top });
            }}
            className="rounded-xl px-3 py-2 text-sm border border-white/10 hover:bg-white/5"
          >
            −50
          </button>
        </div>
      </Card>
    </PageShell>
  );
}