import crypto from "crypto";

export function checkAdminPassword(headerValue: string | null | undefined): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  if (!headerValue) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(headerValue);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
