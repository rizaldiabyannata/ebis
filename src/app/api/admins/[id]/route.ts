import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { updateAdminSchema } from '@/lib/validation';
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

// GET /api/admins/[id]
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;

    const admin = await prisma.admin.findUnique({
      where: { id },
    });

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    const adminWithoutPassword = exclude(admin, ['password']);
    return NextResponse.json(adminWithoutPassword);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch admin' }, { status: 500 });
  }
}

// PUT /api/admins/[id]
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;

    const body = await request.json();
    const parsed = updateAdminSchema.safeParse(body);

    if (!parsed.success) {
      const { issues } = parsed.error;
      return NextResponse.json({ error: 'Invalid request', details: issues }, { status: 400 });
    }

    const { password, email, ...dataToUpdate } = parsed.data;

    if (email) {
      const existingAdmin = await prisma.admin.findFirst({
          where: {
              email,
              id: { not: id }
          }
      });
      if (existingAdmin) {
          return NextResponse.json({ error: 'Another admin with this email already exists' }, { status: 409 });
      }
    }

  let hashedPassword;
    if (password) {
        hashedPassword = await bcrypt.hash(password, 10);
    }

    const updatePayload = {
        ...dataToUpdate,
        ...(email && { email }),
        ...(hashedPassword && { password: hashedPassword })
    };

    const updatedAdmin = await prisma.admin.update({
  where: { id },
      data: updatePayload,
    });

    const adminWithoutPassword = exclude(updatedAdmin, ['password']);
    return NextResponse.json(adminWithoutPassword);
  } catch (error) {
    if (error.code === 'P2025') {
        return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }
     if (error.code === 'P2002') {
        return NextResponse.json({ error: 'An admin with this email already exists.' }, { status: 409 });
    }
    console.error(error);
    return NextResponse.json({ error: 'Failed to update admin' }, { status: 500 });
  }
}

// DELETE /api/admins/[id]
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;

    await prisma.admin.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error.code === 'P2025') {
        return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete admin' }, { status: 500 });
  }
}
