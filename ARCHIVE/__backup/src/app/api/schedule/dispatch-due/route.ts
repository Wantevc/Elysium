import { NextResponse } from "next/server";
import { getTasks } from "../../../../lib/taskStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Parse 3 vormen veilig:
 *  1) "2025-09-17T17:09:00Z"  (UTC ISO)
 *  2) "2025-09-17T19:09"      (lokale input zonder Z)
 *  3) "2025-09-17 19:09"      (met spatie)
 */
function parseWhen(s: string): number | null {
  if (!s) return null;
  let str = String(s).trim();
  if (str.includes(" ")) str = str.replace(" ", "T");
  // Als geen Z of offset, behandel het als lokale tijd; Date() zal 'm als local nemen.
  const d = new Date(str);
  const ts = d.getTime();
  return Number.isFinite(ts) ? ts : null;
}

/** Iets toleranter: beschouw taken als due als scheduledAt <= now + 5s (clock skew) */
function isDue(when: string): boolean {
  const ts = parseWhen(when);
  if (ts == null) return false;
  return ts <= Date.now() + 5000;
}

async function processDue() {
  let processed = 0;
  const nowIso = new Date().toISOString();

  for (const t of getTasks()) {
    const st = String(t.status || "").toLowerCase();
    if (st !== "queued" && st !== "scheduled") continue;

    if (!isDue(t.scheduledAt)) continue;

    // Simulatie: markeer gepost, zichtbaar resultaat
    t.status = "posted";
    t.result = {
      ok: true,
      kind: `${t.platform}_${t.type}`,
      postedAt: nowIso,
      note: "dispatcher-sim",
      debug: { scheduledAt: t.scheduledAt, now: nowIso }
    };
    t.error = null;
    processed++;
  }
  return processed;
}

export async function POST() {
  const n = await processDue();
  return NextResponse.json({ ok: true, processed: n }, { headers: { "cache-control": "no-store" } });
}
export async function GET() {
  const n = await processDue();
  return NextResponse.json({ ok: true, processed: n }, { headers: { "cache-control": "no-store" } });
}