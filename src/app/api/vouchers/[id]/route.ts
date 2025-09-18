import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { updateVoucherSchema } from '@/lib/validation';

// GET /api/vouchers/[id]
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;

    const voucher = await prisma.voucher.findUnique({
      where: { id },
    });

    if (!voucher) {
      return NextResponse.json({ error: 'Voucher not found' }, { status: 404 });
    }

    return NextResponse.json(voucher);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch voucher' }, { status: 500 });
  }
}

// PUT /api/vouchers/[id]
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;

    const body = await request.json();
    const parsed = updateVoucherSchema.safeParse(body);

    if (!parsed.success) {
      const { issues } = parsed.error;
      return NextResponse.json({ error: 'Invalid request', details: issues }, { status: 400 });
    }

    const { code, ...dataToUpdate } = parsed.data;

    if (code) {
      const existingVoucher = await prisma.voucher.findFirst({
          where: {
              code,
              id: { not: id }
          }
      });

      if (existingVoucher) {
          return NextResponse.json({ error: 'Another voucher with this code already exists' }, { status: 409 });
      }
    }

    const updatePayload = {
        ...dataToUpdate,
        ...(code && { code }),
        ...(dataToUpdate.validUntil && { validUntil: new Date(dataToUpdate.validUntil) })
    };

    const updatedVoucher = await prisma.voucher.update({
      where: { id },
      data: updatePayload,
    });

    return NextResponse.json(updatedVoucher);
  } catch (error) {
    if (error.code === 'P2025') {
        return NextResponse.json({ error: 'Voucher not found' }, { status: 404 });
    }
    if (error.code === 'P2002') {
        return NextResponse.json({ error: 'A voucher with this code already exists.' }, { status: 409 });
    }
    console.error(error);
    return NextResponse.json({ error: 'Failed to update voucher' }, { status: 500 });
  }
}

// DELETE /api/vouchers/[id]
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;

    await prisma.voucher.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error.code === 'P2025') { // Record to delete does not exist.
        return NextResponse.json({ error: 'Voucher not found' }, { status: 404 });
    }
    if (error.code === 'P2003') { // Foreign key constraint failed
        return NextResponse.json({ error: 'Cannot delete voucher as it is associated with existing orders.' }, { status: 409 });
    }
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete voucher' }, { status: 500 });
  }
}
