import { POST } from '../route';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { signToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

// Mock dependencies
jest.mock('bcrypt');
// We only need to mock signToken, let other auth functions run as normal
jest.mock('@/lib/auth', () => ({
  ...jest.requireActual('@/lib/auth'),
  signToken: jest.fn(),
}));

const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockedSignToken = signToken as jest.Mock;

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

describe('API /auth/login', () => {
  const mockAdmin = {
    id: 'clx123abcde',
    name: 'Test Admin',
    email: 'admin@test.com',
    password: 'hashedpassword123',
    role: 'ADMIN' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should return 200, user data, and set a cookie on successful login', async () => {
    // Arrange
    prismaMock.admin.findUnique.mockResolvedValue(mockAdmin);
    mockedBcrypt.compare.mockResolvedValue(true as never);
    mockedSignToken.mockResolvedValue('fake-jwt-token');

    const requestBody = { email: 'admin@test.com', password: 'password123' };
    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    // Act
    const response = await POST(request);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body.name).toBe(mockAdmin.name);
    expect(body.email).toBe(mockAdmin.email);
    expect(body.role).toBe(mockAdmin.role);
    expect(body.token).toBeUndefined(); // Token should not be in the body

    const cookie = response.headers.get('Set-Cookie');
    expect(cookie).not.toBeNull();
    // Perform case-insensitive checks for cookie attributes
    const lowerCaseCookie = cookie!.toLowerCase();
    expect(lowerCaseCookie).toContain(`${AUTH_COOKIE_NAME.toLowerCase()}=fake-jwt-token`);
    expect(lowerCaseCookie).toContain('httponly');
    expect(lowerCaseCookie).toContain('path=/');
    expect(lowerCaseCookie).toContain('samesite=lax');
  });

  it('should return 400 for invalid request body', async () => {
    // Arrange
    const requestBody = { email: 'admin@test.com' }; // Missing password
    const request = new NextRequest('http://localhost/api/auth/login', {
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

  it('should return 401 for non-existent user', async () => {
    // Arrange
    prismaMock.admin.findUnique.mockResolvedValue(null);

    const requestBody = { email: 'nouser@test.com', password: 'password123' };
    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    // Act
    const response = await POST(request);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(401);
    expect(body.error).toBe('Invalid email or password');
  });

  it('should return 401 for incorrect password', async () => {
    // Arrange
    prismaMock.admin.findUnique.mockResolvedValue(mockAdmin);
    mockedBcrypt.compare.mockResolvedValue(false as never);

    const requestBody = { email: 'admin@test.com', password: 'wrongpassword' };
    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    // Act
    const response = await POST(request);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(401);
    expect(body.error).toBe('Invalid email or password');
  });

  it('should return 500 if database lookup fails', async () => {
    // Arrange
    prismaMock.admin.findUnique.mockRejectedValue(new Error('DB Error'));

    // Suppress console.error for this error test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const requestBody = { email: 'admin@test.com', password: 'password123' };
    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    // Act
    const response = await POST(request);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(body.error).toBe('Failed to login');
    expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));

    // Restore console.error
    consoleSpy.mockRestore();
  });
});
