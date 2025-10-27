import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const partnerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  imageUrl: z.string().url().optional(),
});

export async function GET(request: NextRequest, { params }: any) {
  try {
    const partner = await prisma.partner.findUnique({
      where: { id: params.id },
      include: {
        products: true,
      },
    });

    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    return NextResponse.json(partner);
  } catch (error) {
    console.error('[PARTNER_GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: any) {
  try {
    const body = await request.json();
    const parsed = partnerSchema.safeParse(body);

    if (!parsed.success) {
      const { issues } = parsed.error;
      return NextResponse.json({ error: 'Invalid request', details: issues }, { status: 400 });
    }

    const { name, description, imageUrl } = parsed.data;

    const partner = await prisma.partner.update({
      where: { id: params.id },
      data: {
        name,
        description,
        imageUrl,
      },
    });

    return NextResponse.json(partner);
  } catch (error) {
    console.error('[PARTNER_PUT]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: any) {
  try {
    await prisma.partner.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Partner deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('[PARTNER_DELETE]', error);
    // Handle cases where the partner might have related records that prevent deletion
    if ((error as any).code === 'P2003') {
       return NextResponse.json({ error: 'Cannot delete partner with existing products.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
