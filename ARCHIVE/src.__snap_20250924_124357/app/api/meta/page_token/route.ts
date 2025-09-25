export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const pageId = searchParams.get("page_id");
    if (!pageId) {
      return Response.json({ ok: false, error: "missing page_id" }, { status: 400 });
    }

    // Belangrijk: we lezen je eigen /api/meta/pages
    // en halen daar de access_token van de juiste page uit.
    const base = process.env.CRON_SELF_BASE_URL || "http://localhost:3000";

    // Cookies en auth headers doorgeven zodat /api/meta/pages weet wie je bent
    const headers: HeadersInit = {};
    // @ts-ignore
    const cookie = (req.headers as any).get?.("cookie") || (req as any).headers?.cookie;
    if (cookie) (headers as any).cookie = cookie;

    const r = await fetch(`${base}/api/meta/pages`, { headers, cache: "no-store" });
    const ct = r.headers.get("content-type") || "";
    if (!ct.includes("application/json")) {
      const text = await r.text();
      return Response.json(
        { ok: false, error: `pages endpoint non-JSON (${r.status}): ${text.slice(0, 200)}` },
        { status: 502 }
      );
    }
    const j = await r.json();

    const list = j?.data?.data ?? [];
    const page = Array.isArray(list) ? list.find((p: any) => String(p?.id) === String(pageId)) : null;
    if (!page) {
      return Response.json({ ok: false, error: "page not found in /api/meta/pages" }, { status: 404 });
    }

    const token = page?.access_token;
    if (!token) {
      return Response.json(
        { ok: false, error: "page has no access_token (check scopes/roles: pages_manage_posts, pages_show_list)" },
        { status: 403 }
      );
    }

    return Response.json({ ok: true, pageId, pageAccessToken: token });
  } catch (e: any) {
    const msg = e?.message || "unknown_error";
    return Response.json({ ok: false, error: msg }, { status: 500 });
  }
}
