import { NextResponse } from "next/server";
import { readToken } from "@/lib/storage";
import { checkAdminPassword } from "@/lib/auth";
import { createReshare, extractUrn } from "@/lib/linkedin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!checkAdminPassword(req.headers.get("x-admin-password"))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { url, message } = await req.json().catch(() => ({}));
  if (typeof url !== "string" || !url.trim()) {
    return NextResponse.json({ error: "missing_url" }, { status: 400 });
  }

  if (!extractUrn(url)) {
    return NextResponse.json(
      { error: "No parece una URL de post de LinkedIn. Pega un enlace tipo linkedin.com/posts/... o linkedin.com/feed/update/urn:li:..." },
      { status: 400 },
    );
  }

  const token = readToken();
  if (!token) {
    return NextResponse.json({ error: "no_token" }, { status: 400 });
  }
  if (Date.now() > token.expires_at) {
    return NextResponse.json({ error: "token_expired" }, { status: 400 });
  }

  try {
    const result = await createReshare({
      accessToken: token.access_token,
      authorSub: token.sub,
      originalUrl: url.trim(),
      commentary: typeof message === "string" ? message : "",
    });
    return NextResponse.json({ ok: true, id: result.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "repost_failed" }, { status: 500 });
  }
}
