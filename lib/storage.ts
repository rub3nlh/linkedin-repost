import { promises as fs } from "fs";
import path from "path";

export type StoredToken = {
  access_token: string;
  expires_at: number;
  sub: string;
  name?: string;
  picture?: string;
};

const TOKEN_PATH = path.join(process.cwd(), ".token.json");

export async function readToken(): Promise<StoredToken | null> {
  try {
    const raw = await fs.readFile(TOKEN_PATH, "utf8");
    return JSON.parse(raw) as StoredToken;
  } catch {
    return null;
  }
}

export async function writeToken(token: StoredToken): Promise<void> {
  await fs.writeFile(TOKEN_PATH, JSON.stringify(token, null, 2), { mode: 0o600 });
}

export async function clearToken(): Promise<void> {
  try {
    await fs.unlink(TOKEN_PATH);
  } catch {
    /* noop */
  }
}
