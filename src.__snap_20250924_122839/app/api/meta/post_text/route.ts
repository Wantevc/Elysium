async function debugTokenInfo(token: string) {
  const appId = process.env.META_APP_ID!;
  const appSecret = process.env.META_APP_SECRET!;
  const appToken = `${appId}|${appSecret}`;
  const url = `https://graph.facebook.com/v20.0/debug_token?input_token=${encodeURIComponent(token)}&access_token=${encodeURIComponent(appToken)}`;
  const r = await fetch(url);
  const j = await r.json().catch(() => ({}));
  return { status: r.status, data: j?.data ?? j };
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const pageId = body?.pageId;
    const message = (body?.message || "").trim();

    if (!pageId) return Response.json({ ok: false, step: "input", error: "missing pageId" }, { status: 400 });
    if (!message) return Response.json({ ok: false, step: "input", error: "missing message" }, { status: 400 });

    const base = process.env.CRON_SELF_BASE_URL || "http://localhost:3000";

    // cookies meegeven zodat /api/meta/page_token dezelfde sessie ziet
    const headers: HeadersInit = { "content-type": "application/json" };
    // @ts-ignore
    const cookie = (req.headers as any).get?.("cookie") || (req as any).headers?.cookie;
    if (cookie) (headers as any).cookie = cookie;

    // 1) Page Access Token ophalen
    const tokRes = await fetch(`${base}/api/meta/page_token?page_id=${encodeURIComponent(pageId)}`, { headers, cache: "no-store" });
    const tok = await tokRes.json().catch(() => ({}));
    if (!tokRes.ok || !tok?.ok) {
      return Response.json({ ok: false, step: "page_token", error: tok?.error || `status ${tokRes.status}` }, { status: 400 });
    }
    const pageToken: string = tok.pageAccessToken;

    // 1b) DEBUG: laat zien wat voor token we gaan gebruiken
    const dbg = await debugTokenInfo(pageToken);
    if (!dbg?.data?.is_valid) {
      return Response.json({ ok: false, step: "token_debug", using_token_first12: pageToken.slice(0,12), debug: dbg }, { status: 400 });
    }

    // 2) Post naar Graph API met exact dát page token
    const fbRes = await fetch(`https://graph.facebook.com/v20.0/${encodeURIComponent(pageId)}/feed`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message, access_token: pageToken }),
    });
    const fb = await fbRes.json().catch(() => ({}));

    if (!fbRes.ok || fb?.error) {
      return Response.json({
        ok: false,
        step: "graph_post",
        using_token_first12: pageToken.slice(0,12),
        debug: dbg,
        data: fb,
        status: fbRes.status
      }, { status: 400 });
    }

    // 3) Permalink ophalen
    let permalink: string | undefined;
    try {
      const pRes = await fetch(`https://graph.facebook.com/v20.0/${fb.id}?fields=permalink_url&access_token=${encodeURIComponent(pageToken)}`);
      const p = await pRes.json();
      if (p?.permalink_url) permalink = p.permalink_url;
    } catch {}

    return Response.json({
      ok: true,
      postId: fb.id,
      permalink,
      using_token_first12: pageToken.slice(0,12),
      debug: dbg
    });
  } catch (e: any) {
    return Response.json({ ok: false, step: "server", error: e?.message || "unknown_error" }, { status: 500 });
  }
}