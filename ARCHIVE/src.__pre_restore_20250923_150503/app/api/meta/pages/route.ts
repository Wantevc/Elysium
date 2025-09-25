import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

/**
 * Geeft een lijst Pages terug in dezelfde vorm als /me/accounts
 * Fallback:
 *  1) Probeer /me/accounts (name, access_token, instagram_business_account)
 *  2) Als leeg: gebruik debug_token.granular_scopes.pages_show_list.target_ids
 *     - Probeer per ID name + access_token op te halen (best effort)
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  // @ts-expect-error custom
  const userToken = session?.accessToken as string | undefined;
  if (!userToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // 1) Probeer standaardweg /me/accounts
  const meUrl = new URL("https://graph.facebook.com/v20.0/me/accounts");
  meUrl.searchParams.set("fields", "id,name,access_token,instagram_business_account");
  meUrl.searchParams.set("access_token", userToken);

  try {
    const r = await fetch(meUrl.toString(), { cache: "no-store" });
    const j = await r.json();

    if (r.ok && Array.isArray(j?.data) && j.data.length > 0) {
      return NextResponse.json({ ok: true, data: j });
    }
  } catch {
    // negeer; we proberen fallback
  }

  // 2) Fallback via debug_token → page IDs → best-effort velden ophalen
  const appId = process.env.FACEBOOK_CLIENT_ID!;
  const appSecret = process.env.FACEBOOK_CLIENT_SECRET!;
  const appToken = `${appId}|${appSecret}`;

  const dbgUrl = new URL("https://graph.facebook.com/v20.0/debug_token");
  dbgUrl.searchParams.set("input_token", userToken);
  dbgUrl.searchParams.set("access_token", appToken);

  const dbgRes = await fetch(dbgUrl.toString(), { cache: "no-store" });
  const dbg = await dbgRes.json();

  const granular = dbg?.data?.granular_scopes ?? [];
  const ids: string[] =
    granular.find((g: any) => g?.scope === "pages_show_list")?.target_ids ?? [];

  // Niks te doen?
  if (!ids || ids.length === 0) {
    return NextResponse.json({ ok: true, data: { data: [] }, via: "fallback(granular):no-ids" });
  }

  // Best-effort details per Page ID
  const out: Array<{
    id: string;
    name?: string;
    access_token?: string;
    instagram_business_account?: { id: string } | null;
  }> = [];

  for (const id of ids) {
    const item: any = { id };

    // name
    try {
      const nurl = new URL(`https://graph.facebook.com/v20.0/${id}`);
      nurl.searchParams.set("fields", "name");
      nurl.searchParams.set("access_token", userToken);
      const nr = await fetch(nurl.toString(), { cache: "no-store" });
      const nj = await nr.json();
      if (nr.ok && nj?.name) item.name = nj.name;
    } catch {}

    // access_token
    try {
      const turl = new URL(`https://graph.facebook.com/v20.0/${id}`);
      turl.searchParams.set("fields", "access_token");
      turl.searchParams.set("access_token", userToken);
      const tr = await fetch(turl.toString(), { cache: "no-store" });
      const tj = await tr.json();
      if (tr.ok && tj?.access_token) item.access_token = tj.access_token;
    } catch {}

    // instagram_business_account (optioneel; kan extra rechten eisen)
    try {
      const iurl = new URL(`https://graph.facebook.com/v20.0/${id}`);
      iurl.searchParams.set("fields", "instagram_business_account");
      iurl.searchParams.set("access_token", item.access_token || userToken);
      const ir = await fetch(iurl.toString(), { cache: "no-store" });
      const ij = await ir.json();
      if (ir.ok && ij?.instagram_business_account) {
        item.instagram_business_account = ij.instagram_business_account;
      } else {
        item.instagram_business_account = null;
      }
    } catch {
      item.instagram_business_account = null;
    }

    if (!item.name) item.name = `Page ${id}`; // fallback label
    out.push(item);
  }

  // Normaliseer naar dezelfde vorm als /me/accounts
  return NextResponse.json({
    ok: true,
    via: "fallback(granular)",
    data: { data: out },
  });
}