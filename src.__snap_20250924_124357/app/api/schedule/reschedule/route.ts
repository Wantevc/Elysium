export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { updateTask, readTasks } from "../_store";

export async function POST(req: Request) {
  try {
    const { id, scheduledAt } = await req.json();
    if (!id || !scheduledAt) {
      return NextResponse.json({ ok: false, error: "Missing id or scheduledAt" }, { status: 400 });
    }

    const all = await readTasks();
    const exists = all.find(t => t.id === id);
    if (!exists) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    // Normaliseer naar ISO
    const iso = new Date(scheduledAt).toISOString();

    const saved = await updateTask(id, { scheduledAt: iso, status: "scheduled" });
    return NextResponse.json({ ok: true, task: saved }, { headers: { "Cache-Control": "no-store" } });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
