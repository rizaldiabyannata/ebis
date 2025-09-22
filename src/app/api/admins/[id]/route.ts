import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { updateAdminSchema } from '@/lib/validation';
import bcrypt from 'bcrypt';

// Helper function to exclude keys from an object
function exclude<Admin, Key extends keyof Admin>(
  admin: Admin,
  keys: Key[]
): Omit<Admin, Key> {
  for (const key of keys) {
    delete admin[key];
  }
  return admin;
}

/**
 * @openapi
 * /admins/{id}:
 *   get:
 *     summary: Retrieve a single admin user by ID
 *     description: Fetches detailed information for a specific admin user, excluding the password. This is a protected endpoint.
 *     tags:
 *       - Admins
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique identifier of the admin user.
 *     responses:
 *       '200':
 *         description: The requested admin user.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Admin'
 *       '401':
 *         description: Unauthorized.
 *       '404':
 *         description: Admin not found.
 *       '500':
 *         description: Internal server error.
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

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

/**
 * @openapi
 * /admins/{id}:
 *   put:
 *     summary: Update an existing admin user
 *     description: Modifies the details of an existing admin user. This is a protected endpoint.
 *     tags:
 *       - Admins
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique identifier of the admin user to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateAdminRequest'
 *     responses:
 *       '200':
 *         description: The updated admin user.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Admin'
 *       '400':
 *         description: Bad request, invalid input data.
 *       '401':
 *         description: Unauthorized.
 *       '404':
 *         description: Admin not found.
 *       '409':
 *         description: Another admin with the same email already exists.
 *       '500':
 *         description: Internal server error.
 */
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

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

/**
 * @openapi
 * /admins/{id}:
 *   delete:
 *     summary: Delete an admin user
 *     description: Permanently removes an admin user from the database. This is a protected endpoint.
 *     tags:
 *       - Admins
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique identifier of the admin user to delete.
 *     responses:
 *       '204':
 *         description: The admin user was deleted successfully. No content is returned.
 *       '401':
 *         description: Unauthorized.
 *       '404':
 *         description: Admin not found.
 *       '500':
 *         description: Internal server error.
 */
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

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
