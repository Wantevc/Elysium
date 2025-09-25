"use client";

import React from "react";
import Link from "next/link";

/** Black & Gold theme tokens */
const BG = "bg-neutral-950";                  // diepmat zwart
const PANEL = "bg-white/5";                   // glasachtig paneel
const BORDER = "border-white/10";
const TEXT = "text-neutral-200";
const SUBTLE = "text-neutral-400";
const GOLD_TXT = "text-amber-400";            // goud accenten (tekst)
const GOLD_BG = "bg-amber-400/20";            // goud shimmer vlakken
const SILVER_TXT = "text-neutral-300";        // zilverachtig tekst
const RING = "ring-1 ring-white/10";
const SHADOW = "shadow-[0_0_40px_rgba(255,255,255,0.05)]";

/* ---------- UI helpers ---------- */
function GlowButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`relative overflow-hidden rounded-xl px-4 py-2 text-sm font-semibold ${TEXT} ${RING}
      border border-white/10 bg-gradient-to-br from-neutral-900 to-neutral-800 hover:from-neutral-800 hover:to-neutral-700
      transition-all hover:shadow-[0_0_40px_rgba(255,215,0,0.15)]`}
    >
      <span className="relative z-10">{props.children}</span>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-amber-300/10 opacity-0 transition-opacity hover:opacity-100"
      />
    </button>
  );
}

function GoldCTA(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`relative overflow-hidden rounded-xl px-5 py-2 text-sm font-semibold text-neutral-900
      bg-amber-400 hover:bg-amber-300 transition-all ${SHADOW}`}
    >
      <span className="relative z-10">{props.children}</span>
      <span aria-hidden className="absolute inset-0 bg-white/20 opacity-0 hover:opacity-20" />
    </button>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
  href,
}: {
  icon: string;
  title: string;
  desc: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={`group ${PANEL} ${BORDER} ${RING} rounded-2xl p-5 border ${SHADOW} backdrop-blur-xl
      transition hover:-translate-y-0.5 hover:shadow-[0_0_60px_rgba(255,215,0,0.08)]`}
    >
      <div className="flex items-center justify-between">
        <div className="text-2xl">{icon}</div>
        <div className={`h-8 w-8 rounded-full ${GOLD_BG} blur-sm opacity-70 group-hover:opacity-100 transition`} />
      </div>
      <div className={`mt-3 text-lg font-semibold ${TEXT}`}>{title}</div>
      <div className={`text-sm ${SUBTLE}`}>{desc}</div>
      <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-amber-300">
        Openen <span>→</span>
      </div>
    </Link>
  );
}

/* ---------- Page ---------- */
export default function StyleBlackGoldPage() {
  return (
    <div className={`min-h-[100svh] ${BG} relative`}>
      {/* achtergrond deco */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-[28rem] w-[56rem] -translate-x-1/2 rounded-full
                      bg-amber-200/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-1/3 h-[22rem] w-[44rem] rounded-full
                      bg-white/5 blur-3xl" />

      {/* topbar */}
      <header className={`sticky top-0 z-10 ${PANEL} ${BORDER} border-b backdrop-blur-xl`}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg border border-white/10 bg-white/10 grid place-items-center font-bold text-neutral-100">
              AI
            </div>
            <div className={`font-semibold ${TEXT}`}>AI Social Manager</div>
            <span className="ml-2 hidden rounded-full border border-white/10 px-2 py-0.5 text-xs text-neutral-300 sm:inline">
              Premium
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs">
              <span className={SILVER_TXT}>Credits:</span>{" "}
              <span className={GOLD_TXT}>120</span>
            </div>
            <GoldCTA>Upgrade</GoldCTA>
          </div>
        </div>
      </header>

      {/* hero */}
      <section className="mx-auto max-w-6xl px-5 pt-10">
        <div className={`${PANEL} ${BORDER} ${RING} rounded-3xl p-8 sm:p-10 backdrop-blur-xl ${SHADOW}`}>
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className={`text-3xl font-bold tracking-tight ${TEXT}`}>
                Luxe marketing met <span className={GOLD_TXT}>AI</span>
              </h1>
              <p className={`mt-2 max-w-xl text-sm ${SUBTLE}`}>
                Zwart-goud esthetiek, glasachtige panelen en premium interacties.
                Bouw campagnes, definieer je brandstem en maak fotorealistische visuals.
              </p>
              <div className="mt-5 flex gap-2">
                <GoldCTA>Start gratis</GoldCTA>
                <GlowButton>Bekijk demo</GlowButton>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                ["📈", "Campagnes", "Strategie & planning"],
                ["🎙️", "Brand voice", "Consistente tone"],
                ["🖼️", "Visuals", "Fotorealisme + logo"],
              ].map(([icon, title, tag]) => (
                <div key={title} className={`${PANEL} ${BORDER} rounded-xl p-4 backdrop-blur-xl`}>
                  <div className="text-2xl">{icon}</div>
                  <div className={`mt-1 text-sm font-semibold ${TEXT}`}>{title}</div>
                  <div className={`text-[11px] ${SUBTLE}`}>{tag}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* features */}
      <section className="mx-auto max-w-6xl px-5 py-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon="📅"
            title="Campaign Builder"
            desc="2 posts/week · 4 weken · platform-specifiek. Sla op in je map."
            href="/app/campaign-builder"
          />
          <FeatureCard
            icon="🎙️"
            title="Brand Voice"
            desc="Templates, captions, slogans en hashtags op maat."
            href="/app/brand-voice"
          />
          <FeatureCard
            icon="🖼️"
            title="Offer + Visual"
            desc="AI-foto + tekst op beeld + logo. Download direct."
            href="/app/offer-visual"
          />
          <FeatureCard
            icon="🧭"
            title="Planner"
            desc="Queue & heatmap. Post naar FB/IG in één flow."
            href="/app/planner"
          />
          <FeatureCard
            icon="🔗"
            title="Connect"
            desc="Koppel Facebook & Instagram veilig."
            href="/app/connect"
          />
          <FeatureCard
            icon="⚙️"
            title="Settings"
            desc="Wallet & hashtag sets beheren."
            href="/app/settings"
          />
        </div>
      </section>

      {/* trust */}
      <section className="mx-auto max-w-6xl px-5 pb-14">
        <div className={`${PANEL} ${BORDER} rounded-2xl p-6 backdrop-blur-xl`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className={`text-sm font-semibold ${TEXT}`}>Waarom AI Social Manager?</div>
              <div className={`text-xs ${SUBTLE}`}>
                Enterprise security · Transparante credits · Consistente resultaten
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-emerald-300">✓ SSL</div>
              <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-emerald-300">✓ Privacy</div>
              <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-emerald-300">✓ 24/7</div>
            </div>
          </div>
        </div>
      </section>

      {/* footer */}
      <footer className={`${PANEL} ${BORDER} border-t backdrop-blur-xl`}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 text-xs">
          <div className={SILVER_TXT}>© {new Date().getFullYear()} AI Social Manager</div>
          <div className="flex gap-4">
            <a className={`${SUBTLE} hover:text-neutral-200`} href="#">Terms</a>
            <a className={`${SUBTLE} hover:text-neutral-200`} href="#">Privacy</a>
            <a className={`${SUBTLE} hover:text-neutral-200`} href="#">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}