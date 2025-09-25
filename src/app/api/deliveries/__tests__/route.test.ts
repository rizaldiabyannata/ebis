import { GET } from '../route';
import prisma from '@/lib/prisma';
import { DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { randomUUID } from 'crypto';

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

describe('API /deliveries', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('GET', () => {
    it('should return a list of deliveries and a 200 status', async () => {
      const mockDeliveries = [
        {
          id: randomUUID(),
          address: '123 Main St',
          recipientName: 'John Doe',
          recipientPhone: '555-1234',
          driverName: null,
          deliveryFee: new Decimal(0),
          status: 'PREPARING',
          orderId: randomUUID(),
        },
      ];
      prismaMock.delivery.findMany.mockResolvedValue(mockDeliveries as any);

      const response = await GET();
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toHaveLength(1);
      expect(body[0].id).toBe(mockDeliveries[0].id);
    });

    it('should return 500 if the database call fails', async () => {
      prismaMock.delivery.findMany.mockRejectedValue(new Error('DB Error'));
      
      // Suppress console.error for this error test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const response = await GET();
      const body = await response.json();
      expect(response.status).toBe(500);
      expect(body.error).toBe('Failed to fetch deliveries');
      expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));

      // Restore console.error
      consoleSpy.mockRestore();
    });
  });
});
