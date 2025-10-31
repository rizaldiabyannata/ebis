import { POST, GET } from '../route';
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { DeepMockProxy } from 'jest-mock-extended';
import { Prisma, PrismaClient, DiscountType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { randomUUID } from 'crypto';

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

describe('API /orders', () => {
  const mockProduct = { id: randomUUID(), name: 'Test Product', description: 'A product for testing', preOrderRule: null, categoryId: randomUUID(), partnerId: null };
  const mockVariant1 = { id: randomUUID(), name: 'Variant 1', sku: 'V1', price: new Decimal(10), stock: 10, productId: mockProduct.id, product: mockProduct };
  const mockVariant2 = { id: randomUUID(), name: 'Variant 2', sku: 'V2', price: new Decimal(20), stock: 5, productId: mockProduct.id, product: mockProduct };
  const mockVoucher = { id: randomUUID(), code: 'SUMMER', discountType: 'FIXED_AMOUNT' as DiscountType, discountValue: new Decimal(5), validUntil: new Date(Date.now() + 86400000), stock: 10 };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('GET', () => {
    it('should return a list of orders', async () => {
        prismaMock.order.findMany.mockResolvedValue([]);
        const response = await GET();
        const body = await response.json();
        expect(response.status).toBe(200);
        expect(body).toEqual([]);
    });
  });

  describe('POST', () => {
    const validOrderData = {
      orderDetails: [
        { variantId: mockVariant1.id, quantity: 2 },
        { variantId: mockVariant2.id, quantity: 1 },
      ],
      delivery: { address: '123 Main St', recipientName: 'John Doe', recipientPhone: '555-1234' },
      payment: { paymentMethod: 'Credit Card' },
      voucherCode: mockVoucher.code,
    };

    // This is the object that will be returned by the mocked `order.create` call.
    // Note that all Decimal fields are now plain numbers.
    const mockCreatedOrder = {
        id: randomUUID(),
        orderNumber: 'ORDER-1234',
        status: 'PENDING',
        subtotal: 40,
        totalDiscount: 5,
        totalFinal: 35,
        voucherId: mockVoucher.id,
        orderDate: new Date(),
        // Relations can be empty arrays for this test as we just need the top-level order
        orderDetails: [],
        delivery: null,
        payments: [],
        voucher: null,
      };

    it('should create a new order and return 201 on success', async () => {
      prismaMock.productVariant.findMany.mockResolvedValue([mockVariant1, mockVariant2]);
      prismaMock.voucher.findUnique.mockResolvedValue(mockVoucher);
      // When `order.create` is called inside the transaction, return our JSON-safe mock object
      prismaMock.order.create.mockResolvedValue(mockCreatedOrder as any);
  prismaMock.$transaction.mockImplementation(async (cb: any) => cb(prismaMock));

      const request = new NextRequest('http://localhost', { method: 'POST', body: JSON.stringify(validOrderData) });
      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.id).toBe(mockCreatedOrder.id);
      expect(body.totalFinal).toBe(35);
    });

    it('should return 404 if a product variant is not found', async () => {
      prismaMock.productVariant.findMany.mockResolvedValue([mockVariant1]);
      const request = new NextRequest('http://localhost', { method: 'POST', body: JSON.stringify(validOrderData) });
      const response = await POST(request);
      const body = await response.json();
      expect(response.status).toBe(404);
      expect(body.error).toBe('One or more product variants not found');
    });

    it('should return 409 if there is not enough stock', async () => {
      const lowStockVariant = { ...mockVariant1, stock: 1 };
      prismaMock.productVariant.findMany.mockResolvedValue([lowStockVariant, mockVariant2]);
      const request = new NextRequest('http://localhost', { method: 'POST', body: JSON.stringify(validOrderData) });
      const response = await POST(request);
      const body = await response.json();
      expect(response.status).toBe(409);
      expect(body.error).toContain('Not enough stock for variant');
    });

    it('should return 404 if voucher code is not found', async () => {
        prismaMock.productVariant.findMany.mockResolvedValue([mockVariant1, mockVariant2]);
        prismaMock.voucher.findUnique.mockResolvedValue(null);
        const request = new NextRequest('http://localhost', { method: 'POST', body: JSON.stringify(validOrderData) });
        const response = await POST(request);
        const body = await response.json();
        expect(response.status).toBe(404);
        expect(body.error).toBe('Voucher not found');
    });

    it('should return 400 if voucher is expired', async () => {
        const expiredVoucher = { ...mockVoucher, validUntil: new Date(Date.now() - 86400000) };
        prismaMock.productVariant.findMany.mockResolvedValue([mockVariant1, mockVariant2]);
        prismaMock.voucher.findUnique.mockResolvedValue(expiredVoucher);
        const request = new NextRequest('http://localhost', { method: 'POST', body: JSON.stringify(validOrderData) });
        const response = await POST(request);
        const body = await response.json();
        expect(response.status).toBe(400);
        expect(body.error).toBe('Voucher is expired');
    });

    it('should return 500 if the transaction fails', async () => {
        prismaMock.productVariant.findMany.mockResolvedValue([mockVariant1, mockVariant2]);
        prismaMock.voucher.findUnique.mockResolvedValue(mockVoucher);
        prismaMock.$transaction.mockRejectedValue(new Error('Transaction failed'));
        
        // Suppress console.error for this error test
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        
        const request = new NextRequest('http://localhost', { method: 'POST', body: JSON.stringify(validOrderData) });
        const response = await POST(request);
        const body = await response.json();
        expect(response.status).toBe(500);
        expect(body.error).toBe('Failed to create order');
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to create order:'), expect.any(Error));

        // Restore console.error
        consoleSpy.mockRestore();
    });
  });
});
