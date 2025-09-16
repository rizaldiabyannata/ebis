import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/orders/[id]
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

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
