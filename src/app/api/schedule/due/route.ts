export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { readTasks } from "../_store";

export async function GET() {
  const tasks = await readTasks();
  const now = Date.now();
  const due = tasks.filter(
    (t) => t.status === "scheduled" && new Date(t.scheduledAt).getTime() <= now
  );
  return NextResponse.json({ ok: true, due }, { headers: { "Cache-Control": "no-store" } });
}
