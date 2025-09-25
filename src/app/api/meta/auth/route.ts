// @ts-nocheck
export async function GET() {
  return Response.json({ ok: true, auth: 'disabled' }, { status: 200 });
}
export async function POST() {
  return Response.json({ ok: false, reason: 'auth disabled' }, { status: 501 });
}
