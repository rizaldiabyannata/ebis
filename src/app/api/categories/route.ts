import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';

const categorySchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
});

export async function GET() {
  try {
    const categories = await prisma.category.findMany();
    return NextResponse.json(categories);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = categorySchema.safeParse(body);

    if (!parsed.success) {
      const { errors } = parsed.error;
      return NextResponse.json({ error: "Invalid request", details: errors }, { status: 400 });
    }

    const { name } = parsed.data;

    const existingCategory = await prisma.category.findFirst({
        where: { name }
    });

    if (existingCategory) {
        return NextResponse.json({ error: 'Category with this name already exists' }, { status: 409 });
    }

    const newCategory = await prisma.category.create({
      data: {
        name,
      },
    });

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
