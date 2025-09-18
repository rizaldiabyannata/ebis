import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { registry } from './openapi-registry';

extendZodWithOpenApi(z);

// --- Generic Schemas for API responses ---

registry.register(
  'ErrorResponse',
  z.object({
    error: z.string(),
    details: z.any().optional(),
  })
);

registry.register(
  'SuccessResponse',
  z.object({
    message: z.string(),
  })
);

// --- Model Schemas (for documenting API responses) ---

const AdminSchema = registry.register(
  'Admin',
  z.object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string().email(),
    role: z.enum(['ADMIN', 'SUPER_ADMIN']),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
);

const CategorySchema = registry.register(
  'Category',
  z.object({
    id: z.string().uuid(),
    name: z.string(),
  })
);

const ProductImageSchema = registry.register(
  'ProductImage',
  z.object({
    id: z.string().uuid(),
    imageUrl: z.string().url(),
    isMain: z.boolean(),
  })
);

const ProductVariantSchema = registry.register(
  'ProductVariant',
  z.object({
    id: z.string().uuid(),
    name: z.string(),
    sku: z.string(),
    price: z.number().describe('Prisma Decimal is treated as a number'),
    stock: z.number().int(),
  })
);

const ProductSchema = registry.register(
  'Product',
  z.object({
    id: z.string().uuid(),
    name: z.string(),
    description: z.string(),
    categoryId: z.string().uuid(),
    category: CategorySchema.optional(),
    images: z.array(ProductImageSchema).optional(),
    variants: z.array(ProductVariantSchema).optional(),
  })
);

const VoucherSchema = registry.register(
  'Voucher',
  z.object({
    id: z.string().uuid(),
    code: z.string(),
    discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
    discountValue: z.number(),
    validUntil: z.string().datetime(),
    stock: z.number().int(),
  })
);

const OrderDetailSchema = registry.register(
  'OrderDetail',
  z.object({
    id: z.string().uuid(),
    quantity: z.number().int(),
    priceAtOrder: z.number(),
    variant: ProductVariantSchema,
  })
);

const DeliverySchema = registry.register(
  'Delivery',
  z.object({
    id: z.string().uuid(),
    address: z.string(),
    recipientName: z.string(),
    recipientPhone: z.string(),
    driverName: z.string().nullable(),
    deliveryFee: z.number(),
    status: z.string(),
  })
);

const PaymentSchema = registry.register(
  'Payment',
  z.object({
    id: z.string().uuid(),
    paymentMethod: z.string(),
    amount: z.number(),
    paymentDate: z.string().datetime(),
    status: z.string(),
  })
);

const OrderSchema = registry.register(
  'Order',
  z.object({
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
  })
);


// --- Request Schemas (from original file, now registered) ---

export const productImageSchema = z.object({
  imageUrl: z.string().url(),
  isMain: z.boolean().default(false),
});

export const productVariantSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  price: z.number().positive(),
  stock: z.number().int().min(0),
});

export const createProductSchema = registry.register(
  'CreateProductRequest',
  z.object({
    name: z.string().min(1),
    description: z.string().min(1),
    categoryId: z.string().uuid(),
    images: z.array(productImageSchema).min(1, 'At least one image is required'),
    variants: z.array(productVariantSchema).min(1, 'At least one variant is required'),
  })
);

// Export input types for use in routes
export type ProductImageInput = z.infer<typeof productImageSchema>;
export type ProductVariantInput = z.infer<typeof productVariantSchema>;
export type CreateProductRequest = z.infer<typeof createProductSchema>;

export const updateProductSchema = registry.register(
  'UpdateProductRequest',
  z.object({
    name: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    categoryId: z.string().uuid().optional(),
  })
);

export const createVoucherSchema = registry.register(
  'CreateVoucherRequest',
  z.object({
    code: z.string().min(1, 'Code is required'),
    discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
    discountValue: z.number().positive('Discount value must be positive'),
    validUntil: z.string().datetime('Invalid date format'),
    stock: z.number().int().min(0, 'Stock cannot be negative'),
  })
);

export const updateVoucherSchema = registry.register(
  'UpdateVoucherRequest',
  z.object({
    code: z.string().min(1).optional(),
    discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']).optional(),
    discountValue: z.number().positive('Discount value must be positive').optional(),
    validUntil: z.string().datetime('Invalid date format').optional(),
    stock: z.number().int().min(0, 'Stock cannot be negative').optional(),
  })
);

export const createAdminSchema = registry.register(
  'CreateAdminRequest',
  z.object({
    name: z.string().min(3, 'Name must be at least 3 characters long'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    role: z.enum(['ADMIN', 'SUPER_ADMIN']).optional(),
  })
);

export const updateAdminSchema = registry.register(
  'UpdateAdminRequest',
  z.object({
    name: z.string().min(3, 'Name must be at least 3 characters long').optional(),
    email: z.string().email('Invalid email address').optional(),
    password: z.string().min(8, 'Password must be at least 8 characters long').optional(),
    role: z.enum(['ADMIN', 'SUPER_ADMIN']).optional(),
  })
);

const createOrderDetailSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

const createDeliverySchema = z.object({
  address: z.string().min(10, 'Address must be at least 10 characters long'),
  recipientName: z.string().min(1, 'Recipient name is required'),
  recipientPhone: z.string().min(1, 'Recipient phone is required'),
});

const createPaymentSchema = z.object({
  paymentMethod: z.string().min(1, 'Payment method is required'),
});

export const createOrderSchema = registry.register(
  'CreateOrderRequest',
  z.object({
    orderDetails: z.array(createOrderDetailSchema).nonempty('Order must contain at least one item'),
    delivery: createDeliverySchema,
    payment: createPaymentSchema,
    voucherCode: z.string().optional(),
  })
);

export type CreateOrderDetail = z.infer<typeof createOrderDetailSchema>;
export type CreateOrderRequest = z.infer<typeof createOrderSchema>;

export const updateDeliverySchema = registry.register(
  'UpdateDeliveryRequest',
  z.object({
    status: z.string().min(1).optional(),
    driverName: z.string().min(1).optional(),
  })
);

export const loginSchema = registry.register(
  'LoginRequest',
  z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  })
);

registry.register(
  'LoginResponse',
  z.object({
    message: z.string(),
    token: z.string(),
  })
);

export const LoginSuccessResponseSchema = registry.register(
  'LoginSuccessResponse',
  z.object({
    name: z.string(),
    email: z.string().email(),
    role: z.enum(['ADMIN', 'SUPER_ADMIN']),
  })
);

export const createCategorySchema = registry.register(
    'CreateCategoryRequest',
    z.object({
        name: z.string().min(1, "Category name is required")
    })
)

export const updateCategorySchema = registry.register(
    'UpdateCategoryRequest',
    z.object({
        name: z.string().min(1, "Category name is required").optional()
    })
)
