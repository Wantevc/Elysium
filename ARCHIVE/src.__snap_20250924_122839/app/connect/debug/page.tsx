export default function ConnectDebugPage() {
  const qs = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const token = qs?.get('token') ?? '';
  const id    = qs?.get('id') ?? '';
  const name  = qs?.get('name') ?? '';

  let stored = '';
  if (typeof window !== 'undefined') {
    try { stored = localStorage.getItem('page') ?? ''; } catch {}
  }

  return (
    <main style={{padding:16, fontFamily:'monospace', whiteSpace:'pre-wrap'}}>
      <h1>/app/connect/debug</h1>

      <h2>Query params</h2>
      <div>id: {id}</div>
      <div>name: {name}</div>
      <div>token length: {token.length}</div>
      <div>token first 12: {token ? token.slice(0,12) + '…' : '(none)'}</div>

      <h2 style={{marginTop:16}}>localStorage["page"]</h2>
      <div>{stored || '(none)'}</div>

      <p style={{marginTop:16}}>
        Tip: doorloop eerst <code>/app/connect</code> → na OAuth kopieer je de volledige URL met
        <code>?picked=1&id=...&name=...&token=...</code> en plak je die achter <code>/app/connect/debug</code>.
      </p>
    </main>
  );
}