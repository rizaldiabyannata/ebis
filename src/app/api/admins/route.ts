import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createAdminSchema } from '@/lib/validation';
import bcrypt from 'bcrypt';

// Helper function to exclude keys from an object
function exclude<Admin, Key extends keyof Admin>(
  admin: Admin,
  keys: Key[]
): Omit<Admin, Key> {
  for (let key of keys) {
    delete admin[key];
  }
  return admin;
}

// GET /api/admins
export async function GET() {
  try {
    const admins = await prisma.admin.findMany();
    const adminsWithoutPassword = admins.map(admin => exclude(admin, ['password']));
    return NextResponse.json(adminsWithoutPassword);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 });
  }
}

// POST /api/admins
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createAdminSchema.safeParse(body);

    if (!parsed.success) {
      const { errors } = parsed.error;
      return NextResponse.json({ error: 'Invalid request', details: errors }, { status: 400 });
    }

    const { name, email, password, role } = parsed.data;

    const existingAdmin = await prisma.admin.findUnique({
        where: { email }
    });

    if (existingAdmin) {
        return NextResponse.json({ error: 'An admin with this email already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = await prisma.admin.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
    });

    const adminWithoutPassword = exclude(newAdmin, ['password']);
    return NextResponse.json(adminWithoutPassword, { status: 201 });
  } catch (error) {
    console.error(error);
    if (error.code === 'P2002') {
        return NextResponse.json({ error: 'An admin with this email already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create admin' }, { status: 500 });
  }
}
