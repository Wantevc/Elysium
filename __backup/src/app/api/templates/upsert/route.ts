export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { upsertTemplate } from "../_store";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const saved = await upsertTemplate(body);
    return NextResponse.json({ ok: true, template: saved }, { headers: { "Cache-Control": "no-store" } });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}