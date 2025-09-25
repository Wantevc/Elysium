import "../globals.css";
import React from "react";

export const metadata = {
  title: "AI Social Manager",
  description: "Marketing met AI",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body className="min-h-screen bg-neutral-950 text-neutral-100 antialiased">
        <main className="mx-auto max-w-6xl px-6 py-8">
          <div className="rounded-2xl border border-amber-300/20 bg-black/60 shadow-lg p-6">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}