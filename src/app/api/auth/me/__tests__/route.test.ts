import { GET } from '../route';
import prisma from '@/lib/prisma';
import { getAuthCookie, verifyToken, JwtPayload } from '@/lib/auth';
import { DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

// Mock auth functions
jest.mock('@/lib/auth', () => ({
  ...jest.requireActual('@/lib/auth'),
  getAuthCookie: jest.fn(),
  verifyToken: jest.fn(),
}));

const mockedGetAuthCookie = getAuthCookie as jest.Mock;
const mockedVerifyToken = verifyToken as jest.Mock;

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

describe('API /auth/me', () => {
  const mockAdmin = {
    id: 'clx123abcde',
    name: 'Test Admin',
    email: 'admin@test.com',
    password: 'hashedpassword123',
    role: 'ADMIN' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockJwtPayload: JwtPayload = {
    sub: mockAdmin.id,
    email: mockAdmin.email,
    role: mockAdmin.role,
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should return 200 and user data for a valid token', async () => {
    // Arrange
    mockedGetAuthCookie.mockResolvedValue('fake-jwt-token');
    mockedVerifyToken.mockResolvedValue(mockJwtPayload);
    prismaMock.admin.findUnique.mockResolvedValue(mockAdmin);

    // Act
    const response = await GET();
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body.name).toBe(mockAdmin.name);
    expect(body.email).toBe(mockAdmin.email);
    expect(body.role).toBe(mockAdmin.role);
  });

  it('should return 401 if no token is provided', async () => {
    // Arrange
    mockedGetAuthCookie.mockResolvedValue(null);

    // Act
    const response = await GET();
    const body = await response.json();

    // Assert
    expect(response.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('should return 401 if token is invalid', async () => {
    // Arrange
    mockedGetAuthCookie.mockResolvedValue('invalid-token');
    mockedVerifyToken.mockResolvedValue(null);

    // Act
    const response = await GET();
    const body = await response.json();

    // Assert
    expect(response.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('should return 401 if user from token is not found in DB', async () => {
    // Arrange
    mockedGetAuthCookie.mockResolvedValue('valid-token-for-deleted-user');
    mockedVerifyToken.mockResolvedValue(mockJwtPayload);
    prismaMock.admin.findUnique.mockResolvedValue(null); // User not found

    // Act
    const response = await GET();
    const body = await response.json();

    // Assert
    expect(response.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('should return 500 if database lookup fails', async () => {
    // Arrange
    mockedGetAuthCookie.mockResolvedValue('fake-jwt-token');
    mockedVerifyToken.mockResolvedValue(mockJwtPayload);
    prismaMock.admin.findUnique.mockRejectedValue(new Error('DB Error'));

    // Suppress console.error for this error test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Act
    const response = await GET();
    const body = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(body.error).toBe('Failed to fetch current user');
    expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));

    // Restore console.error
    consoleSpy.mockRestore();
  });
});
