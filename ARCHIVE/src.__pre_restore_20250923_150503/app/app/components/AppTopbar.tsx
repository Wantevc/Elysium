"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

const nav = [
  { href: "/app/home", label: "Home" },
  { href: "/app/campaign-builder", label: "Campaigns" },
  { href: "/app/brand-voice", label: "Brand Voice" },
  { href: "/app/offer-visual", label: "Offer + Visual" },
  { href: "/app/publishing", label: "Publishing" }, // coming soon
  { href: "/app/settings", label: "Settings" },
  { href: "/app/packs", label: "Packs" },
];

export default function AppTopbar() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/70 backdrop-blur supports-[backdrop-filter]:bg-black/50">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
        <Link href="/app/home" className="text-lg font-semibold">
          <span className="text-amber-300">★</span> AI Social Manager
        </Link>

        <nav className="ml-4 hidden md:flex items-center gap-1">
          {nav.map((i) => {
            const active = path.startsWith(i.href);
            return (
              <Link
                key={i.href}
                href={i.href}
                className={`rounded-lg px-3 py-1.5 text-sm border transition ${
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

        <div className="ml-auto">
          <a className="text-sm text-neutral-400 hover:underline" href="/api/auth/signout">
            Sign out
          </a>
        </div>
      </div>
    </header>
  );
}