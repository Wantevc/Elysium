export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { deleteTemplate } from "../_store";

export async function POST(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });
    const ok = await deleteTemplate(id);
    return NextResponse.json({ ok }, { headers: { "Cache-Control": "no-store" } });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
