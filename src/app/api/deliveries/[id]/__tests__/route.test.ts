import { PUT } from '../route';
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { DeepMockProxy } from 'jest-mock-extended';
import { Prisma, PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { randomUUID } from 'crypto';

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

describe('API /deliveries/[id]', () => {
  const mockDeliveryId = randomUUID();
  const mockDelivery = {
    id: mockDeliveryId,
    address: '123 Main St',
    recipientName: 'John Doe',
    recipientPhone: '555-1234',
    driverName: null,
    deliveryFee: new Decimal(0),
    status: 'PREPARING',
    orderId: randomUUID(),
  };
  const mockContext = { params: { id: mockDeliveryId } };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('PUT', () => {
    it('should update a delivery and return it with a 200 status', async () => {
      const updatedDelivery = { ...mockDelivery, status: 'SHIPPED', driverName: 'Driver Dan' };
      prismaMock.delivery.update.mockResolvedValue(updatedDelivery as any);
      const request = new NextRequest('http://localhost', {
        method: 'PUT',
        body: JSON.stringify({ status: 'SHIPPED', driverName: 'Driver Dan' }),
      });

      const response = await PUT(request, mockContext);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.status).toBe('SHIPPED');
      expect(body.driverName).toBe('Driver Dan');
    });

    it('should return 400 if no fields to update are provided', async () => {
        const request = new NextRequest('http://localhost', {
          method: 'PUT',
          body: JSON.stringify({}),
        });
        const response = await PUT(request, mockContext);
        const body = await response.json();
        expect(response.status).toBe(400);
        expect(body.error).toBe('No fields to update');
      });

    it('should return 404 if the delivery to update is not found', async () => {
      const notFoundError = new Prisma.PrismaClientKnownRequestError('Record to update not found.', { code: 'P2025', clientVersion: 'x.y.z' });
      prismaMock.delivery.update.mockRejectedValue(notFoundError);
      const request = new NextRequest('http://localhost', {
        method: 'PUT',
        body: JSON.stringify({ status: 'DELIVERED' }),
      });

      const response = await PUT(request, mockContext);
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error).toBe('Delivery record not found');
    });
  });
});
