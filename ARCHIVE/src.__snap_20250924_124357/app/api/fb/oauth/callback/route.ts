// src/app/api/fb/oauth/callback/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Vangt ?code=... of ?error=... op en toont het in de browser */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error_description") || searchParams.get("error");

  if (error) {
    return new NextResponse(
      `<pre>OAuth error:\n${error}</pre>`,
      { status: 200, headers: { "content-type": "text/html; charset=utf-8" } }
    );
  }
  if (!code) {
    return new NextResponse(
      `<pre>Geen ?code ontvangen. Controleer of je dit exact gebruikt als redirect:\nhttp://localhost:3000/api/fb/oauth/callback</pre>`,
      { status: 200, headers: { "content-type": "text/html; charset=utf-8" } }
    );
  }

  return new NextResponse(
    `<pre>OK!\ncode=${code}\n\nKopieer deze code; we wisselen hem zo om voor een User Access Token.</pre>`,
    { status: 200, headers: { "content-type": "text/html; charset=utf-8" } }
  );
}
