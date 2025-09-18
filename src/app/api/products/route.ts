import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createProductSchema, ProductImageInput } from '@/lib/validation';

/**
 * @openapi
 * /products:
 *   get:
 *     summary: Retrieve a list of all products
 *     description: Fetches a comprehensive list of all products available, including their categories, variants, and images.
 *     tags:
 *       - Products
 *     responses:
 *       '200':
 *         description: A list of products.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *       '500':
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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

/**
 * @openapi
 * /products:
 *   post:
 *     summary: Create a new product
 *     description: Adds a new product to the database with specified details, including variants and images. This endpoint is protected and requires authentication.
 *     tags:
 *       - Products
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProductRequest'
 *     responses:
 *       '201':
 *         description: The product was created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       '400':
 *         description: Bad request, invalid input data.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Unauthorized, authentication token is missing or invalid.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: Category not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '409':
 *         description: Conflict, a product with the same SKU already exists.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export async function POST(request: Request) {
  try {
    console.log('Request body:', request.json());
    const body = await request.json();
    const parsed = createProductSchema.safeParse(body);

    if (!parsed.success) {
      const { issues } = parsed.error;
      return NextResponse.json({ error: 'Invalid request', details: issues }, { status: 400 });
    }

  const { name, description, categoryId } = parsed.data;
  const images: ProductImageInput[] = parsed.data.images;
  const variants = parsed.data.variants;

    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
        return NextResponse.json({ error: `Category with ID ${categoryId} not found` }, { status: 404 });
    }

  const mainImageCount = images.filter((img: ProductImageInput) => img.isMain).length;
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
