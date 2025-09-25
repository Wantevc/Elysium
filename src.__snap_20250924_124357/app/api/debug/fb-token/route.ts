export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const input_token = searchParams.get('input_token');
  if (!input_token) return new Response(JSON.stringify({ error: 'missing input_token' }), { status: 400 });

  const appId = process.env.META_APP_ID!;
  const appSecret = process.env.META_APP_SECRET!;
  const appToken = `${appId}|${appSecret}`;

  const url = `https://graph.facebook.com/v20.0/debug_token?input_token=${encodeURIComponent(input_token)}&access_token=${encodeURIComponent(appToken)}`;
  const r = await fetch(url);
  const data = await r.json();
  return Response.json(data);
}
