// @ts-nocheck
export async function GET() { return Response.json({ ok: false, reason: 'auth/session disabled' }, { status: 501 }); }
export async function POST() { return Response.json({ ok: false, reason: 'auth/session disabled' }, { status: 501 }); }
