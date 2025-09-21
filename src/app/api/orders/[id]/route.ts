import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * @openapi
 * /orders/{id}:
 *   get:
 *     summary: Retrieve a single order by its ID
 *     description: Fetches detailed information for a specific order. This endpoint is currently public.
 *     tags:
 *       - Orders
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique identifier of the order.
 *     responses:
 *       '200':
 *         description: The requested order.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       '404':
 *         description: Order not found.
 *       '500':
 *         description: Internal server error.
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    const order = await prisma.order.findUnique({
  where: { id },
      include: {
        orderDetails: {
          include: {
            variant: {
              include: {
                product: true
              }
            }
          },
        },
        delivery: true,
        payments: true,
        voucher: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}
