export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getPageToken, setPageToken } from "../_tokens";

const GRAPH = "https://graph.facebook.com/v20.0";
const j = (data: any, status = 200) =>
  NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(req: Request) {
  try {
    const { pageId, imageUrl, caption } = await req.json().catch(() => ({}));
    if (!pageId || !imageUrl) {
      return j({ ok: false, step: "args", error: "Missing pageId or imageUrl" }, 400);
    }

    // 0) Probeer eerst een opgeslagen Page Access Token (voor cron/runner)
    let pageToken = await getPageToken(pageId);

    // 1) Zo niet: haal via user-sessie en bewaar meteen (voor later)
    if (!pageToken) {
      const session = await getServerSession(authOptions as any);
      const userToken =
        (session as any)?.accessToken ||
        (session as any)?.token?.accessToken ||
        (session as any)?.user?.accessToken ||
        null;

      if (!userToken) {
        return j({ ok: false, step: "auth", error: "Missing Facebook user token" }, 401);
      }

      const tokRes = await fetch(
        `${GRAPH}/${encodeURIComponent(pageId)}?fields=access_token&access_token=${encodeURIComponent(userToken)}`
      );
      const tokJson = await tokRes.json();
      pageToken = tokJson?.access_token || null;
      if (!tokRes.ok || !pageToken) {
        return j({ ok: false, step: "page_token", status: tokRes.status, data: tokJson }, 400);
      }

      await setPageToken(pageId, pageToken);
    }

    // 2) Post de foto naar de Page
    const form = new URLSearchParams();
    form.set("url", imageUrl);
    if (caption) form.set("caption", caption);

    const postRes = await fetch(
      `${GRAPH}/${encodeURIComponent(pageId)}/photos?access_token=${encodeURIComponent(pageToken)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form.toString(),
      }
    );
    const postJson = await postRes.json();
    if (!postRes.ok || !postJson?.id) {
      return j({ ok: false, step: "post_photo", status: postRes.status, data: postJson }, 400);
    }

    const photoId = postJson.id as string;

    // 3) Best-effort: permalink / post_id ophalen
    let details: any = {};
    try {
      const fields = "permalink_url,post_id,link,from,created_time";
      const perRes = await fetch(
        `${GRAPH}/${encodeURIComponent(photoId)}?fields=${fields}&access_token=${encodeURIComponent(pageToken)}`
      );
      const perJson = await perRes.json();
      if (perRes.ok) details = perJson;
    } catch {}

    return j({
      ok: true,
      photoId,
      post_id: details?.post_id,
      permalink: details?.permalink_url || details?.link,
      details,
    });
  } catch (e: any) {
    return j({ ok: false, error: String(e?.message || e) }, 500);
  }
}