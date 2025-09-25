import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
async function getPageTokenViaMeAccounts(userToken: string, pageId: string) {
const url = new URL("https://graph.facebook.com/v20.0/me/accounts");
url.searchParams.set("fields", "id,name,access_token");
url.searchParams.set("access_token", userToken);
const r = await fetch(url.toString(), { cache: "no-store" });
const j = await r.json();
const hit = j?.data?.find((p: any) => p?.id === pageId);
return hit?.access_token || null;
}
export async function GET(req: Request) {
const { searchParams } = new URL(req.url);
const pageId = searchParams.get("page_id");
 let pageToken = searchParams.get("access_token"); // optioneel via query
 if (!pageId) return NextResponse.json({ error: "Missing page_id" }, { status: 400 });
const session = await getServerSession(authOptions);
 // @ts-expect-error custom
const userToken = session?.accessToken as string | undefined;
if (!userToken) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
// Zorg dat we een page token hebben
if (!pageToken) {
pageToken = await getPageTokenViaMeAccounts(userToken, pageId);
if (!pageToken) {
return NextResponse.json({ error: "No page access token found" }, { status: 400 });
}
}
const tries: Array<{ kind: string; url: string }> = [];
 // Try 1: /{page_id}/instagram_accounts
{
const u = new URL(`https://graph.facebook.com/v20.0/${pageId}/instagram_accounts`);
 u.searchParams.set("fields", "id,username");
u.searchParams.set("access_token", pageToken!);
tries.push({ kind: "instagram_accounts", url: u.toString() });
}
// Try 2: /{page_id}?fields=connected_instagram_account
{
const u = new URL(`https://graph.facebook.com/v20.0/${pageId}`);
u.searchParams.set("fields", "connected_instagram_account");
u.searchParams.set("access_token", pageToken!);
tries.push({ kind: "connected_instagram_account", url: u.toString() });
}
 // Try 3: /{page_id}?fields=instagram_business_account (kan extra rechten eisen)
{
const u = new URL(`https://graph.facebook.com/v20.0/${pageId}`);
 u.searchParams.set("fields", "instagram_business_account");
u.searchParams.set("access_token", pageToken!);
tries.push({ kind: "instagram_business_account", url: u.toString() });
}
const results: any[] = [];
for (const t of tries) {
const r = await fetch(t.url, { cache: "no-store" });
const j = await r.json();
results.push({ kind: t.kind, ok: r.ok, status: r.status, data: j });
 if (r.ok) {
// normalize: haal IG id/username eruit als aanwezig
let igId: string | null = null;
 let username: string | null = null;
if (t.kind === "instagram_accounts") {
const acc = j?.data?.[0];
igId = acc?.id ?? null;
 username = acc?.username ?? null;
} else if (t.kind === "connected_instagram_account") {
 igId = j?.connected_instagram_account?.id ?? null;
} else if (t.kind === "instagram_business_account") {
igId = j?.instagram_business_account?.id ?? null;
}
if (igId) {
return NextResponse.json({
ok: true,
via: t.kind,
pageId,
 igId,
username,
debug: results,
});
}
}
}
return NextResponse.json({ ok: false, pageId, debug: results }, { status: 400 });
}
