import { GET } from '../route';
import prisma from '@/lib/prisma';
import { DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

describe('API /admin/stats', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should return a JSON object with counts of all entities', async () => {
    // Arrange
    const mockCounts = {
      products: 10,
      categories: 5,
      vouchers: 20,
      orders: 50,
      deliveries: 45,
      admins: 2,
    };

    prismaMock.product.count.mockResolvedValue(mockCounts.products);
    prismaMock.category.count.mockResolvedValue(mockCounts.categories);
    prismaMock.voucher.count.mockResolvedValue(mockCounts.vouchers);
    prismaMock.order.count.mockResolvedValue(mockCounts.orders);
    prismaMock.delivery.count.mockResolvedValue(mockCounts.deliveries);
    prismaMock.admin.count.mockResolvedValue(mockCounts.admins);

    // Act
    const response = await GET();
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body).toEqual(mockCounts);
  });

  it('should return 500 if any database call fails', async () => {
    // Arrange
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    prismaMock.product.count.mockRejectedValue(new Error('DB Error'));
    prismaMock.category.count.mockResolvedValue(5);
    // ... other mocks don't matter as Promise.all will reject

    // Act
    const response = await GET();
    const body = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(body.error).toBe('Failed to fetch stats');
    expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
    
    // Cleanup
    consoleSpy.mockRestore();
  });
});