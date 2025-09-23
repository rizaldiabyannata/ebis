import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';

export const AUTH_COOKIE_NAME = 'auth_token';
const alg = 'HS256';

export function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET is not set');
  }
  return new TextEncoder().encode(secret);
}

export type JwtPayload = {
  sub: string; // admin id as string
  email: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
};

export async function signToken(payload: JwtPayload, expiresIn = '7d') {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + parseExpiry(expiresIn);
  return await new SignJWT({ ...payload, iat, exp })
    .setProtectedHeader({ alg })
    .setIssuedAt(iat)
    .setExpirationTime(exp)
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const { sub, email, role } = payload as any;
    if (!sub || !email || !role) return null;
    return { sub: String(sub), email: String(email), role: role as any };
  } catch {
    return null;
  }
}

export function setAuthCookieOnResponse(res: NextResponse, token: string) {
  const oneWeek = 7 * 24 * 60 * 60;
  res.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: oneWeek,
  });
}

export function clearAuthCookieOnResponse(res: NextResponse) {
  res.cookies.set(AUTH_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

export async function getAuthCookie(): Promise<string | null> {
  const store = await cookies();
  return store.get(AUTH_COOKIE_NAME)?.value ?? null;
}

export function parseExpiry(input: string): number {
  // Supports s, m, h, d
  const match = input.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60;
  const value = Number(match[1]);
  const unit = match[2];
  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 3600;
    case 'd':
      return value * 86400;
  }
  // This part is unreachable because the regex guarantees the unit is one of s, m, h, d
  return 7 * 24 * 60 * 60;
}
