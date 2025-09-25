import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  // @ts-expect-error custom
  const accessToken = session?.accessToken ?? null;
  return NextResponse.json({
    loggedIn: !!session,
    hasToken: !!accessToken,
  });
}
