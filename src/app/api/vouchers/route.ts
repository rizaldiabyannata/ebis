import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createVoucherSchema } from '@/lib/validation';

// GET /api/vouchers
export async function GET() {
  try {
    const vouchers = await prisma.voucher.findMany();
    return NextResponse.json(vouchers);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch vouchers' }, { status: 500 });
  }
}

// POST /api/vouchers
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createVoucherSchema.safeParse(body);

    if (!parsed.success) {
      const { issues } = parsed.error;
      return NextResponse.json({ error: 'Invalid request', details: issues }, { status: 400 });
    }

    const { code, discountType, discountValue, validUntil, stock } = parsed.data;

    const existingVoucher = await prisma.voucher.findUnique({
        where: { code }
    });

    if (existingVoucher) {
        return NextResponse.json({ error: 'A voucher with this code already exists' }, { status: 409 });
    }

    const newVoucher = await prisma.voucher.create({
      data: {
        code,
        discountType,
        discountValue,
        validUntil: new Date(validUntil),
        stock,
      },
    });

    return NextResponse.json(newVoucher, { status: 201 });
  } catch (error) {
    console.error(error);
    if (error.code === 'P2002') {
        return NextResponse.json({ error: 'A voucher with this code already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create voucher' }, { status: 500 });
  }
}
