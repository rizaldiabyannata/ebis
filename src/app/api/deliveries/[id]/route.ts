import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { updateDeliverySchema } from '@/lib/validation';

// PUT /api/deliveries/[id]
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    const body = await request.json();
    const parsed = updateDeliverySchema.safeParse(body);

    if (!parsed.success) {
      const { errors } = parsed.error;
      return NextResponse.json({ error: 'Invalid request', details: errors }, { status: 400 });
    }

    const { status, driverName } = parsed.data;

    if (!status && !driverName) {
        return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const updatedDelivery = await prisma.delivery.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(driverName && { driverName }),
      },
    });

    return NextResponse.json(updatedDelivery);
  } catch (error) {
    if (error.code === 'P2025') {
        return NextResponse.json({ error: 'Delivery record not found' }, { status: 404 });
    }
    console.error(error);
    return NextResponse.json({ error: 'Failed to update delivery record' }, { status: 500 });
  }
}
