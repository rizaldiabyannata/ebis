import { z } from 'zod';

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

export const createProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  categoryId: z.string().uuid(),
  images: z.array(productImageSchema).min(1, "At least one image is required"),
  variants: z.array(productVariantSchema).min(1, "At least one variant is required"),
});

export const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  categoryId: z.string().uuid().optional(),
});

export const createVoucherSchema = z.object({
  code: z.string().min(1, "Code is required"),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
  discountValue: z.number().positive("Discount value must be positive"),
  validUntil: z.string().datetime("Invalid date format"),
  stock: z.number().int().min(0, "Stock cannot be negative"),
});

export const updateVoucherSchema = z.object({
  code: z.string().min(1).optional(),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']).optional(),
  discountValue: z.number().positive("Discount value must be positive").optional(),
  validUntil: z.string().datetime("Invalid date format").optional(),
  stock: z.number().int().min(0, "Stock cannot be negative").optional(),
});

export const createAdminSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters long"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  role: z.enum(['ADMIN', 'SUPER_ADMIN']).optional(),
});

export const updateAdminSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters long").optional(),
  email: z.string().email("Invalid email address").optional(),
  password: z.string().min(8, "Password must be at least 8 characters long").optional(),
  role: z.enum(['ADMIN', 'SUPER_ADMIN']).optional(),
});

const orderDetailSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

const deliverySchema = z.object({
    address: z.string().min(10, "Address must be at least 10 characters long"),
    recipientName: z.string().min(1, "Recipient name is required"),
    recipientPhone: z.string().min(1, "Recipient phone is required"),
});

const paymentSchema = z.object({
    paymentMethod: z.string().min(1, "Payment method is required"),
});

export const createOrderSchema = z.object({
  orderDetails: z.array(orderDetailSchema).nonempty("Order must contain at least one item"),
  delivery: deliverySchema,
  payment: paymentSchema,
  voucherCode: z.string().optional(),
});

export const updateDeliverySchema = z.object({
  status: z.string().min(1).optional(),
  driverName: z.string().min(1).optional(),
});

// Auth
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
