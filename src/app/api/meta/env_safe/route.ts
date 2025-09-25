import { NextResponse } from "next/server";
export async function GET() {
 return NextResponse.json({
appId: process.env.FACEBOOK_CLIENT_ID || null,
configId: process.env.FACEBOOK_CONFIG_ID || null,
nextauthUrl: process.env.NEXTAUTH_URL || null,
nodeEnv: process.env.NODE_ENV || null,
 });
}

