import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createOrderSchema, CreateOrderDetail } from '@/lib/validation';
import { randomBytes } from 'crypto';
import { sendWhatsAppMessage } from '@/lib/gowa';
import { calculatePoDeliveryDate } from '@/lib/po-logic';
/**
 * @openapi
 * /orders:
 *   get:
 *     summary: Retrieve a list of all orders
 *     description: Fetches a list of all orders with their details. This endpoint is currently public.
 *     tags:
 *       - Orders
 *     responses:
 *       '200':
 *         description: A list of orders.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       '500':
 *         description: Internal server error.
 */
export async function GET() {
  try {
    const orders = await prisma.order.findMany({
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
        delivery: true,
        payments: true,
        voucher: true,
      },
      orderBy: {
        orderDate: 'desc',
      },
    });

    // Manually serialize Decimal fields
    const serializedOrders = orders.map(order => ({
      ...order,
      subtotal: Number(order.subtotal),
      totalDiscount: Number(order.totalDiscount),
      totalFinal: Number(order.totalFinal),
      orderDetails: order.orderDetails.map(detail => ({
        ...detail,
        priceAtOrder: Number(detail.priceAtOrder),
      })),
      delivery: order.delivery ? {
        ...order.delivery,
        deliveryFee: Number(order.delivery.deliveryFee),
      } : null,
      payments: order.payments.map(payment => ({
        ...payment,
        amount: Number(payment.amount),
      })),
    }));

    return NextResponse.json(serializedOrders);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}


