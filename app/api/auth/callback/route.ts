import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeCodeForToken, fetchUserInfo } from "@/lib/linkedin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(error)}`, req.url));
  }
  if (!code || !state) {
    return NextResponse.redirect(new URL("/?error=missing_code", req.url));
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get("li_oauth_state")?.value;
  if (!savedState || savedState !== state) {
    return NextResponse.redirect(new URL("/?error=invalid_state", req.url));
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.redirect(new URL("/?error=missing_env", req.url));
  }

  let payload: string;
  try {
    const tok = await exchangeCodeForToken({ code, clientId, clientSecret, redirectUri });
    const info = await fetchUserInfo(tok.access_token);
    payload = JSON.stringify({
      access_token: tok.access_token,
      expires_at: Date.now() + tok.expires_in * 1000,
      sub: info.sub,
      name: info.name,
      picture: info.picture,
    });
  } catch (e: any) {
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(e.message || "oauth_error")}`, req.url),
    );
  }

  const isHttps = new URL(req.url).protocol === "https:";
  const res = NextResponse.redirect(new URL("/connected", req.url));
  res.cookies.delete("li_oauth_state");
  res.cookies.set("li_token_pending", payload, {
    httpOnly: true,
    sameSite: "lax",
    secure: isHttps,
    maxAge: 600,
    path: "/",
  });
  return res;
}
