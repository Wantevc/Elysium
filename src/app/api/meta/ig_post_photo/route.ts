export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const GRAPH = "https://graph.facebook.com/v20.0";
const j = (data: any, status = 200) =>
  NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

export async function POST(req: Request) {
  try {
    const { pageId, imageUrl, caption } = await req.json().catch(() => ({}));
    if (!pageId || !imageUrl) {
      return j({ ok: false, step: "args", error: "Missing pageId or imageUrl" }, 400);
    }

    // 0) User token uit sessie
    const session = await getServerSession(authOptions as any);
    const userToken =
      (session as any)?.accessToken ||
      (session as any)?.token?.accessToken ||
      (session as any)?.user?.accessToken ||
      null;
    if (!userToken) return j({ ok: false, step: "auth", error: "Missing Facebook user token" }, 401);

    // 1) Page access token
    let r = await fetch(
      `${GRAPH}/${encodeURIComponent(pageId)}?fields=access_token&access_token=${encodeURIComponent(userToken)}`
    );
    let jj = await r.json();
    const pageToken = jj?.access_token;
    if (!r.ok || !pageToken) return j({ ok: false, step: "page_token", status: r.status, data: jj }, 400);

    // 2) IG user id
    r = await fetch(
      `${GRAPH}/${encodeURIComponent(pageId)}?fields=instagram_business_account{id,username}&access_token=${encodeURIComponent(pageToken)}`
    );
    jj = await r.json();
    const igUserId = jj?.instagram_business_account?.id;
    if (!r.ok || !igUserId) return j({ ok: false, step: "ig_user", status: r.status, data: jj }, 400);

    // 3) Container maken
    const form = new URLSearchParams();
    form.set("image_url", imageUrl);
    if (caption) form.set("caption", caption);
    r = await fetch(`${GRAPH}/${igUserId}/media?access_token=${encodeURIComponent(pageToken)}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
    jj = await r.json();
    const creationId = jj?.id;
    if (!r.ok || !creationId) return j({ ok: false, step: "create_container", status: r.status, data: jj }, 400);

    // 4) Publiceren
    const pub = new URLSearchParams();
    pub.set("creation_id", creationId);
    r = await fetch(`${GRAPH}/${igUserId}/media_publish?access_token=${encodeURIComponent(pageToken)}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: pub.toString(),
    });
    jj = await r.json();
    const mediaId = jj?.id;
    if (!r.ok || !mediaId) return j({ ok: false, step: "publish", status: r.status, data: jj }, 400);

    // 5) Permalink ophalen (IG kan paar sec. nodig hebben) — we pollen kort
    let permalink: string | undefined;
    for (let i = 0; i < 8; i++) {
      try {
        const pr = await fetch(
          `${GRAPH}/${encodeURIComponent(mediaId)}?fields=permalink&access_token=${encodeURIComponent(pageToken)}`
        );
        const pj = await pr.json();
        if (pr.ok && pj?.permalink) {
          permalink = pj.permalink;
          break;
        }
      } catch {}
      await sleep(1200);
    }

    return j({ ok: true, igUserId, mediaId, permalink });
  } catch (e: any) {
    return j({ ok: false, error: String(e?.message || e) }, 500);
  }
}
