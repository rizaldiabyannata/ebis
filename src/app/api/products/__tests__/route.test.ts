import { GET, POST } from '../route';
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { DeepMockProxy } from 'jest-mock-extended';
import { Prisma, PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

describe('API /products', () => {
  const mockCategoryId = randomUUID();
  const mockProducts = [
    {
      id: randomUUID(),
      name: 'Laptop',
      description: 'A powerful laptop',
      categoryId: mockCategoryId,
      category: { id: mockCategoryId, name: 'Electronics', products: [] },
      variants: [],
      images: [],
    },
  ];

  beforeEach(() => {
    jest.resetAllMocks();
  });

  // --- GET ---
  describe('GET', () => {
    it('should return a list of products and a 200 status', async () => {
      prismaMock.product.findMany.mockResolvedValue(mockProducts);
      const response = await GET();
      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body).toEqual(mockProducts);
    });

    it('should return 500 if the database call fails', async () => {
      prismaMock.product.findMany.mockRejectedValue(new Error('DB Error'));
      
      // Suppress console.error for this error test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const response = await GET();
      const body = await response.json();
      expect(response.status).toBe(500);
      expect(body.error).toBe('Failed to fetch products');
      expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));

      // Restore console.error
      consoleSpy.mockRestore();
    });
  });

  // --- POST ---
  describe('POST', () => {
    const validProductData = {
      name: 'New Keyboard',
      description: 'Mechanical keyboard',
      categoryId: mockCategoryId, // Use a valid UUID
      images: [{ imageUrl: '/test.jpg', isMain: true }],
      variants: [{ name: 'Blue Switch', sku: 'KB-BLUE', price: 99.99, stock: 100 }],
    };

    // Suppress console.log for all POST tests to clean up output
    let consoleLogSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
    });

    it('should create a new product and return it with a 201 status', async () => {
      prismaMock.category.findUnique.mockResolvedValue({ id: mockCategoryId, name: 'Electronics' });
      prismaMock.product.create.mockResolvedValue({ ...mockProducts[0], name: 'New Keyboard' });
      const request = new NextRequest('http://localhost', { method: 'POST', body: JSON.stringify(validProductData) });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.name).toBe('New Keyboard');
    });

    it('should auto-assign the first image as main if none is specified', async () => {
        const productDataNoMain = { ...validProductData, images: [{ imageUrl: '/test.jpg', isMain: false }]};
        prismaMock.category.findUnique.mockResolvedValue({ id: mockCategoryId, name: 'Electronics' });
        prismaMock.product.create.mockResolvedValue(mockProducts[0]);
        const request = new NextRequest('http://localhost', { method: 'POST', body: JSON.stringify(productDataNoMain) });

        await POST(request);

        expect(prismaMock.product.create).toHaveBeenCalled();
        const createCall = prismaMock.product.create.mock.calls[0][0];
        expect(createCall.data.images?.create && Array.isArray(createCall.data.images.create) 
          ? createCall.data.images.create[0].isMain : true).toBe(true);
    });

    it('should return 400 if more than one image is set as main', async () => {
        const productDataMultiMain = { ...validProductData, images: [{ imageUrl: '/test.jpg', isMain: true }, { imageUrl: '/test2.jpg', isMain: true }]};
        prismaMock.category.findUnique.mockResolvedValue({ id: mockCategoryId, name: 'Electronics' });
        const request = new NextRequest('http://localhost', { method: 'POST', body: JSON.stringify(productDataMultiMain) });

        const response = await POST(request);
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body.error).toBe('Only one image can be set as the main image');
    });

    it('should return 404 if the category does not exist', async () => {
      prismaMock.category.findUnique.mockResolvedValue(null);
      const request = new NextRequest('http://localhost', { method: 'POST', body: JSON.stringify(validProductData) });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error).toContain(`Category with ID ${mockCategoryId} not found`);
    });

    it('should return 409 if a variant SKU already exists', async () => {
      const p2002Error = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', { code: 'P2002', clientVersion: 'x.y.z', meta: { target: ['sku'] } });
      prismaMock.category.findUnique.mockResolvedValue({ id: mockCategoryId, name: 'Electronics' });
      prismaMock.product.create.mockRejectedValue(p2002Error);
      
      // Suppress console.error for this error test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const request = new NextRequest('http://localhost', { method: 'POST', body: JSON.stringify(validProductData) });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(409);
      expect(body.error).toBe('A product with the same SKU already exists.');
      expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));

      // Restore console.error
      consoleSpy.mockRestore();
    });
  });
});
