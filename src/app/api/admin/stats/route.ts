import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * @openapi
 * /admin/stats:
 *   get:
 *     summary: Get admin dashboard statistics
 *     description: Returns aggregate counts for key entities.
 *     tags:
 *       - Admin
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Stats payload
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: integer
 *                 categories:
 *                   type: integer
 *                 vouchers:
 *                   type: integer
 *                 orders:
 *                   type: integer
 *                 deliveries:
 *                   type: integer
 *                 admins:
 *                   type: integer
 *       '401':
 *         description: Unauthorized
 *       '500':
 *         description: Internal server error
 */
export async function GET() {
  try {
    const [products, categories, vouchers, orders, deliveries, admins] = await Promise.all([
      prisma.product.count(),
      prisma.category.count(),
      prisma.voucher.count(),
      prisma.order.count(),
      prisma.delivery.count(),
      prisma.admin.count(),
    ]);
    return NextResponse.json({ products, categories, vouchers, orders, deliveries, admins });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
