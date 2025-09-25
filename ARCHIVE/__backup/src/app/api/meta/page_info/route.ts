import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
export async function GET(req: Request) {
 const { searchParams } = new URL(req.url);
 const pageId = searchParams.get("page_id");
 if (!pageId) return NextResponse.json({ error: "Missing page_id" }, { status: 400 });
const session = await getServerSession(authOptions);
 // @ts-expect-error custom
const userToken = session?.accessToken as string | undefined;
if (!userToken) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
const url = new URL(`https://graph.facebook.com/v20.0/${pageId}`);
url.searchParams.set("fields", "name,instagram_business_account");
url.searchParams.set("access_token", userToken);
const r = await fetch(url.toString(), { cache: "no-store" });
 const data = await r.json();
 return NextResponse.json({ ok: r.ok, status: r.status, data });
}
