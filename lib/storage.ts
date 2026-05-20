export type StoredToken = {
  access_token: string;
  expires_at: number;
  sub: string;
  name?: string;
  picture?: string;
};

/**
 * Read token data from environment variables. In Heroku these are set via
 * `heroku config:set` after the OAuth flow. In local dev they live in `.env.local`.
 */
export function readToken(): StoredToken | null {
  const token = process.env.LINKEDIN_TOKEN;
  const sub = process.env.LINKEDIN_SUB;
  const expiresAt = process.env.LINKEDIN_TOKEN_EXPIRES_AT;
  if (!token || !sub || !expiresAt) return null;
  const n = Number(expiresAt);
  if (!Number.isFinite(n)) return null;
  return {
    access_token: token,
    sub,
    expires_at: n,
    name: process.env.LINKEDIN_NAME || undefined,
    picture: process.env.LINKEDIN_PICTURE || undefined,
  };
}
