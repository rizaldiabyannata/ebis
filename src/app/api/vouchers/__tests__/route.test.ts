import { GET, POST } from '../route';
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { DeepMockProxy } from 'jest-mock-extended';
import { Prisma, PrismaClient, DiscountType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

describe('API /vouchers', () => {
  const mockVouchers = [
    {
      id: 'v1',
      code: 'SUMMER20',
      discountType: 'PERCENTAGE' as DiscountType,
      discountValue: new Decimal(20),
      validUntil: new Date(),
      stock: 100,
    },
    {
      id: 'v2',
      code: 'SAVE10',
      discountType: 'FIXED_AMOUNT' as DiscountType,
      discountValue: new Decimal(10),
      validUntil: new Date(),
      stock: 50,
    },
  ];

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('GET', () => {
    it('should return a list of vouchers and a 200 status', async () => {
      prismaMock.voucher.findMany.mockResolvedValue(mockVouchers);
      const response = await GET();
      const body = await response.json();
      expect(response.status).toBe(200);
      // Prisma Decimal is not directly JSON serializable, so we compare key parts
      expect(body).toHaveLength(2);
      expect(body[0].code).toBe(mockVouchers[0].code);
    });

    it('should return 500 if the database call fails', async () => {
      prismaMock.voucher.findMany.mockRejectedValue(new Error('DB Error'));
      
      // Suppress console.error for this error test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const response = await GET();
      const body = await response.json();
      expect(response.status).toBe(500);
      expect(body.error).toBe('Failed to fetch vouchers');
      expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));

      // Restore console.error
      consoleSpy.mockRestore();
    });
  });

  describe('POST', () => {
    const newVoucherData = {
      code: 'NEWYEAR',
      discountType: 'PERCENTAGE' as DiscountType,
      discountValue: 15,
      validUntil: '2025-01-01T00:00:00.000Z',
      stock: 200,
    };
    const createdVoucher = {
      ...newVoucherData,
      id: 'v3',
      discountValue: new Decimal(15),
      validUntil: new Date(newVoucherData.validUntil),
    };

    it('should create a new voucher and return it with a 201 status', async () => {
      prismaMock.voucher.findUnique.mockResolvedValue(null);
      prismaMock.voucher.create.mockResolvedValue(createdVoucher);
      const request = new NextRequest('http://localhost', {
        method: 'POST',
        body: JSON.stringify(newVoucherData),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.code).toBe(createdVoucher.code);
      expect(body.stock).toBe(createdVoucher.stock);
    });

    it('should return 400 for invalid input data', async () => {
      const request = new NextRequest('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ ...newVoucherData, code: '' }),
      });
      const response = await POST(request);
      const body = await response.json();
      expect(response.status).toBe(400);
      expect(body.error).toBe('Invalid request');
    });

    it('should return 409 if a voucher with the same code already exists', async () => {
      prismaMock.voucher.findUnique.mockResolvedValue(mockVouchers[0]);
      const request = new NextRequest('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ ...newVoucherData, code: 'SUMMER20' }),
      });
      const response = await POST(request);
      const body = await response.json();
      expect(response.status).toBe(409);
      expect(body.error).toBe('A voucher with this code already exists');
    });
  });
});
