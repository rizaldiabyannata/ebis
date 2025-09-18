import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createProductSchema } from '@/lib/validation';

// GET /api/products
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        variants: true,
        images: true,
      },
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

// POST /api/products
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createProductSchema.safeParse(body);

    if (!parsed.success) {
      const { issues } = parsed.error;
      return NextResponse.json({ error: 'Invalid request', details: issues }, { status: 400 });
    }

    const { name, description, categoryId, images, variants } = parsed.data;

    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
        return NextResponse.json({ error: `Category with ID ${categoryId} not found` }, { status: 404 });
    }

    const mainImageCount = images.filter(img => img.isMain).length;
    if (mainImageCount === 0) {
        images[0].isMain = true;
    } else if (mainImageCount > 1) {
        return NextResponse.json({ error: 'Only one image can be set as the main image' }, { status: 400 });
    }

    const newProduct = await prisma.product.create({
      data: {
        name,
        description,
        categoryId,
        images: {
          create: images,
        },
        variants: {
          create: variants,
        },
      },
      include: {
        images: true,
        variants: true,
      }
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error(error);
    if (error.code === 'P2002') {
        return NextResponse.json({ error: 'A product with the same SKU already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
