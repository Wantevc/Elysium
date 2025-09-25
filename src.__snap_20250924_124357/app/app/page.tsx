// web/src/app/app/page.tsx
export default function AppHome() {
  const Tile = ({
    title,
    desc,
    href,
  }: { title: string; desc: string; href: string }) => (
    <div className="card">
      <div className="flex items-start justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <span className="badge">Nieuw</span>
      </div>
      <p className="mt-2 text-sm text-neutral-300">{desc}</p>
      <a href={href} className="btn gold mt-4">Openen →</a>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
        Welkom <span className="ml-1">👋</span>
      </h1>
      <p className="text-neutral-300">
        Kies een module om te starten.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        <Tile
          title="Campaign Builder"
          desc="2 posts/week · 4 weken · platform-specifiek."
          href="/app/campaign-builder"
        />
        <Tile
          title="Brand Voice"
          desc="Templates, captions, slogans & hashtags op maat."
          href="/app/brand-voice"
        />
        <Tile
          title="Offer + Visual"
          desc="AI-foto + tekst op beeld + logo."
          href="/app/offer-visual"
        />
        <Tile
          title="Publishing"
          desc="Connect + Planner (coming soon)."
          href="/app/publishing"
        />
        <Tile
          title="Settings"
          desc="Wallet & hashtag sets beheren."
          href="/app/settings"
        />
      </div>
    </div>
  );
}
