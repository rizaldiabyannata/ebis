import { NextResponse } from 'next/server';
import { clearAuthCookieOnResponse } from '@/lib/auth';

export async function POST() {
  const res = new NextResponse(null, { status: 204 });
  clearAuthCookieOnResponse(res);
  return res;
}
