import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthCookie, verifyToken } from '@/lib/auth';

/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Get current user details
 *     description: |
 *       Retrieves the details of the currently authenticated admin user based on the `auth_token` cookie.
 *       This is a protected endpoint.
 *     tags:
 *       - Authentication
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       '200':
 *         description: The details of the current user.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginSuccessResponse'
 *       '401':
 *         description: Unauthorized, authentication token is missing or invalid.
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
      // This case might happen if the user was deleted but the token is still valid
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ name: admin.name, email: admin.email, role: admin.role });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch current user' }, { status: 500 });
  }
}
