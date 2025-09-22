import { NextResponse } from 'next/server';
import { clearAuthCookieOnResponse } from '@/lib/auth';

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Log out an admin user
 *     description: |
 *       Logs out the current user by clearing the `auth_token` cookie.
 *       This endpoint does not require a request body.
 *     tags:
 *       - Authentication
 *     responses:
 *       '204':
 *         description: Logout successful. The auth cookie is cleared. No content is returned.
 *       '500':
 *         description: Internal server error (if cookie clearing fails, though unlikely).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export async function POST() {
  try {
    const res = NextResponse.json({ message: 'Logout successful' });
    clearAuthCookieOnResponse(res);
    return res;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
  }
}
