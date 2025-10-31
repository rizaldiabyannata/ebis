import { z } from 'zod';

// --- Generic Schemas for API responses ---

export const ErrorResponseSchema = z.object({
  error: z.string(),
  details: z.any().optional(),
});

export const SuccessResponseSchema = z.object({
  message: z.string(),
});

// --- Model Schemas (for documenting API responses) ---

// Accept absolute http(s) URLs or a site-relative path starting with '/'
export const imageUrlSchema = z
  .string()
  .refine(
    (v) => {
      try {
        // allow relative path like /uploads/xxx
        if (v.startsWith('/')) return true;
        const u = new URL(v);
        return u.protocol === 'http:' || u.protocol === 'https:';
      } catch {
        return false;
      }
    },
    { message: 'Invalid image URL' }
  );

export const AdminSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(['ADMIN', 'SUPER_ADMIN']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

export const ProductImageSchema = z.object({
  id: z.string().uuid(),
  imageUrl: imageUrlSchema,
  isMain: z.boolean(),
});

export const ProductVariantSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  sku: z.string(),
  price: z.number().describe('Prisma Decimal is treated as a number'),
  stock: z.number().int(),
});

export const ProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  categoryId: z.string().uuid(),
  category: CategorySchema.optional(),
  images: z.array(ProductImageSchema).optional(),
  variants: z.array(ProductVariantSchema).optional(),
});

export const VoucherSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
  discountValue: z.number(),
  validUntil: z.string().datetime(),
  stock: z.number().int(),
});

export const OrderDetailSchema = z.object({
  id: z.string().uuid(),
  quantity: z.number().int(),
  priceAtOrder: z.number(),
  variant: ProductVariantSchema,
});

export const DeliverySchema = z.object({
  id: z.string().uuid(),
  address: z.string(),
  recipientName: z.string(),
  recipientPhone: z.string(),
  driverName: z.string().nullable(),
  deliveryFee: z.number(),
  status: z.string(),
});

export const PaymentSchema = z.object({
  id: z.string().uuid(),
  paymentMethod: z.string(),
  amount: z.number(),
  paymentDate: z.string().datetime(),
  status: z.string(),
});

export const OrderSchema = z.object({
  id: z.string().uuid(),
  orderNumber: z.string(),
  orderDate: z.string().datetime(),
  status: z.string(),
  subtotal: z.number(),
  totalDiscount: z.number(),
  totalFinal: z.number(),
  voucher: VoucherSchema.nullable(),
  orderDetails: z.array(OrderDetailSchema),
  payments: z.array(PaymentSchema),
  delivery: DeliverySchema.nullable(),
});


// --- Request Schemas (from original file, now registered) ---

export const productImageSchema = z.object({
  imageUrl: imageUrlSchema,
  isMain: z.boolean(),
});

export const productVariantSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  price: z.number().positive(),
  stock: z.number().int().min(0),
  imageUrl: imageUrlSchema.optional(),
});

export const createProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  categoryId: z.string().uuid(),
  partnerId: z.string().uuid().optional(),
  // Product-level images removed: variants own their images now.
  variants: z.array(productVariantSchema).min(1, 'At least one variant is required'),
});

// Export input types for use in routes
export type ProductImageInput = z.infer<typeof productImageSchema>;
export type ProductVariantInput = z.infer<typeof productVariantSchema>;
export type CreateProductRequest = z.infer<typeof createProductSchema>;

export const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  categoryId: z.string().uuid().optional(),
  // Allow updating variants when editing a product. The handler will
  // replace existing variants with the provided list.
  variants: z.array(productVariantSchema).optional(),
});

export const createVoucherSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
  discountValue: z.number().positive('Discount value must be positive'),
  validUntil: z.string().datetime('Invalid date format'),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
});

export const updateVoucherSchema = z.object({
  code: z.string().min(1).optional(),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']).optional(),
  discountValue: z.number().positive('Discount value must be positive').optional(),
  validUntil: z.string().datetime('Invalid date format').optional(),
  stock: z.number().int().min(0, 'Stock cannot be negative').optional(),
});

export const createAdminSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters long'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  role: z.enum(['ADMIN', 'SUPER_ADMIN']).optional(),
});

export const updateAdminSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters long').optional(),
  email: z.string().email('Invalid email address').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters long').optional(),
  role: z.enum(['ADMIN', 'SUPER_ADMIN']).optional(),
});

const createOrderDetailSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

const createDeliverySchema = z.object({
  address: z.string().min(3, 'Address must be at least 3 characters long'),
  recipientName: z.string().min(1, 'Recipient name is required'),
  recipientPhone: z.string().min(1, 'Recipient phone is required'),
});

const createPaymentSchema = z.object({
  paymentMethod: z.string().min(1, 'Payment method is required'),
});

export const createOrderSchema = z.object({
  orderDetails: z.array(createOrderDetailSchema).nonempty('Order must contain at least one item'),
  delivery: createDeliverySchema,
  payment: createPaymentSchema,
  voucherCode: z.string().optional(),
});

export type CreateOrderDetail = z.infer<typeof createOrderDetailSchema>;
export type CreateOrderRequest = z.infer<typeof createOrderSchema>;

export const updateDeliverySchema = z.object({
  status: z.string().min(1).optional(),
  driverName: z.string().min(1).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const LoginResponseSchema = z.object({
  message: z.string(),
  token: z.string(),
});

export const LoginSuccessResponseSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  role: z.enum(['ADMIN', 'SUPER_ADMIN']),
});

export const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required")
});

export const updateCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").optional()
});
