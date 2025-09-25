"use client";
import type { ReactNode } from "react";
import Link from "next/link";
import { useEffect, useState } from "react";

export const dynamic = "force-dynamic";

const navItems = [
  { href: "/app", label: "Home" },
  { href: "/app/planner", label: "Planner" },
  { href: "/app/calendar", label: "Calendar" },
  { href: "/app/templates", label: "Templates" },
  { href: "/app/connect", label: "Connect" },
  { href: "/app/settings", label: "Settings" },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  // laden/bewaren van de laatst gebruikte staat
  useEffect(() => {
    try { setOpen(localStorage.getItem("ui.sidebarOpen") === "1"); } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem("ui.sidebarOpen", open ? "1" : "0"); } catch {}
  }, [open]);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/70 backdrop-blur border-b">
        <div className="mx-auto max-w-6xl px-5 py-3 flex items-center gap-3">
          <button
            aria-label="Open menu"
            onClick={() => setOpen(true)}
            className="rounded-lg border px-3 py-2 text-sm hover:bg-neutral-900 hover:text-white transition"
          >
            ☰
          </button>
          <Link href="/app" className="font-semibold">AI Social Manager</Link>
          <div className="ml-auto text-sm text-neutral-500">
            <a href="/api/auth/signout" className="hover:underline">Sign out</a>
          </div>
        </div>
      </header>

      {/* Slide-over Drawer */}
      <div className={ixed inset-0 z-40 }>
        {/* Backdrop */}
        <div
          className={bsolute inset-0 bg-black/30 transition-opacity }
          onClick={() => setOpen(false)}
        />
        {/* Panel */}
        <aside
          className={bsolute left-0 top-0 h-full w-[280px] bg-white border-r shadow-xl transform transition-transform }
        >
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <div>
              <div className="text-xl font-bold tracking-tight">Menu</div>
              <div className="text-xs text-neutral-500">Planner & Calendar</div>
            </div>
            <button
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="rounded-lg border px-3 py-1.5 text-sm hover:bg-neutral-900 hover:text-white transition"
            >
              ✕
            </button>
          </div>

          <nav className="p-2 overflow-auto h-[calc(100%-100px)]">
            <ul className="space-y-1">
              {navItems.map((it) => (
                <li key={it.href}>
                  <Link
                    href={it.href}
                    className="block rounded-lg px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                    onClick={() => setOpen(false)}
                  >
                    {it.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="px-5 py-4 text-xs text-neutral-500 border-t">v0.1 prototype</div>
        </aside>
      </div>

      {/* Page content */}
      <div className="mx-auto max-w-6xl px-5 py-6">{children}</div>
    </div>
  );
}
