export const SITE_NAME = "LuxMark AI"; // verander dit later gemakkelijk
export const DIAMOND_FEATURES = [
  "Pro templates (Diamond-only)",
  "Priority generation",
  "Advanced visual variants",
];
2) Topbar navigatie
A) Maak een nav-component
src/app/app/components/AppTopbar.tsx

tsx
Code kopiëren
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import WalletBadge from "./WalletBadge";
import { SITE_NAME } from "../config";

const nav = [
  { href: "/app/home", label: "Home" },
  { href: "/app/campaign-builder", label: "Campaigns" },
  { href: "/app/brand-voice", label: "Brand Voice" },
  { href: "/app/offer-visual", label: "Offer + Visual" },
  { href: "/app/publishing", label: "Publishing" },
  { href: "/app/settings", label: "Settings" },
];

export default function AppTopbar() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/60 backdrop-blur supports-[backdrop-filter]:bg-black/40">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
        <Link href="/app/home" className="text-lg font-semibold">
          <span className="text-amber-300">★</span> {SITE_NAME}
        </Link>

        <nav className="ml-4 hidden md:flex items-center gap-1">
          {nav.map((i) => {
            const active = path.startsWith(i.href);
            return (
              <Link
                key={i.href}
                href={i.href}
                className={`rounded-lg px-3 py-1.5 text-sm border ${
                  active
                    ? "border-amber-300/40 bg-amber-300/10 text-amber-200"
                    : "border-white/10 text-neutral-200 hover:bg-white/5"
                }`}
              >
                {i.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <WalletBadge />
          <a className="text-sm text-neutral-400 hover:underline" href="/api/auth/signout">Sign out</a>
        </div>
      </div>
    </header>
  );
}