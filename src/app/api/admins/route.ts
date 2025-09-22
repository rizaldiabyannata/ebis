import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createAdminSchema } from '@/lib/validation';
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
 * /admins:
 *   get:
 *     summary: Retrieve a list of all admin users
 *     description: Fetches a list of all admin users. The password field is omitted from the response. This is a protected endpoint.
 *     tags:
 *       - Admins
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       '200':
 *         description: A list of admin users.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Admin'
 *       '401':
 *         description: Unauthorized.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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

/**
 * @openapi
 * /admins:
 *   post:
 *     summary: Create a new admin user
 *     description: Adds a new admin user to the database. The password will be hashed before saving. This is a protected endpoint.
 *     tags:
 *       - Admins
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAdminRequest'
 *     responses:
 *       '201':
 *         description: The admin user was created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Admin'
 *       '400':
 *         description: Bad request, invalid input data.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Unauthorized.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '409':
 *         description: An admin with this email already exists.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createAdminSchema.safeParse(body);

    if (!parsed.success) {
      const { issues } = parsed.error;
      return NextResponse.json({ error: 'Invalid request', details: issues }, { status: 400 });
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
