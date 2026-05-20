import { NextResponse } from "next/server";
import crypto from "crypto";
import { buildAuthUrl } from "@/lib/linkedin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "Missing LINKEDIN_CLIENT_ID or LINKEDIN_REDIRECT_URI env vars" },
      { status: 500 },
    );
  }

  const state = crypto.randomBytes(16).toString("hex");
  const url = buildAuthUrl({ clientId, redirectUri, state });

  const res = NextResponse.redirect(url);
  res.cookies.set("li_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: new URL(req.url).protocol === "https:",
    maxAge: 600,
    path: "/",
  });
  return res;
}
