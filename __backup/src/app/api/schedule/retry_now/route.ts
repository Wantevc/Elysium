export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { readTasks, updateTask } from "../_store";

export async function POST(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });

    const all = await readTasks();
    const t = all.find((x: any) => x.id === id);
    if (!t) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    const rc = Number(t.retryCount || 0);
    await updateTask(id, {
      status: "failed",                 // blijft 'failed' tot runner hem post
      nextAttemptAt: new Date().toISOString(),  // nu meteen opnieuw proberen
      retryCount: rc,                   // niet verhogen hier; runner doet dat bij echte poging
    } as any);

    return NextResponse.json({ ok: true, id, scheduled: "now" }, { headers: { "Cache-Control": "no-store" } });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}