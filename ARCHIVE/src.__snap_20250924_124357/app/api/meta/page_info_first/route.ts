import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
export async function GET() {
const session = await getServerSession(authOptions);
// @ts-expect-error custom
const userToken = session?.accessToken as string | undefined;
if (!userToken) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
// 1) Haal je Pages op met name + access_token (+ IG-koppeling indien aanwezig)
const purl = new URL("https://graph.facebook.com/v20.0/me/accounts");
purl.searchParams.set("fields", "name,access_token,instagram_business_account");
purl.searchParams.set("access_token", userToken);
 const pr = await fetch(purl.toString(), { cache: "no-store" });
const pj = await pr.json();
const page = pj?.data?.[0];
 if (!page) return NextResponse.json({ error: "No pages returned" }, { status: 404 });
if (!page.access_token) {
return NextResponse.json({ error: "No page access token in response", page }, { status: 400 });
}
const pageId = page.id as string;
 const pageToken = page.access_token as string;
 // 2) Page info (met page token): name + instagram_business_account
 const infoUrl = new URL(`https://graph.facebook.com/v20.0/${pageId}`);
infoUrl.searchParams.set("fields", "name,instagram_business_account");
infoUrl.searchParams.set("access_token", pageToken);
const ir = await fetch(infoUrl.toString(), { cache: "no-store" });
 const ij = await ir.json();
// 3) Handige klik-link (zelfde call maar als GET met query)
 const link = `/api/meta/page_info?page_id=${pageId}&access_token=${encodeURIComponent(pageToken)}`;
 return NextResponse.json({
ok: ir.ok,
pageId,
link,
pageInfo: ij,
});
}

