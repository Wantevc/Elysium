export default function HomeGold() {
  return (
    <>
      <h1 className="h1">Welcome 👋</h1>
      <p className="sub">Choose a module to get started.</p>

      <div className="row">
        <section className="card">
          <h3>Campaign Builder</h3>
          <p>2 posts/week · 4 weeks · platform-specific.</p>
          <div className="actions">
            <a className="btn" href="/app/campaign-builder">Open →</a>
            <a className="btn btn-outline" href="/app/campaign-builder?demo=1">Demo</a>
          </div>
        </section>

        <section className="card">
          <h3>Brand Voice</h3>
          <p>Templates, captions, slogans & tailored hashtags.</p>
          <div className="actions">
            <a className="btn" href="/app/brand-voice">Open →</a>
            <a className="btn btn-outline" href="/app/brand-voice?demo=1">Demo</a>
          </div>
        </section>

        <section className="card">
          <h3>Offer + Visual</h3>
          <p>AI photo + text on image + logo.</p>
          <div className="actions">
            <a className="btn" href="/app/offer-visual">Open →</a>
            <a className="btn btn-outline" href="/app/offer-visual?demo=1">Demo</a>
          </div>
        </section>

        <section className="card">
          <h3>Publishing</h3>
          <p>Connect + Planner (coming soon).</p>
          <div className="actions">
            <a className="btn btn-outline" href="/app/publishing">Open →</a>
          </div>
        </section>

        <section className="card">
          <h3>Settings</h3>
          <p>Manage wallet and hashtag sets.</p>
          <div className="actions">
            <a className="btn btn-outline" href="/app/settings">Open →</a>
          </div>
        </section>
      </div>
    </>
  );
}