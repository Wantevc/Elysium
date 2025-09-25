import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
export async function GET() {
const session = await getServerSession(authOptions);
// @ts-expect-error custom
const userToken = session?.accessToken as string | undefined;
if (!userToken) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
const appId = process.env.FACEBOOK_CLIENT_ID!;
 const appSecret = process.env.FACEBOOK_CLIENT_SECRET!;
const appToken = `${appId}|${appSecret}`;
const url = new URL("https://graph.facebook.com/v20.0/debug_token");
url.searchParams.set("input_token", userToken);
 url.searchParams.set("access_token", appToken);
const r = await fetch(url.toString(), { cache: "no-store" });
const data = await r.json();
return NextResponse.json({ ok: r.ok, status: r.status, data });
}
