"use client";

import React from "react";
import Link from "next/link";

/** Luxe kleuren & utility classes (Tailwind) */
const GRAD = "bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600";
const GOLD = "text-amber-400";
const CARD_BG = "bg-white/70 dark:bg-white/10";
const CARD_BORDER = "border-white/40 dark:border-white/10";
const GLASS = `${CARD_BG} backdrop-blur-xl border ${CARD_BORDER}`;
const RING = "ring-1 ring-white/30";

/** Kleine helpers */
function GlowButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`relative overflow-hidden rounded-xl px-4 py-2 text-sm font-semibold text-white ${RING}
      transition-all hover:shadow-[0_0_30px_rgba(147,51,234,0.35)]
      ${GRAD}`}
    >
      <span className="relative z-10">{props.children}</span>
      <span
        aria-hidden
        className="absolute inset-0 bg-white/20 opacity-0 transition-opacity hover:opacity-20"
      />
    </button>
  );
}

function FeatureCard({
  emoji,
  title,
  desc,
  href,
}: {
  emoji: string;
  title: string;
  desc: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={`group ${GLASS} rounded-2xl p-5 transition hover:-translate-y-0.5 hover:shadow-xl`}
    >
      <div className="flex items-center justify-between">
        <div className="text-2xl">{emoji}</div>
        <div
          className={`h-8 w-8 rounded-full ${GRAD} opacity-70 blur-sm transition group-hover:opacity-100`}
        />
      </div>
      <div className="mt-3 text-lg font-semibold text-neutral-900">
        {title}
      </div>
      <div className="text-sm text-neutral-600">{desc}</div>
      <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-violet-700">
        Openen <span>→</span>
      </div>
    </Link>
  );
}

export default function StyleDemoPage() {
  return (
    <div className="min-h-[100svh] relative">
      {/* Achtergrond gradient + subtiele glow */}
      <div className={`absolute inset-0 -z-10 ${GRAD}`} />
      <div className="pointer-events-none absolute -top-32 left-1/2 h-80 w-[56rem] -translate-x-1/2 rounded-full
                      bg-white/20 blur-3xl" />

      {/* Topbar */}
      <header className="sticky top-0 z-10 border-b border-white/20 bg-white/40 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-white/70 grid place-items-center font-bold">AI</div>
            <div className="font-semibold text-neutral-900">AI Social Manager</div>
            <span className={`ml-2 hidden rounded-full px-2 py-0.5 text-xs ${RING} text-white sm:inline`}>
              Beta
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-full border border-white/40 bg-white/60 px-3 py-1 text-xs text-neutral-800">
              Credits: <span className={GOLD}>120</span>
            </div>
            <GlowButton>Upgrade</GlowButton>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-5 pt-10">
        <div className={`${GLASS} rounded-3xl p-8 sm:p-10`}>
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
                Boost je marketing met <span className={GOLD}>AI</span>
              </h1>
              <p className="mt-1 text-sm text-neutral-700 max-w-xl">
                Luxe, modern en efficiënt. Bouw campagnes, vind jouw brand-stem en maak
                fotorealistische visuals — allemaal in één plek.
              </p>
              <div className="mt-4 flex gap-2">
                <GlowButton>Start gratis</GlowButton>
                <button className="rounded-xl border border-white/40 bg-white/70 px-4 py-2 text-sm text-neutral-800 hover:bg-white/80">
                  Bekijk demo
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                ["📈", "Campagnes", "Premium strategieën"],
                ["🎙️", "Brand voice", "Consistente tone of voice"],
                ["🖼️", "Visuals", "Fotorealistische beelden"],
              ].map(([icon, title, tag]) => (
                <div key={title} className={`${GLASS} rounded-xl p-4`}>
                  <div className="text-2xl">{icon}</div>
                  <div className="mt-1 text-sm font-semibold text-neutral-900">{title}</div>
                  <div className="text-[11px] text-neutral-600">{tag}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="mx-auto max-w-6xl px-5 py-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            emoji="📅"
            title="Campaign Builder"
            desc="2 posts/week · 4 weken · platform-specifiek. Sla op in je map."
            href="/app/campaign-builder"
          />
          <FeatureCard
            emoji="🎙️"
            title="Brand Voice"
            desc="Templates, captions, slogans en hashtags — volledig op maat."
            href="/app/brand-voice"
          />
          <FeatureCard
            emoji="🖼️"
            title="Offer + Visual"
            desc="AI-foto + tekst op beeld + logo. Download in één klik."
            href="/app/offer-visual"
          />
          <FeatureCard
            emoji="🧭"
            title="Planner"
            desc="Queue & heatmap. Post naar FB/IG vanuit één plek."
            href="/app/planner"
          />
          <FeatureCard
            emoji="🔗"
            title="Connect"
            desc="Koppel je Facebook & Instagram veilig en snel."
            href="/app/connect"
          />
          <FeatureCard
            emoji="⚙️"
            title="Settings"
            desc="Wallet & hashtag sets. Beheer je account."
            href="/app/settings"
          />
        </div>
      </section>

      {/* Trust / social proof */}
      <section className="mx-auto max-w-6xl px-5 pb-14">
        <div className={`${GLASS} rounded-2xl p-6`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="text-neutral-800">
              <div className="text-sm font-semibold">Waarom AI Social Manager?</div>
              <div className="text-xs text-neutral-600">
                Enterprise-grade beveiliging · Transparante credits · Consistente resultaten
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">✓ SSL</div>
              <div className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">✓ Privacy-vriendelijk</div>
              <div className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">✓ 24/7</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/20 bg-white/30 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 text-xs text-neutral-700">
          <div>© {new Date().getFullYear()} AI Social Manager</div>
          <div className="flex gap-4">
            <a className="hover:underline" href="#">Terms</a>
            <a className="hover:underline" href="#">Privacy</a>
            <a className="hover:underline" href="#">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}