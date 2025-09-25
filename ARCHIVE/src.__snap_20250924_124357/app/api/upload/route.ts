import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ ok: false, error: "No file" }, { status: 400 });

    const bytes = await file.arrayBuffer();
    if (bytes.byteLength === 0) return NextResponse.json({ ok: false, error: "Empty file" }, { status: 400 });

    const ext = (file.name.split(".").pop() || "bin").toLowerCase();
    const id = randomUUID();
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });
    const fp = path.join(uploadsDir, `${id}.${ext}`);

    await fs.writeFile(fp, Buffer.from(bytes));
    const url = `/uploads/${id}.${ext}`;
    return NextResponse.json({ ok: true, url });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
