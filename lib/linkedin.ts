export const LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization";
export const LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
export const LINKEDIN_USERINFO_URL = "https://api.linkedin.com/v2/userinfo";
export const LINKEDIN_POSTS_URL = "https://api.linkedin.com/rest/posts";
export const LINKEDIN_API_VERSION = process.env.LINKEDIN_API_VERSION || "202604";

export const SCOPES = ["openid", "profile", "email", "w_member_social"];

/**
 * Extract a LinkedIn share/activity URN from a public LinkedIn URL.
 * Returns something like "urn:li:share:7012345678901234567" suitable for reshareContext.parent.
 */
export function extractUrn(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Already a URN
  const urnMatch = trimmed.match(/urn:li:(share|ugcPost|activity):(\d+)/);
  if (urnMatch) {
    // reshareContext expects share/ugcPost; activity IDs are interchangeable with share IDs.
    const kind = urnMatch[1] === "activity" ? "share" : urnMatch[1];
    return `urn:li:${kind}:${urnMatch[2]}`;
  }

  // Posts URL: /posts/username_activity-7012345678901234567-abcd
  const postsMatch = trimmed.match(/activity[-:](\d{15,25})/);
  if (postsMatch) return `urn:li:share:${postsMatch[1]}`;

  // Feed update URL: /feed/update/urn:li:share:7012345678901234567/
  const feedMatch = trimmed.match(/feed\/update\/urn:li:(share|ugcPost|activity):(\d+)/);
  if (feedMatch) {
    const kind = feedMatch[1] === "activity" ? "share" : feedMatch[1];
    return `urn:li:${kind}:${feedMatch[2]}`;
  }

  // Bare numeric id
  const numericMatch = trimmed.match(/^(\d{15,25})$/);
  if (numericMatch) return `urn:li:share:${numericMatch[1]}`;

  return null;
}

export function buildAuthUrl(params: {
  clientId: string;
  redirectUri: string;
  state: string;
}): string {
  const url = new URL(LINKEDIN_AUTH_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", params.clientId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("scope", SCOPES.join(" "));
  url.searchParams.set("state", params.state);
  return url.toString();
}

export async function exchangeCodeForToken(params: {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}): Promise<{ access_token: string; expires_in: number }> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: params.code,
    client_id: params.clientId,
    client_secret: params.clientSecret,
    redirect_uri: params.redirectUri,
  });
  const res = await fetch(LINKEDIN_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    throw new Error(`Token exchange failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

export async function fetchUserInfo(accessToken: string): Promise<{
  sub: string;
  name?: string;
  picture?: string;
  email?: string;
}> {
  const res = await fetch(LINKEDIN_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`userinfo failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

export async function createReshare(params: {
  accessToken: string;
  authorSub: string;
  parentUrn: string;
  commentary: string;
}): Promise<{ id: string }> {
  const body = {
    author: `urn:li:person:${params.authorSub}`,
    commentary: params.commentary || "",
    visibility: "PUBLIC",
    distribution: {
      feedDistribution: "MAIN_FEED",
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState: "PUBLISHED",
    isReshareDisabledByAuthor: false,
    reshareContext: { parent: params.parentUrn },
  };

  const res = await fetch(LINKEDIN_POSTS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      "LinkedIn-Version": LINKEDIN_API_VERSION,
      "X-Restli-Protocol-Version": "2.0.0",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Repost failed: ${res.status} ${await res.text()}`);
  }
  const id = res.headers.get("x-restli-id") || res.headers.get("x-linkedin-id") || "";
  return { id };
}
