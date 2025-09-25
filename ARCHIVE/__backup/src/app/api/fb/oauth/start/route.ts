export async function GET() {
  const appId = process.env.META_APP_ID!;
  const redirect = process.env.META_REDIRECT_URL!;
  const scopes = [
    'pages_show_list',
    'pages_manage_posts',
    'pages_read_engagement',
    'instagram_content_publish'
  ].join(',');

  const url =
    `https://www.facebook.com/v20.0/dialog/oauth` +
    `?client_id=${encodeURIComponent(appId)}` +
    `&redirect_uri=${encodeURIComponent(redirect)}` +
    `&scope=${encodeURIComponent(scopes)}` +
    `&response_type=code` +
    `&auth_type=rerequest`;

  return Response.redirect(url);
}