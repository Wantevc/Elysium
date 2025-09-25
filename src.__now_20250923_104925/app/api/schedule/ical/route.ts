export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { readTasks } from "../_store";

function esc(s: string) {
  return (s || "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}
function fmtICS(d: string | Date) {
  const dt = new Date(d);
  // YYYYMMDDTHHMMSSZ
  const iso = dt.toISOString().slice(0, 19).replace(/[-:]/g, "") + "Z";
  return iso;
}

export async function GET() {
  const tasks = await readTasks();
  const lines: string[] = [];
  lines.push("BEGIN:VCALENDAR");
  lines.push("VERSION:2.0");
  lines.push("PRODID:-//AI Social Manager//Scheduler//EN");
  lines.push("CALSCALE:GREGORIAN");
  lines.push("METHOD:PUBLISH");

  const now = fmtICS(new Date());
  for (const t of tasks) {
    const start = fmtICS(t.scheduledAt);
    const end = fmtICS(new Date(new Date(t.scheduledAt).getTime() + 30 * 60 * 1000)); // 30 min
    const summary = `[${(t.platform || "").toUpperCase()} ${t.type}] ${t.status}`;
    const text = (t.type === "text" ? t.message : t.caption) || "";
    const url =
      t.result?.permalink ||
      t.result?.postId ||
      t.result?.mediaId ||
      "";
    const desc = [text, url ? `Link: ${url}` : ""].filter(Boolean).join("\n");

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${t.id}@ai-social-manager`);
    lines.push(`DTSTAMP:${now}`);
    lines.push(`DTSTART:${start}`);
    lines.push(`DTEND:${end}`);
    lines.push(`SUMMARY:${esc(summary)}`);
    if (desc) lines.push(`DESCRIPTION:${esc(desc)}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  const body = lines.join("\r\n");
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="scheduled-posts.ics"',
      "Cache-Control": "no-store",
    },
  });
}