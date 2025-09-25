import { GET, PUT, DELETE } from '../route';
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { DeepMockProxy } from 'jest-mock-extended';
import { Prisma, PrismaClient, Role } from '@prisma/client';
import { randomUUID } from 'crypto';

// Mock bcrypt
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

describe('API /admins/[id]', () => {
  const mockAdminId = randomUUID();
  const mockAdmin = {
    id: mockAdminId,
    name: 'Test Admin',
    email: 'test@admin.com',
    password: 'hashedpassword',
    role: 'ADMIN' as Role,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const mockContext = { params: { id: mockAdminId } };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  // --- GET ---
  describe('GET', () => {
    it('should return an admin without the password and a 200 status if found', async () => {
      prismaMock.admin.findUnique.mockResolvedValue(mockAdmin);
      const response = await GET(new NextRequest('http://localhost'), mockContext);
      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body.id).toBe(mockAdminId);
      expect(body.password).toBeUndefined();
    });

    it('should return 404 if the admin is not found', async () => {
      prismaMock.admin.findUnique.mockResolvedValue(null);
      const response = await GET(new NextRequest('http://localhost'), mockContext);
      const body = await response.json();
      expect(response.status).toBe(404);
      expect(body.error).toBe('Admin not found');
    });
  });

  // --- PUT ---
  describe('PUT', () => {
    it('should update an admin and return it without the password', async () => {
      const updatedAdmin = { ...mockAdmin, name: 'Updated Name' };
      prismaMock.admin.update.mockResolvedValue(updatedAdmin);
      const request = new NextRequest('http://localhost', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated Name' }),
      });
      const response = await PUT(request, mockContext);
      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body.name).toBe('Updated Name');
      expect(body.password).toBeUndefined();
    });

    it('should hash a new password if provided', async () => {
        mockedBcrypt.hash.mockResolvedValue('newhashedpassword' as never);
        prismaMock.admin.update.mockResolvedValue(mockAdmin);
        const request = new NextRequest('http://localhost', {
          method: 'PUT',
          body: JSON.stringify({ password: 'newpassword123' }),
        });
        await PUT(request, mockContext);
        expect(mockedBcrypt.hash).toHaveBeenCalledWith('newpassword123', 10);
        const updateData = prismaMock.admin.update.mock.calls[0][0].data;
        expect(updateData.password).toBe('newhashedpassword');
      });

    it('should return 409 if another admin with the same email already exists', async () => {
      prismaMock.admin.findFirst.mockResolvedValue({ ...mockAdmin, id: randomUUID() });
      const request = new NextRequest('http://localhost', {
        method: 'PUT',
        body: JSON.stringify({ email: 'test@admin.com' }),
      });
      const response = await PUT(request, mockContext);
      const body = await response.json();
      expect(response.status).toBe(409);
      expect(body.error).toBe('Another admin with this email already exists');
    });
  });

  // --- DELETE ---
  describe('DELETE', () => {
    it('should delete an admin and return a 204 status', async () => {
      prismaMock.admin.delete.mockResolvedValue(mockAdmin);
      const response = await DELETE(new NextRequest('http://localhost'), mockContext);
      expect(response.status).toBe(204);
    });

    it('should return 404 if the admin to delete is not found', async () => {
      const notFoundError = new Prisma.PrismaClientKnownRequestError('Record to delete not found.', { code: 'P2025', clientVersion: 'x.y.z' });
      prismaMock.admin.delete.mockRejectedValue(notFoundError);
      const response = await DELETE(new NextRequest('http://localhost'), mockContext);
      const body = await response.json();
      expect(response.status).toBe(404);
      expect(body.error).toBe('Admin not found');
    });
  });
});
