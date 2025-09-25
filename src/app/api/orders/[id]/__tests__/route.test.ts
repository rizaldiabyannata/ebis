import { GET } from '../route';
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
type RouteContext = Parameters<typeof GET>[1];

describe('API /orders/[id]', () => {
  const mockOrderId = randomUUID();
  const mockOrder = {
    id: mockOrderId,
    orderNumber: 'ORDER-1234',
    status: 'PENDING',
    subtotal: 40,
    totalDiscount: 5,
    totalFinal: 35,
    voucherId: null,
    orderDate: new Date(),
  };
  const mockContext: RouteContext = { params: Promise.resolve({ id: mockOrderId }) };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('GET', () => {
    it('should return an order and a 200 status if found', async () => {
      prismaMock.order.findUnique.mockResolvedValue(mockOrder as any);
      const response = await GET(new NextRequest('http://localhost'), mockContext);
      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body.id).toBe(mockOrderId);
    });

    it('should return 404 if the order is not found', async () => {
      prismaMock.order.findUnique.mockResolvedValue(null);
      const response = await GET(new NextRequest('http://localhost'), mockContext);
      const body = await response.json();
      expect(response.status).toBe(404);
      expect(body.error).toBe('Order not found');
    });

    it('should return 500 if the database call fails', async () => {
        prismaMock.order.findUnique.mockRejectedValue(new Error('DB Error'));
        
        // Suppress console.error for this error test
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        
        const response = await GET(new NextRequest('http://localhost'), mockContext);
        const body = await response.json();
        expect(response.status).toBe(500);
        expect(body.error).toBe('Failed to fetch order');
        expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));

        // Restore console.error
        consoleSpy.mockRestore();
      });
  });
});
