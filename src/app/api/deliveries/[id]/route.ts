import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { updateDeliverySchema } from '@/lib/validation';

/**
 * @openapi
 * /deliveries/{id}:
 *   put:
 *     summary: Update a delivery record
 *     description: |
 *       Updates the status and/or driver name for a specific delivery record.
 *       This endpoint is currently public.
 *     tags:
 *       - Deliveries
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique identifier of the delivery record.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateDeliveryRequest'
 *     responses:
 *       '200':
 *         description: The updated delivery record.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Delivery'
 *       '400':
 *         description: Bad request, invalid input data.
 *       '404':
 *         description: Delivery record not found.
 *       '500':
 *         description: Internal server error.
 */
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    const body = await request.json();
    const parsed = updateDeliverySchema.safeParse(body);

    if (!parsed.success) {
      const { issues } = parsed.error;
      return NextResponse.json({ error: 'Invalid request', details: issues }, { status: 400 });
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
