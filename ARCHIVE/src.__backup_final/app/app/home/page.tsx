export default function HomeGold() {
  return (
    <>
      <h1 className="h1">Welkom 👋</h1>
      <p className="sub">Kies een module om te starten.</p>

      <div className="row">
        <section className="card">
          <h3>Campaign Builder</h3>
          <p>2 posts/week · 4 weken · platform-specifiek.</p>
          <div className="actions">
            <a className="btn" href="/app/campaign-builder">Openen →</a>
            <a className="btn btn-outline" href="/app/campaign-builder?demo=1">Demo</a>
          </div>
        </section>

        <section className="card">
          <h3>Brand Voice</h3>
          <p>Templates, captions, slogans & hashtags op maat.</p>
          <div className="actions">
            <a className="btn" href="/app/brand-voice">Openen →</a>
            <a className="btn btn-outline" href="/app/brand-voice?demo=1">Demo</a>
          </div>
        </section>

        <section className="card">
          <h3>Offer + Visual</h3>
          <p>AI-foto + tekst op beeld + logo.</p>
          <div className="actions">
            <a className="btn" href="/app/offer-visual">Openen →</a>
            <a className="btn btn-outline" href="/app/offer-visual?demo=1">Demo</a>
          </div>
        </section>

        <section className="card">
          <h3>Publishing</h3>
          <p>Connect + Planner (coming soon).</p>
          <div className="actions">
            <a className="btn btn-outline" href="/app/publishing">Openen →</a>
          </div>
        </section>

        <section className="card">
          <h3>Settings</h3>
          <p>Wallet en hashtag sets beheren.</p>
          <div className="actions">
            <a className="btn btn-outline" href="/app/settings">Openen →</a>
          </div>
        </section>
      </div>
    </>
  );
}