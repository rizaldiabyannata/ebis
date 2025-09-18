import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createVoucherSchema } from '@/lib/validation';

/**
 * @openapi
 * /vouchers:
 *   get:
 *     summary: Retrieve a list of all vouchers
 *     description: Fetches a list of all available vouchers. This is a protected endpoint.
 *     tags:
 *       - Vouchers
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       '200':
 *         description: A list of vouchers.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Voucher'
 *       '401':
 *         description: Unauthorized.
 *       '500':
 *         description: Internal server error.
 */
export async function GET() {
  try {
    const vouchers = await prisma.voucher.findMany();
    return NextResponse.json(vouchers);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch vouchers' }, { status: 500 });
  }
}

/**
 * @openapi
 * /vouchers:
 *   post:
 *     summary: Create a new voucher
 *     description: Adds a new voucher to the database. This is a protected endpoint.
 *     tags:
 *       - Vouchers
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateVoucherRequest'
 *     responses:
 *       '201':
 *         description: The voucher was created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Voucher'
 *       '400':
 *         description: Bad request, invalid input data.
 *       '401':
 *         description: Unauthorized.
 *       '409':
 *         description: A voucher with this code already exists.
 *       '500':
 *         description: Internal server error.
 */
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
