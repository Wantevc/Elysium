// src/app/api/schedule/debug/route.ts
import { NextResponse } from "next/server";
import { STORE_ID, STORE_CREATED_AT, getTasks } from "@/lib/taskStore";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const tasks = getTasks();
  return new NextResponse(
    JSON.stringify({ ok: true, STORE_ID, STORE_CREATED_AT, count: tasks.length, sample: tasks.slice(-3) }),
    { status: 200, headers: { "content-type": "application/json", "cache-control": "no-store" } }
  );
}
