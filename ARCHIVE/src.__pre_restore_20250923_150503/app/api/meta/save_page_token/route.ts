export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { setPageToken } from "../_tokens";

const GRAPH = "https://graph.facebook.com/v20.0";
const j = (data: any, status = 200) =>
  NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const pageId = url.searchParams.get("page_id") || url.searchParams.get("pageId");
    if (!pageId) return j({ ok: false, step: "args", error: "Missing page_id" }, 400);

    const session = await getServerSession(authOptions as any);
    const userToken =
      (session as any)?.accessToken ||
      (session as any)?.token?.accessToken ||
      (session as any)?.user?.accessToken ||
      null;
    if (!userToken) return j({ ok: false, step: "auth", error: "Missing Facebook user token (login required)" }, 401);

    // Vraag Page Access Token op m.b.v. user token
    const res = await fetch(
      `${GRAPH}/${encodeURIComponent(pageId)}?fields=access_token&access_token=${encodeURIComponent(userToken)}`
    );
    const json = await res.json();
    const pageToken = json?.access_token;

    if (!res.ok || !pageToken) {
      return j({ ok: false, step: "page_token", status: res.status, data: json }, 400);
    }

    await setPageToken(pageId, pageToken);
    return j({ ok: true, pageId, saved: true });
  } catch (e: any) {
    return j({ ok: false, error: String(e?.message || e) }, 500);
  }
}