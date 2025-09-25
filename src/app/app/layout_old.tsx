// src/app/app/layout.tsx
import type { ReactNode } from "react";
import Link from "next/link";

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
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <div className="grid grid-cols-[260px_1fr]">
        {/* Sidebar */}
        <aside className="h-screen sticky top-0 border-r bg-white/90 backdrop-blur flex flex-col">
          <div className="px-5 py-4 border-b">
            <Link href="/app" className="block">
              <div className="text-xl font-bold tracking-tight">AI Social Manager</div>
              <div className="text-xs text-neutral-500">Planner & Calendar</div>
            </Link>
          </div>

          <nav className="p-2 flex-1">
            <ul className="space-y-1">
              {navItems.map((it) => (
                <li key={it.href}>
                  <Link
                    href={it.href}
                    className="block rounded-lg px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                  >
                    {it.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="px-5 py-4 text-xs text-neutral-500">
            <div className="border-t pt-4">v0.1 prototype</div>
          </div>
        </aside>

        {/* Main */}
        <main className="min-h-screen">
          <header className="sticky top-0 z-20 bg-white/70 backdrop-blur border-b">
            <div className="mx-auto max-w-6xl px-5 py-3 flex items-center justify-between">
              <div className="font-semibold">Dashboard</div>
              <div className="text-sm text-neutral-500">
                <span className="hidden sm:inline">Signed in · </span>
                <a href="/api/auth/signout" className="hover:underline">Sign out</a>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-6xl px-5 py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

