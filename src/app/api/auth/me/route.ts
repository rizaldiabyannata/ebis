import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthCookie, verifyToken } from '@/lib/auth';

export async function GET() {
  try {
    const token = await getAuthCookie();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminId = payload.sub;
    const admin = await prisma.admin.findUnique({ where: { id: adminId } });
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ name: admin.name, email: admin.email, role: admin.role });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch current user' }, { status: 500 });
  }
}
