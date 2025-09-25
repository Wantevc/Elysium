// src/app/api/ping/route.ts
import { NextResponse } from "next/server";
import { STORE_ID, STORE_CREATED_AT, getTasks } from "@/lib/taskStore";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return new NextResponse(
    JSON.stringify({
      ok: true,
      ping: "pong",
      runtime,
      STORE_ID,
      STORE_CREATED_AT,
      tasksCount: getTasks().length,
      now: new Date().toISOString(),
    }),
    { status: 200, headers: { "content-type": "application/json", "cache-control": "no-store" } }
  );
}
