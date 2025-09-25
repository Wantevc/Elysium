ak:

"use client";
import React, { useEffect, useState } from "react";
import { Card, TOKENS } from "./ui";

/**
 * Toegang:
 * - Bezoekers: zien "Coming Soon" overlay.
 * - Jij (dev): toggle met Ctrl+Shift+D of voeg ?dev=1 aan de URL toe → overlay uit.
 */
export default function ComingSoon({ children, title = "Publishing" }: { children: React.ReactNode; title?: string }) {
  const [dev, setDev] = useState(false);

  useEffect(() => {
    const fromQs = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("dev") === "1";
    const saved = typeof window !== "undefined" && localStorage.getItem("dev.publishing") === "1";
    setDev(!!fromQs || !!saved);

    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.code === "KeyD") {
        const next = !dev;
        setDev(next);
        try { localStorage.setItem("dev.publishing", next ? "1" : "0"); } catch {}
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dev]);

  if (dev) return <>{children}</>;

  return (
    <div className="relative">
      <Card>
        <div className="flex items-center justify-between">
          <div className={`text-lg font-semibold ${TOKENS.TEXT}`}>{title}</div>
          <span className="text-[11px] rounded-full border border-white/10 px-2 py-0.5 text-neutral-300">coming soon</span>
        </div>
        <p className={`mt-2 text-sm ${TOKENS.SUBTLE}`}>
          Deze module is binnenkort beschikbaar. Ondertussen kan je Campaign Builder, Brand Voice en Offer + Visual al gebruiken.
        </p>
        <div className="mt-3 text-xs text-neutral-400">
          Dev-toegang: druk <code>Ctrl+Shift+D</code> of gebruik <code>?dev=1</code> om de module te testen.
        </div>
      </Card>

      {/* Blur overlay */}
      <div className="absolute inset-0 rounded-2xl backdrop-blur-[2px] bg-black/20 pointer-events-none" />
    </div>
  );
}