import { GET, PUT, DELETE } from '../route';
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { DeepMockProxy } from 'jest-mock-extended';
import { Prisma, PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

describe('API /products/[id]', () => {
  const mockProductId = randomUUID();
  const mockCategoryId = randomUUID();
  const mockProduct = {
    id: mockProductId,
    name: 'Laptop',
    description: 'A powerful laptop',
    categoryId: mockCategoryId,
  };
  const mockContext = { params: { id: mockProductId } };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  // --- GET ---
  describe('GET', () => {
    it('should return a product and a 200 status if found', async () => {
      prismaMock.product.findUnique.mockResolvedValue(mockProduct);
      const response = await GET(new NextRequest('http://localhost'), mockContext);
      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body.id).toBe(mockProductId);
    });

    it('should return 404 if the product is not found', async () => {
      prismaMock.product.findUnique.mockResolvedValue(null);
      const response = await GET(new NextRequest('http://localhost'), mockContext);
      const body = await response.json();
      expect(response.status).toBe(404);
      expect(body.error).toBe('Product not found');
    });
  });

  // --- PUT ---
  describe('PUT', () => {
    it('should update a product and return it with a 200 status', async () => {
      const updatedProduct = { ...mockProduct, name: 'Gaming Laptop' };
      prismaMock.product.update.mockResolvedValue(updatedProduct);
      const request = new NextRequest('http://localhost', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Gaming Laptop' }),
      });

      const response = await PUT(request, mockContext);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.name).toBe('Gaming Laptop');
    });

    it('should return 404 if updating with a non-existent categoryId', async () => {
        const newCategoryId = randomUUID();
        prismaMock.category.findUnique.mockResolvedValue(null); // Category not found
        const request = new NextRequest('http://localhost', {
          method: 'PUT',
          body: JSON.stringify({ categoryId: newCategoryId }),
        });

        const response = await PUT(request, mockContext);
        const body = await response.json();

        expect(response.status).toBe(404);
        expect(body.error).toContain(`Category with ID ${newCategoryId} not found`);
      });

    it('should return 404 if the product to update is not found', async () => {
      const notFoundError = new Prisma.PrismaClientKnownRequestError('Record to update not found.', { code: 'P2025', clientVersion: 'x.y.z' });
      prismaMock.product.update.mockRejectedValue(notFoundError);
      const request = new NextRequest('http://localhost', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Does not matter' }),
      });

      const response = await PUT(request, mockContext);
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error).toBe('Product not found');
    });
  });

  // --- DELETE ---
  describe('DELETE', () => {
    it('should delete a product and return a 204 status', async () => {
      prismaMock.product.delete.mockResolvedValue(mockProduct);
      const response = await DELETE(new NextRequest('http://localhost'), mockContext);
      expect(response.status).toBe(204);
    });

    it('should return 404 if the product to delete is not found', async () => {
      const notFoundError = new Prisma.PrismaClientKnownRequestError('Record to delete not found.', { code: 'P2025', clientVersion: 'x.y.z' });
      prismaMock.product.delete.mockRejectedValue(notFoundError);
      const response = await DELETE(new NextRequest('http://localhost'), mockContext);
      const body = await response.json();
      expect(response.status).toBe(404);
      expect(body.error).toBe('Product not found');
    });
  });
});
