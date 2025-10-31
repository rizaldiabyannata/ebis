import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { updateDeliverySchema } from '@/lib/validation';
import { sendWhatsAppMessage } from '@/lib/gowa';

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
      include: {
        order: {
          include: {
            orderDetails: {
              include: {
                variant: {
                  include: {
                    product: true,
                  },
                },
              },
            },
          },
        },
      }
    });

    if (status && updatedDelivery.order) {
      const { recipientPhone, recipientName } = updatedDelivery;
      const { orderNumber, orderDetails } = updatedDelivery.order;
      let message = '';

      const productList = orderDetails.map(
        (detail: any) => `- ${detail.quantity}x ${detail.variant.product.name} (${detail.variant.name})`
      ).join('\n');

      switch (status) {
        case 'PREPARING':
          message = `Halo ${recipientName}, pesanan Anda #${orderNumber} sedang kami siapkan. Terima kasih!\n\nDetail Pesanan:\n${productList}`;
          break;
        case 'ON_DELIVERY':
          message = `Kabar baik! Pesanan Anda #${orderNumber} sedang dalam perjalanan menuju alamat Anda.\n\nDetail Pesanan:\n${productList}`;
          break;
        // case 'DELIVERED':
        //   message = `Pesanan Anda #${orderNumber} telah berhasil diantar. Terima kasih telah berbelanja!\n\nDetail Pesanan:\n${productList}`;
        //   break;
        default:
          break;
      }

      if (message) {
        await sendWhatsAppMessage(recipientPhone, message);
      }
    }

    return NextResponse.json(updatedDelivery);
  } catch (error) {
    if (error.code === 'P2025') {
        return NextResponse.json({ error: 'Delivery record not found' }, { status: 404 });
    }
    console.error(error);
    return NextResponse.json({ error: 'Failed to update delivery record' }, { status: 500 });
  }
}
