import { GET, PUT, DELETE } from '../route';
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { DeepMockProxy } from 'jest-mock-extended';
import { Prisma, PrismaClient, DiscountType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

describe('API /vouchers/[id]', () => {
  const mockVoucher = {
    id: 'v1',
    code: 'SUMMER20',
    discountType: 'PERCENTAGE' as DiscountType,
    discountValue: new Decimal(20),
    validUntil: new Date(),
    stock: 100,
  };
  const mockContext = { params: { id: 'v1' } };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  // --- GET ---
  describe('GET', () => {
    it('should return a voucher and a 200 status if found', async () => {
      prismaMock.voucher.findUnique.mockResolvedValue(mockVoucher);
      const response = await GET(new NextRequest('http://localhost'), mockContext);
      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body.code).toEqual(mockVoucher.code);
    });

    it('should return 404 if the voucher is not found', async () => {
      prismaMock.voucher.findUnique.mockResolvedValue(null);
      const response = await GET(new NextRequest('http://localhost'), mockContext);
      const body = await response.json();
      expect(response.status).toBe(404);
      expect(body.error).toBe('Voucher not found');
    });
  });

  // --- PUT ---
  describe('PUT', () => {
    it('should update a voucher and return it with a 200 status', async () => {
      const updatedVoucher = { ...mockVoucher, stock: 99 };
      prismaMock.voucher.findFirst.mockResolvedValue(null);
      prismaMock.voucher.update.mockResolvedValue(updatedVoucher);
      const request = new NextRequest('http://localhost', {
        method: 'PUT',
        body: JSON.stringify({ stock: 99 }),
      });

      const response = await PUT(request, mockContext);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.stock).toBe(99);
    });

    it('should return 404 if the voucher to update is not found', async () => {
      const notFoundError = new Prisma.PrismaClientKnownRequestError('Record to update not found.', { code: 'P2025', clientVersion: 'x.y.z' });
      prismaMock.voucher.update.mockRejectedValue(notFoundError);
      const request = new NextRequest('http://localhost', {
        method: 'PUT',
        body: JSON.stringify({ stock: 99 }),
      });

      const response = await PUT(request, mockContext);
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error).toBe('Voucher not found');
    });

    it('should return 409 if another voucher with the same code already exists', async () => {
        prismaMock.voucher.findFirst.mockResolvedValue({ ...mockVoucher, id: 'v2' });
        const request = new NextRequest('http://localhost', {
          method: 'PUT',
          body: JSON.stringify({ code: 'SUMMER20' }),
        });

        const response = await PUT(request, mockContext);
        const body = await response.json();

        expect(response.status).toBe(409);
        expect(body.error).toBe('Another voucher with this code already exists');
      });
  });

  // --- DELETE ---
  describe('DELETE', () => {
    it('should delete a voucher and return a 204 status', async () => {
      prismaMock.voucher.delete.mockResolvedValue(mockVoucher);
      const response = await DELETE(new NextRequest('http://localhost'), mockContext);
      expect(response.status).toBe(204);
    });

    it('should return 404 if the voucher to delete is not found', async () => {
      const notFoundError = new Prisma.PrismaClientKnownRequestError('Record to delete not found.', { code: 'P2025', clientVersion: 'x.y.z' });
      prismaMock.voucher.delete.mockRejectedValue(notFoundError);
      const response = await DELETE(new NextRequest('http://localhost'), mockContext);
      const body = await response.json();
      expect(response.status).toBe(404);
      expect(body.error).toBe('Voucher not found');
    });

    it('should return 409 if the voucher is linked to an order', async () => {
        const foreignKeyError = new Prisma.PrismaClientKnownRequestError('Foreign key constraint failed.', { code: 'P2003', clientVersion: 'x.y.z' });
        prismaMock.voucher.delete.mockRejectedValue(foreignKeyError);
        const response = await DELETE(new NextRequest('http://localhost'), mockContext);
        const body = await response.json();
        expect(response.status).toBe(409);
        expect(body.error).toBe('Cannot delete voucher as it is associated with existing orders.');
      });
  });
});
