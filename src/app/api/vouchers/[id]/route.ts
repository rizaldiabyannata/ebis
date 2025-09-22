import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { updateVoucherSchema } from '@/lib/validation';

/**
 * @openapi
 * /vouchers/{id}:
 *   get:
 *     summary: Retrieve a single voucher by its ID
 *     description: Fetches detailed information for a specific voucher. This is a protected endpoint.
 *     tags:
 *       - Vouchers
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique identifier of the voucher.
 *     responses:
 *       '200':
 *         description: The requested voucher.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Voucher'
 *       '401':
 *         description: Unauthorized.
 *       '404':
 *         description: Voucher not found.
 *       '500':
 *         description: Internal server error.
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

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

/**
 * @openapi
 * /vouchers/{id}:
 *   put:
 *     summary: Update an existing voucher
 *     description: Modifies the details of an existing voucher. This is a protected endpoint.
 *     tags:
 *       - Vouchers
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique identifier of the voucher to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateVoucherRequest'
 *     responses:
 *       '200':
 *         description: The updated voucher.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Voucher'
 *       '400':
 *         description: Bad request, invalid input data.
 *       '401':
 *         description: Unauthorized.
 *       '404':
 *         description: Voucher not found.
 *       '409':
 *         description: Another voucher with the same code already exists.
 *       '500':
 *         description: Internal server error.
 */
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

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

/**
 * @openapi
 * /vouchers/{id}:
 *   delete:
 *     summary: Delete a voucher
 *     description: Permanently removes a voucher from the database. This is a protected endpoint.
 *     tags:
 *       - Vouchers
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique identifier of the voucher to delete.
 *     responses:
 *       '204':
 *         description: The voucher was deleted successfully. No content is returned.
 *       '401':
 *         description: Unauthorized.
 *       '404':
 *         description: Voucher not found.
 *       '409':
 *         description: Conflict, cannot delete voucher as it is associated with existing orders.
 *       '500':
 *         description: Internal server error.
 */
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

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
