import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  // @ts-expect-error custom
  const userToken = session?.accessToken as string | undefined;
  if (!userToken) return NextResponse.json({ ok: false, step: "auth", error: "Not authenticated" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const pageId = searchParams.get("page_id");
  if (!pageId) return NextResponse.json({ ok: false, step: "args", error: "Missing page_id" }, { status: 400 });

  // 1) Page token
  const turl = new URL(`https://graph.facebook.com/v20.0/${pageId}`);
  turl.searchParams.set("fields", "access_token");
  turl.searchParams.set("access_token", userToken);
  const tr = await fetch(turl.toString(), { cache: "no-store" });
  const tj = await tr.json().catch(() => ({}));
  if (!tr.ok || !tj?.access_token) return NextResponse.json({ ok: false, step: "get_page_token", status: tr.status, data: tj }, { status: 400 });
  const pageToken = tj.access_token as string;

  // 2) IG business account ophalen
  const iurl = new URL(`https://graph.facebook.com/v20.0/${pageId}`);
  iurl.searchParams.set("fields", "instagram_business_account{name,username,id}");
  iurl.searchParams.set("access_token", pageToken);
  const ir = await fetch(iurl.toString(), { cache: "no-store" });
  const ij = await ir.json().catch(() => ({}));
  return NextResponse.json({ ok: ir.ok, step: "ig_account", data: ij });
}