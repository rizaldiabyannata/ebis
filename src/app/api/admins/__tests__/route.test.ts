import { GET, POST } from '../route';
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

describe('API /admins', () => {
  const mockAdmins = [
    { id: randomUUID(), name: 'Admin One', email: 'one@test.com', password: 'hash1', role: 'ADMIN' as Role, createdAt: new Date(), updatedAt: new Date() },
    { id: randomUUID(), name: 'Admin Two', email: 'two@test.com', password: 'hash2', role: 'SUPER_ADMIN' as Role, createdAt: new Date(), updatedAt: new Date() },
  ];

  beforeEach(() => {
    jest.resetAllMocks();
  });

  // --- GET ---
  describe('GET', () => {
    it('should return a list of admins without passwords and a 200 status', async () => {
      prismaMock.admin.findMany.mockResolvedValue(mockAdmins);
      const response = await GET();
      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body).toHaveLength(2);
      expect(body[0].name).toBe('Admin One');
      expect(body[0].password).toBeUndefined();
      expect(body[1].password).toBeUndefined();
    });
  });

  // --- POST ---
  describe('POST', () => {
    const newAdminData = {
      name: 'Admin Three',
      email: 'three@test.com',
      password: 'password123',
      role: 'ADMIN' as Role,
    };

    it('should create a new admin, hash the password, and return the new admin without the password', async () => {
      const createdAdmin = { ...mockAdmins[0], ...newAdminData, id: randomUUID() };
      prismaMock.admin.findUnique.mockResolvedValue(null);
      mockedBcrypt.hash.mockResolvedValue('hashedpassword' as never);
      prismaMock.admin.create.mockResolvedValue(createdAdmin);

      const request = new NextRequest('http://localhost', { method: 'POST', body: JSON.stringify(newAdminData) });
      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(mockedBcrypt.hash).toHaveBeenCalledWith('password123', 10);
      const createData = prismaMock.admin.create.mock.calls[0][0].data;
      expect(createData.password).toBe('hashedpassword');
      expect(body.email).toBe(newAdminData.email);
      expect(body.password).toBeUndefined();
    });

    it('should return 400 for invalid input data', async () => {
      const request = new NextRequest('http://localhost', { method: 'POST', body: JSON.stringify({ ...newAdminData, email: 'invalid' }) });
      const response = await POST(request);
      const body = await response.json();
      expect(response.status).toBe(400);
      expect(body.error).toBe('Invalid request');
    });

    it('should return 409 if an admin with the same email already exists', async () => {
      prismaMock.admin.findUnique.mockResolvedValue(mockAdmins[0]);
      const request = new NextRequest('http://localhost', { method: 'POST', body: JSON.stringify({ ...newAdminData, email: 'one@test.com' }) });
      const response = await POST(request);
      const body = await response.json();
      expect(response.status).toBe(409);
      expect(body.error).toBe('An admin with this email already exists');
    });
  });
});
