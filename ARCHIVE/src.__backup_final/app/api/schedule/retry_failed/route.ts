export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { readTasks, updateTask } from "../_store";

const MAX_RETRIES = 5;

export async function POST() {
  try {
    const all = await readTasks();
    const failed = all.filter((t: any) => t.status === "failed" && Number(t.retryCount || 0) < MAX_RETRIES);

    for (const t of failed) {
      await updateTask(t.id, {
        status: "failed",
        nextAttemptAt: new Date().toISOString(),
      } as any);
    }

    return NextResponse.json(
      { ok: true, count: failed.length },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}