import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';

// Protect specific API routes/methods:
// - /api/admins/* (all methods)
// - /api/categories/* (all methods)
// - /api/products/* (all methods except GET)
// - /api/orders (POST only)
// - /api/vouchers/* (all methods)
// Allow all /api/auth/*
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const method = req.method.toUpperCase();

  // Always allow auth endpoints
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Only consider API paths
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Decide if this request should be protected
  const protect =
    pathname.startsWith('/api/admin/') ||
    pathname.startsWith('/api/admins') ||
    pathname.startsWith('/api/categories') ||
    pathname.startsWith('/api/deliveries') ||
    pathname.startsWith('/api/vouchers') ||
    (pathname.startsWith('/api/products') && method !== 'GET') ||
    pathname.startsWith('/api/orders');

  if (!protect) {
    return NextResponse.next();
  }

  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
