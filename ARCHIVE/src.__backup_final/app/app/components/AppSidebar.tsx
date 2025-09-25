"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import { TOKENS } from "./ui";

type NavItem = { href: string; label: string; emoji: string; soon?: boolean };

const NAV: NavItem[] = [
  { href: "/app",                 label: "Home",            emoji: "🏠" },
  { href: "/app/campaign-builder",label: "Campaign Builder",emoji: "📅" },
  { href: "/app/brand-voice",     label: "Brand Voice",     emoji: "🎙️" },
  { href: "/app/offer-visual",    label: "Offer + Visual",  emoji: "🖼️" },
  { href: "/app/publishing",      label: "Publishing",      emoji: "🚀", soon: true }, // Connect+Planner
  { href: "/app/settings",        label: "Settings",        emoji: "⚙️" },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(true);

  useEffect(() => { try { const raw = localStorage.getItem("ui.sidebarOpen"); if (raw !== null) setOpen(raw === "1"); } catch {} }, []);
  useEffect(() => { try { localStorage.setItem("ui.sidebarOpen", open ? "1" : "0"); } catch {} }, [open]);

  return (
    <aside className={`border-r ${TOKENS.BORDER} ${TOKENS.PANEL} backdrop-blur-xl transition-all duration-200 ${open ? "w-60" : "w-14"} relative`}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        title={open ? "Inklappen" : "Uitklappen"}
        className="absolute -right-3 top-3 z-10 h-6 w-6 rounded-full border border-white/10 bg-white/10 hover:bg-white/20 grid place-items-center text-xs text-neutral-200"
      >
        {open ? "«" : "»"}
      </button>

      <div className="p-3 text-sm">
        <div className="mb-3 font-semibold text-neutral-100">{open ? "AI Social Manager" : "AI"}</div>
        <nav className="space-y-1">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-2 py-2 transition
                  ${active ? "bg-white/10 text-neutral-100" : "text-neutral-300 hover:bg-white/5"}`}
                title={item.label}
              >
                <span className="w-5 text-center">{item.emoji}</span>
                {open && (
                  <span className="truncate flex items-center gap-2">
                    {item.label}
                    {item.soon && <span className="text-[10px] rounded-full border border-white/10 px-1.5 py-0.5 text-neutral-300">soon</span>}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}