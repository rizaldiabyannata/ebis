import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { updateProductSchema } from '@/lib/validation';

/**
 * @openapi
 * /products/{id}:
 *   get:
 *     summary: Retrieve a single product by its ID
 *     description: Fetches detailed information for a specific product.
 *     tags:
 *       - Products
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique identifier of the product.
 *     responses:
 *       '200':
 *         description: The requested product.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       '404':
 *         description: Product not found.
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
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

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

/**
 * @openapi
 * /products/{id}:
 *   put:
 *     summary: Update an existing product
 *     description: Modifies the details of an existing product. This endpoint is protected.
 *     tags:
 *       - Products
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique identifier of the product to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProductRequest'
 *     responses:
 *       '200':
 *         description: The updated product.
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
 *         description: Unauthorized.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: Product or Category not found.
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
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
  const { id } = await context.params;

        const body = await request.json();
        const parsed = updateProductSchema.safeParse(body);

    if (!parsed.success) {
      const { issues } = parsed.error;
      return NextResponse.json({ error: 'Invalid request', details: issues }, { status: 400 });
    }

    const { name, description, categoryId, variants } = parsed.data as {
      name?: string;
      description?: string;
      categoryId?: string;
      variants?: any[];
    };

    if (categoryId) {
      const category = await prisma.category.findUnique({ where: { id: categoryId } });
      if (!category) {
        return NextResponse.json({ error: `Category with ID ${categoryId} not found` }, { status: 404 });
      }
    }

    // Perform update within a transaction. If variants are provided,
    // update existing variants (by id), create new ones, and only delete
    // variants that are not referenced by any order details to avoid FK errors.
    if (variants && Array.isArray(variants)) {
      await prisma.$transaction(async (tx) => {
        // 1) Update product basic fields first
        await tx.product.update({ where: { id }, data: { name, description, categoryId } });

        // 2) Fetch existing variants for this product
        const existing = await tx.productVariant.findMany({ where: { productId: id } });

        // 3) Upsert incoming variants: if they include an id, update; else create.
        const incomingIds: string[] = [];
        for (const v of variants) {
          if (v.id) {
            incomingIds.push(v.id);
            await tx.productVariant.update({
              where: { id: v.id },
              data: {
                name: v.name,
                sku: v.sku,
                price: v.price,
                stock: v.stock,
                imageUrl: v.imageUrl ?? null,
              },
            });
            } else {
              // If SKU already exists, avoid creating duplicate unique SKU constraint errors.
              const existingBySku = await tx.productVariant.findUnique({ where: { sku: v.sku } });
              if (existingBySku) {
                if (existingBySku.productId === id) {
                  // SKU belongs to a variant on this same product — treat as an update to that variant.
                  await tx.productVariant.update({
                    where: { id: existingBySku.id },
                    data: {
                      name: v.name,
                      sku: v.sku,
                      price: v.price,
                      stock: v.stock,
                      imageUrl: v.imageUrl ?? null,
                    },
                  });
                  incomingIds.push(existingBySku.id);
                } else {
                  // SKU is used by another product — abort with a clear error message.
                  throw new Error(`SKU_CONFLICT:${v.sku}`);
                }
              } else {
                const created = await tx.productVariant.create({
                  data: {
                    name: v.name,
                    sku: v.sku,
                    price: v.price,
                    stock: v.stock,
                    imageUrl: v.imageUrl ?? null,
                    productId: id,
                  },
                });
                incomingIds.push(created.id);
              }
            }
        }

        // 4) Determine which existing variants to delete (those not present in incomingIds)
        const toDelete = existing.filter((ex) => !incomingIds.includes(ex.id));

        for (const del of toDelete) {
          // If there are order details referencing this variant, skip deletion to avoid FK constraint errors.
          const refCount = await tx.orderDetail.count({ where: { variantId: del.id } });
          if (refCount === 0) {
            await tx.productVariant.delete({ where: { id: del.id } });
          } else {
            // Optionally: we could mark as inactive; for now, leave it in DB so historical orders remain valid.
            console.warn(`Skipping deletion of variant ${del.id} because it has ${refCount} order details`);
          }
        }
      });
    } else {
      // No variants provided; just update product fields.
      await prisma.product.update({ where: { id }, data: { name, description, categoryId } });
    }

    // Refetch the product with relations for response
    const updatedProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        variants: true,
        images: true,
      },
    });

    if (!updatedProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(updatedProduct);
  } catch (error: any) {
    // Handle SKU conflict error thrown from the transaction
    if (error && typeof error.message === 'string' && error.message.startsWith('SKU_CONFLICT:')) {
      const sku = error.message.split(':', 2)[1];
      return NextResponse.json({ error: `SKU '${sku}' is already used by another product` }, { status: 400 });
    }
    if (error && error.code === 'P2025') {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    console.error(error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}


/**
 * @openapi
 * /products/{id}:
 *   delete:
 *     summary: Delete a product
 *     description: Permanently removes a product from the database. This endpoint is protected.
 *     tags:
 *       - Products
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique identifier of the product to delete.
 *     responses:
 *       '204':
 *         description: The product was deleted successfully. No content is returned.
 *       '401':
 *         description: Unauthorized.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: Product not found.
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
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

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
