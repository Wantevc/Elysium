"use client";

import PageShell from "../components/PageShell";
import { Card, SectionTitle, TOKENS } from "../components/ui";

export default function HomePage() {
  return (
    <PageShell title="Welcome at AI Social Manager" desc="Where marketing has no limits.">
      <Card>
        <SectionTitle title="Start here" desc="Kies wat je wil bouwen vandaag." />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <a href="/app/campaign-builder" className="rounded-xl border border-white/10 p-4 hover:bg-white/5">
            <div className="font-semibold mb-1">Campaign Builder</div>
            <div className={`text-sm ${TOKENS.SUBTLE}`}>Volledige 30-dagen campagne.</div>
          </a>
          <a href="/app/brand-voice" className="rounded-xl border border-white/10 p-4 hover:bg-white/5">
            <div className="font-semibold mb-1">Brand Voice</div>
            <div className={`text-sm ${TOKENS.SUBTLE}`}>Templates, captions, slogans, hashtags.</div>
          </a>
          <a href="/app/offer-visual" className="rounded-xl border border-white/10 p-4 hover:bg-white/5">
            <div className="font-semibold mb-1">Offer + Visual</div>
            <div className={`text-sm ${TOKENS.SUBTLE}`}>Promobeelden met logo & stijl.</div>
          </a>
          <a href="/app/packs" className="rounded-xl border border-white/10 p-4 hover:bg-white/5">
            <div className="font-semibold mb-1">Packs</div>
            <div className={`text-sm ${TOKENS.SUBTLE}`}>Koop of upgrade je credits/plan.</div>
          </a>
          <a href="/app/settings" className="rounded-xl border border-white/10 p-4 hover:bg-white/5">
            <div className="font-semibold mb-1">Settings</div>
            <div className={`text-sm ${TOKENS.SUBTLE}`}>Wallet, voorkeuren, koppelingen.</div>
          </a>
          <a href="/app/publishing" className="rounded-xl border border-white/10 p-4 hover:bg-white/5">
            <div className="font-semibold mb-1">Publishing</div>
            <div className={`text-sm ${TOKENS.SUBTLE}`}>Planner & Connect — Coming Soon.</div>
          </a>
        </div>
      </Card>
    </PageShell>
  );
}