import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
export async function GET() {
const session = await getServerSession(authOptions);
// @ts-expect-error custom
 const userToken = session?.accessToken as string | undefined;
if (!userToken) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
// 1) Debug token -> granular_scopes -> target_ids (Page IDs)
const appId = process.env.FACEBOOK_CLIENT_ID!;
const appSecret = process.env.FACEBOOK_CLIENT_SECRET!;
const appToken = `${appId}|${appSecret}`;
const dbgUrl = new URL("https://graph.facebook.com/v20.0/debug_token");
dbgUrl.searchParams.set("input_token", userToken);
dbgUrl.searchParams.set("access_token", appToken);
const dbgRes = await fetch(dbgUrl.toString(), { cache: "no-store" });
const dbg = await dbgRes.json();
const granular = dbg?.data?.granular_scopes ?? [];
const pagesScope = granular.find((g: any) => g.scope === "pages_show_list");
const pageIds: string[] = pagesScope?.target_ids ?? [];
// 2) Probeer voor elk ID de naam op te halen; als dat niet lukt, geef alleen het ID terug
const out: Array<{ id: string; name: string | null }> = [];
for (const id of pageIds) {
let name: string | null = null;
try {
const url = new URL(`https://graph.facebook.com/v20.0/${id}`);
url.searchParams.set("fields", "name");
url.searchParams.set("access_token", userToken);
const r = await fetch(url.toString(), { cache: "no-store" });
const j = await r.json();
if (r.ok && j?.name) name = j.name as string;
} catch {}
out.push({ id, name });
}
return NextResponse.json({ ok: true, count: out.length, data: out, raw: { scopes: dbg?.data?.scopes, granular } });
}
