import { NextResponse } from "next/server";
import { readToken } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  const token = readToken();
  if (!token) return NextResponse.json({ connected: false });
  return NextResponse.json({
    connected: true,
    name: token.name,
    picture: token.picture,
    expires_at: token.expires_at,
    expired: Date.now() > token.expires_at,
  });
}
