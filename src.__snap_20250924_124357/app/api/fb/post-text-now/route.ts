// src/app/api/fb/post-text-now/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/fb/post-text-now
 * body: { pageId: string, pageToken: string, message: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { pageId, pageToken, message } = await req.json();
    if (!pageId || !pageToken || !message) {
      return NextResponse.json({ ok: false, error: "Missing pageId/pageToken/message" });
    }

    const endpoint = `https://graph.facebook.com/v20.0/${encodeURIComponent(pageId)}/feed`;
    const body = new URLSearchParams();
    body.set("message", message);
    body.set("access_token", pageToken);

    const r = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const j = await r.json().catch(() => ({}));

    if (!r.ok) {
      // ⚠️ Belangrijk: geef 200 terug met ok:false, zodat PowerShell niet crasht
      return NextResponse.json({
        ok: false,
        error: j?.error?.message || `Graph error ${r.status}`,
        raw: j,
        status: r.status,
      });
    }
    return NextResponse.json({ ok: true, raw: j });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) });
  }
}
