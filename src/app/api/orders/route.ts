import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createOrderSchema } from '@/lib/validation';
import { randomBytes } from 'crypto';

// GET /api/orders
export async function GET() {
  try {
    const orders = await prisma.order.findMany({
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
      orderBy: {
        orderDate: 'desc',
      },
    });
    return NextResponse.json(orders);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}


// POST /api/orders
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", details: parsed.error.errors }, { status: 400 });
    }

    const { orderDetails, delivery, payment, voucherCode } = parsed.data;

    const variantIds = orderDetails.map(item => item.variantId);
    const variants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
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

    const subtotal = orderDetails.reduce((acc, item) => {
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
            create: orderDetails.map(item => {
              const variant = variants.find(v => v.id === item.variantId)!;
              return {
                variantId: item.variantId,
                quantity: item.quantity,
                priceAtOrder: variant.price,
              };
            }),
          },
          delivery: {
            create: {
              ...delivery,
              deliveryFee: 0,
              status: 'PREPARING',
            },
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

    return NextResponse.json(createdOrder, { status: 201 });

  } catch (error) {
    console.error("Failed to create order:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
