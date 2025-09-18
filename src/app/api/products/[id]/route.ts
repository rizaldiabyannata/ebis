import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { updateProductSchema } from '@/lib/validation';

// GET /api/products/[id]
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        variants: true,
        images: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

// PUT /api/products/[id]
export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
    const id = params.id;

        const body = await request.json();
        const parsed = updateProductSchema.safeParse(body);

    if (!parsed.success) {
      const { issues } = parsed.error;
      return NextResponse.json({ error: 'Invalid request', details: issues }, { status: 400 });
    }

        const { name, description, categoryId } = parsed.data;

        if (categoryId) {
            const category = await prisma.category.findUnique({ where: { id: categoryId } });
            if (!category) {
                return NextResponse.json({ error: `Category with ID ${categoryId} not found` }, { status: 404 });
            }
        }

        const updatedProduct = await prisma.product.update({
            where: { id },
            data: {
                name,
                description,
                categoryId,
            },
        });

        return NextResponse.json(updatedProduct);
    } catch (error) {
        if (error.code === 'P2025') {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }
        console.error(error);
        return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
    }
}


// DELETE /api/products/[id]
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;

    await prisma.product.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error.code === 'P2025') {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
