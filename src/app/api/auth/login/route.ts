import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { loginSchema } from '@/lib/validation';
import { signToken, setAuthCookieOnResponse } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      const { issues } = parsed.error;
      return NextResponse.json({ error: 'Invalid request', details: issues }, { status: 400 });
    }

    const { email, password } = parsed.data;

    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const match = await bcrypt.compare(password, admin.password);
    if (!match) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const token = await signToken({ sub: String(admin.id), email: admin.email, role: admin.role });
    const res = NextResponse.json({ name: admin.name, email: admin.email, role: admin.role });
    setAuthCookieOnResponse(res, token);
    return res;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to login' }, { status: 500 });
  }
}
