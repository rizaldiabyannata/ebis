import { GET, PUT, DELETE } from '../route';
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { DeepMockProxy } from 'jest-mock-extended';
import { Prisma, PrismaClient } from '@prisma/client';

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

describe('API /categories/[id]', () => {
  const mockCategory = { id: 'cat1', name: 'Electronics', products: [] };
  const mockContext = { params: { id: 'cat1' } };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  // --- GET /api/categories/[id] ---
  describe('GET', () => {
    it('should return a category and a 200 status if found', async () => {
      prismaMock.category.findUnique.mockResolvedValue(mockCategory);
      const response = await GET(new NextRequest('http://localhost'), mockContext);
      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body).toEqual(mockCategory);
    });

    it('should return 404 if the category is not found', async () => {
      prismaMock.category.findUnique.mockResolvedValue(null);
      const response = await GET(new NextRequest('http://localhost'), mockContext);
      const body = await response.json();
      expect(response.status).toBe(404);
      expect(body.error).toBe('Category not found');
    });
  });

  // --- PUT /api/categories/[id] ---
  describe('PUT', () => {
    it('should update a category and return it with a 200 status', async () => {
      const updatedCategory = { ...mockCategory, name: 'Digital Goods' };
      prismaMock.category.findFirst.mockResolvedValue(null);
      prismaMock.category.update.mockResolvedValue(updatedCategory);
      const request = new NextRequest('http://localhost', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Digital Goods' }),
      });

      const response = await PUT(request, mockContext);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual(updatedCategory);
    });

    it('should return 400 for invalid input data', async () => {
      const request = new NextRequest('http://localhost', {
        method: 'PUT',
        body: JSON.stringify({ name: '' }),
      });
      const response = await PUT(request, mockContext);
      const body = await response.json();
      expect(response.status).toBe(400);
      expect(body.error).toBe('Invalid request');
    });

    it('should return 404 if the category to update is not found', async () => {
      const notFoundError = new Prisma.PrismaClientKnownRequestError('Record to update not found.', {
        code: 'P2025',
        clientVersion: 'x.y.z',
      });
      prismaMock.category.findFirst.mockResolvedValue(null);
      prismaMock.category.update.mockRejectedValue(notFoundError);
      const request = new NextRequest('http://localhost', {
        method: 'PUT',
        body: JSON.stringify({ name: 'A valid name' }),
      });

      const response = await PUT(request, mockContext);
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error).toBe('Category not found');
    });

    it('should return 409 if another category with the same name already exists', async () => {
      prismaMock.category.findFirst.mockResolvedValue({ id: 'cat2', name: 'Digital Goods', products: [] });
      const request = new NextRequest('http://localhost', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Digital Goods' }),
      });

      const response = await PUT(request, mockContext);
      const body = await response.json();

      expect(response.status).toBe(409);
      expect(body.error).toBe('Another category with this name already exists');
    });
  });

  // --- DELETE /api/categories/[id] ---
  describe('DELETE', () => {
    it('should delete a category and return a 204 status', async () => {
      prismaMock.category.delete.mockResolvedValue(mockCategory);
      const response = await DELETE(new NextRequest('http://localhost'), mockContext);
      expect(response.status).toBe(204);
    });

    it('should return 404 if the category to delete is not found', async () => {
      const notFoundError = new Prisma.PrismaClientKnownRequestError('Record to delete not found.', {
        code: 'P2025',
        clientVersion: 'x.y.z',
      });
      prismaMock.category.delete.mockRejectedValue(notFoundError);

      const response = await DELETE(new NextRequest('http://localhost'), mockContext);
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error).toBe('Category not found');
    });
  });
});
