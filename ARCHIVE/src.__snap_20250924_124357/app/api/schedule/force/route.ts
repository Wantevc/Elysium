import { NextRequest, NextResponse } from "next/server";
import { findTask } from "../../../../lib/taskStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/schedule/force  { id: "<taskId>" } */
export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });

    const t = findTask(id);
    if (!t) return NextResponse.json({ ok: false, error: "Task not found" }, { status: 404 });

    t.status = "posted";
    t.result = {
      ok: true,
      kind: `${t.platform}_${t.type}`,
      postedAt: new Date().toISOString(),
      note: "forced",
    };
    t.error = null;

    return NextResponse.json({ ok: true, task: t }, { headers: { "cache-control": "no-store" } });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
