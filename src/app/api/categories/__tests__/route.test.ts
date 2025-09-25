import { GET, POST } from '../route';
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { DeepMockProxy } from 'jest-mock-extended';
import { Prisma, PrismaClient } from '@prisma/client';

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

describe('API /categories', () => {
  const mockCategories = [
    { id: 'cat1', name: 'Electronics' },
    { id: 'cat2', name: 'Books' },
  ];

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('GET', () => {
    it('should return a list of categories and a 200 status', async () => {
      // Arrange
      prismaMock.category.findMany.mockResolvedValue(mockCategories);

      // Act
      const response = await GET();
      const body = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(body).toEqual(mockCategories);
    });

    it('should return 500 if the database call fails', async () => {
      // Arrange
      prismaMock.category.findMany.mockRejectedValue(new Error('DB Error'));

      // Suppress console.error for this error test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // Act
      const response = await GET();
      const body = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(body.error).toBe('Failed to fetch categories');
      expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));

      // Restore console.error
      consoleSpy.mockRestore();
    });
  });

  describe('POST', () => {
    const newCategory = { id: 'cat3', name: 'Apparel' };

    it('should create a new category and return it with a 201 status', async () => {
      // Arrange
      prismaMock.category.findFirst.mockResolvedValue(null); // No existing category
      prismaMock.category.create.mockResolvedValue(newCategory);

      const requestBody = { name: 'Apparel' };
      const request = new NextRequest('http://localhost/api/categories', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      // Act
      const response = await POST(request);
      const body = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(body).toEqual(newCategory);
    });

    it('should return 400 for invalid input data', async () => {
      // Arrange
      const requestBody = { name: '' }; // Invalid name
      const request = new NextRequest('http://localhost/api/categories', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      // Act
      const response = await POST(request);
      const body = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(body.error).toBe('Invalid request');
    });

    it('should return 409 if a category with the same name already exists', async () => {
      // Arrange
      prismaMock.category.findFirst.mockResolvedValue(mockCategories[0]); // Simulate existing category

      const requestBody = { name: 'Electronics' };
      const request = new NextRequest('http://localhost/api/categories', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      // Act
      const response = await POST(request);
      const body = await response.json();

      // Assert
      expect(response.status).toBe(409);
      expect(body.error).toBe('Category with this name already exists');
    });

    it('should return 500 if the database call fails', async () => {
        // Arrange
        prismaMock.category.findFirst.mockResolvedValue(null);
        prismaMock.category.create.mockRejectedValue(new Error('DB Error'));

        // Suppress console.error for this error test
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        const requestBody = { name: 'Apparel' };
        const request = new NextRequest('http://localhost/api/categories', {
          method: 'POST',
          body: JSON.stringify(requestBody),
        });

        // Act
        const response = await POST(request);
        const body = await response.json();

        // Assert
        expect(response.status).toBe(500);
        expect(body.error).toBe('Failed to create category');
        expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));

        // Restore console.error
        consoleSpy.mockRestore();
    });
  });
});
