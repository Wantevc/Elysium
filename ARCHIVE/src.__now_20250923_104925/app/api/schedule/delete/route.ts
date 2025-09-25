import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function getStore() {
  let mem = (global as any).__TASKS__;
  if (!Array.isArray(mem)) {
    mem = [];
    (global as any).__TASKS__ = mem;
  }
  return mem as any[];
}

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });

    const MEM = getStore();
    const before = MEM.length;
    const next = MEM.filter(t => t.id !== id);
    (global as any).__TASKS__ = next;

    return NextResponse.json({ ok: true, removed: before - next.length });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}