/**
 * @openapi
 * /orders:
 *   post:
 *     summary: Create a new order
 *     description: |
 *       Creates a new order. This is a complex transactional operation that:
 *       1. Validates product stock.
 *       2. Validates an optional voucher.
 *       3. Creates the order, order details, delivery, and payment records.
 *       4. Decrements product variant stock and voucher stock.
 *       This is a protected endpoint.
 *     tags:
 *       - Orders
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrderRequest'
 *     responses:
 *       '201':
 *         description: The order was created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       '400':
 *         description: Bad request (e.g., invalid input, expired voucher).
 *       '401':
 *         description: Unauthorized.
 *       '404':
 *         description: A product variant or voucher was not found.
 *       '409':
 *         description: Conflict, not enough stock for a product variant.
 *       '500':
 *         description: Internal server error during the transaction.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", details: parsed.error.issues }, { status: 400 });
    }

  const { delivery, payment, voucherCode } = parsed.data;
  const orderDetails: CreateOrderDetail[] = parsed.data.orderDetails;

  const variantIds = orderDetails.map((item: CreateOrderDetail) => item.variantId);
    const variants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: {
        product: true,
      }
    });

    if (variants.length !== variantIds.length) {
      return NextResponse.json({ error: "One or more product variants not found" }, { status: 404 });
    }

    for (const item of orderDetails) {
      const variant = variants.find(v => v.id === item.variantId);
      if (!variant || variant.stock < item.quantity) {
        return NextResponse.json({ error: `Not enough stock for variant ${variant?.sku || item.variantId}` }, { status: 409 });
      }
    }

    let voucher = null;
    let totalDiscount = 0;
    if (voucherCode) {
      voucher = await prisma.voucher.findUnique({ where: { code: voucherCode } });
      if (!voucher) {
        return NextResponse.json({ error: "Voucher not found" }, { status: 404 });
      }
      if (voucher.validUntil < new Date()) {
        return NextResponse.json({ error: "Voucher is expired" }, { status: 400 });
      }
      if (voucher.stock <= 0) {
        return NextResponse.json({ error: "Voucher is out of stock" }, { status: 400 });
      }
    }

    const subtotal = orderDetails.reduce((acc: number, item: CreateOrderDetail) => {
      const variant = variants.find(v => v.id === item.variantId)!;
      return acc + (Number(variant.price) * item.quantity);
    }, 0);

    if (voucher) {
      if (voucher.discountType === 'PERCENTAGE') {
        totalDiscount = subtotal * (Number(voucher.discountValue) / 100);
      } else { // FIXED_AMOUNT
        totalDiscount = Number(voucher.discountValue);
      }
    }

    const totalFinal = Math.max(0, subtotal - totalDiscount);
    const orderNumber = `ORDER-${randomBytes(4).toString('hex').toUpperCase()}-${Date.now()}`;

    let scheduledDeliveryDate = new Date();
    let isPoOrder = false;

    for (const variant of variants) {
      const poRule = (variant.product as any)?.preOrderRule;
      if (poRule) {
        isPoOrder = true;
        const calculatedDate = calculatePoDeliveryDate(poRule, new Date());
        if (calculatedDate > scheduledDeliveryDate) {
          scheduledDeliveryDate = calculatedDate;
        }
      }
    }

    const createdOrder = await prisma.$transaction(async (tx) => {
      for (const item of orderDetails) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      if (voucher) {
        await tx.voucher.update({
          where: { id: voucher.id },
          data: { stock: { decrement: 1 } },
        });
      }

      const order = await tx.order.create({
        data: {
          orderNumber,
          status: 'PENDING',
          subtotal,
          totalDiscount,
          totalFinal,
          voucherId: voucher?.id,
          orderDetails: {
            create: orderDetails.map((item: CreateOrderDetail) => {
              const variant = variants.find(v => v.id === item.variantId)!;
              return {
                variantId: item.variantId,
                quantity: item.quantity,
                priceAtOrder: variant.price,
              };
            }),
          },
          delivery: {
            // Cast to any to satisfy Prisma's generated types for nested create
            create: ({
              ...delivery,
              deliveryFee: 0,
              status: isPoOrder ? 'SCHEDULED' : 'PREPARING',
              deliveryDate: isPoOrder ? scheduledDeliveryDate : new Date(),
            } as any),
          },
          payments: {
            create: {
              paymentMethod: payment.paymentMethod,
              amount: totalFinal,
              paymentDate: new Date(),
              status: 'PENDING',
            },
          },
        },
        include: {
          orderDetails: true,
          delivery: true,
          payments: true,
          voucher: true,
        },
      });

      return order;
    });

    const gowaApiUrl = process.env.GOWA_API_URL;
    // If the Gowa API is configured, notify the admin group and the customer via WhatsApp.
    if (gowaApiUrl) {
      const fullOrderDetails = await prisma.order.findUnique({
        where: { id: createdOrder.id },
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
          delivery: true,
        },
      });

      if (fullOrderDetails) {
        const productList = fullOrderDetails.orderDetails.map(
          (d) => `- ${d.quantity}x ${d.variant.product.name} (${d.variant.name})`
        ).join('\n');

        const deliveryInfo = fullOrderDetails.delivery;
        const totalFormatted = Number(fullOrderDetails.totalFinal).toLocaleString('id-ID');

        const groupMessage = `
*Pesanan Baru Masuk*
*Nomor Pesanan:* ${fullOrderDetails.orderNumber}
*Nama Pelanggan:* ${deliveryInfo?.recipientName}
*No. Telepon:* ${deliveryInfo?.recipientPhone}
*Alamat:* ${deliveryInfo?.address}

*Detail Pesanan:*
${productList}

*Total:* Rp ${totalFormatted}
        `.trim();

        // Send to admin group if configured
        const groupId = process.env.GOWA_GROUP_ID;
        if (groupId) {
          try {
            await sendWhatsAppMessage(groupId, groupMessage);
          } catch (e) {
            console.error('Failed to send order notification to admin group:', e);
          }
        }

        // Also send a notification to the customer phone (if available)
        if (deliveryInfo?.recipientPhone) {
          try {
            // Tailor the customer message. If payment method is not COD, include payment instructions.
            // Determine payment method from the created order (preferred) or the incoming payment payload
            const paymentMethod = (createdOrder.payments && createdOrder.payments.length > 0)
              ? (createdOrder.payments[0].paymentMethod as string)
              : payment.paymentMethod;

            let customerMessage = `Terima kasih, pesanan Anda telah diterima.\n*Nomor Pesanan:* ${fullOrderDetails.orderNumber}\n*Total:* Rp ${totalFormatted}`;

            if (paymentMethod && paymentMethod !== 'COD') {
              // Read DANA number from env (user will set this)
              const danaNumber = process.env.DANA_NUMBER || process.env.PAYMENT_DANA_NUMBER || '';
              if (danaNumber) {
                customerMessage += `\n\nSilakan segera melakukan pembayaran sebesar Rp ${totalFormatted} ke nomor DANA: ${danaNumber}.\nSetelah melakukan pembayaran, mohon kirim bukti pembayaran (foto atau screenshot) ke chat ini agar pesanan segera diproses.`;
              } else {
                customerMessage += `\n\nSilakan segera melakukan pembayaran sebesar Rp ${totalFormatted} sesuai metode pembayaran yang Anda pilih.\nSetelah melakukan pembayaran, mohon kirim bukti pembayaran (foto atau screenshot) ke chat ini agar pesanan segera diproses.`;
              }
            } else {
              customerMessage += `\n\nPembayaran akan dilakukan saat pengiriman (COD).`;
            }

            await sendWhatsAppMessage(deliveryInfo.recipientPhone, customerMessage);
          } catch (e) {
            console.error('Failed to send order notification to customer:', e);
          }
        }
      }
    }

    return NextResponse.json(createdOrder, { status: 201 });

  } catch (error) {
    console.error("Failed to create order:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
