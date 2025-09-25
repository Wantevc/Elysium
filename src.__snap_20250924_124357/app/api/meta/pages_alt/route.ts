import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
// Fallback: lijst Pages via debug_token -> granular_scopes.target_ids
export async function GET() {
const session = await getServerSession(authOptions);
 // @ts-expect-error custom
const userToken = session?.accessToken as string | undefined;
if (!userToken) {
return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
}
const appId = process.env.FACEBOOK_CLIENT_ID!;
const appSecret = process.env.FACEBOOK_CLIENT_SECRET!;
const appToken = `${appId}|${appSecret}`;
// 1) Haal granted scopes + target_ids op
const dbgUrl = new URL("https://graph.facebook.com/v20.0/debug_token");
dbgUrl.searchParams.set("input_token", userToken);
dbgUrl.searchParams.set("access_token", appToken);
 const dbgRes = await fetch(dbgUrl.toString(), { cache: "no-store" });
 const dbg = await dbgRes.json();
const granular = dbg?.data?.granular_scopes ?? [];
const pagesScope = granular.find((g: any) => g.scope === "pages_show_list");
 const pageIds: string[] = pagesScope?.target_ids ?? [];
 // 2) Voor elke Page-ID: haal name + ig-koppeling op
const out: any[] = [];
for (const id of pageIds) {
const pageUrl = new URL(`https://graph.facebook.com/v20.0/${id}`);
pageUrl.searchParams.set("fields", "name,instagram_business_account");
 pageUrl.searchParams.set("access_token", userToken);
const pr = await fetch(pageUrl.toString(), { cache: "no-store" });
const pj = await pr.json();
if (pj?.id) {
 out.push({
id: pj.id,
name: pj.name,
instagram_business_account: pj.instagram_business_account ?? null,
 });
}
 }
 return NextResponse.json({ ok: true, via: "debug_token", count: out.length, data: out });
}

