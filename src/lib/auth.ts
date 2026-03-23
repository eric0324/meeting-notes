import { SignJWT, jwtVerify } from "jose";

const SHARED_PASSWORD = process.env.SHARED_PASSWORD || "changeme";
const TOKEN_EXPIRY = "365d";
const COOKIE_NAME = "meeting_token";

function getSecret() {
  const secret = process.env.JWT_SECRET || "dev-secret-at-least-32-chars!!";
  return new TextEncoder().encode(secret);
}

export function verifyPassword(password: string): boolean {
  return password === SHARED_PASSWORD;
}

export async function createToken(): Promise<string> {
  return new SignJWT({ authenticated: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, getSecret());
    return true;
  } catch {
    return false;
  }
}

export { COOKIE_NAME };
