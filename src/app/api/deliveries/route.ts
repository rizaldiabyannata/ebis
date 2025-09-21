import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * @openapi
 * /deliveries:
 *   get:
 *     summary: Retrieve a list of all deliveries
 *     description: Fetches a list of all delivery records with their associated order information.
 *     tags:
 *       - Deliveries
 *     responses:
 *       '200':
 *         description: A list of deliveries.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Delivery'
 *       '500':
 *         description: Internal server error.
 */
export async function GET() {
  try {
    const deliveries = await prisma.delivery.findMany({
      include: {
        order: {
          include: {
            orderDetails: {
              include: {
                variant: {
                  include: {
                    product: true
                  }
                }
              }
            },
            voucher: true,
            payments: true
          }
        }
      },
      orderBy: {
        order: {
          orderDate: 'desc'
        }
      }
    });
    return NextResponse.json(deliveries);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch deliveries' }, { status: 500 });
  }
}