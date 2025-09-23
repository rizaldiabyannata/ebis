/**
 * @jest-environment node
 */

import {
  AUTH_COOKIE_NAME,
  clearAuthCookieOnResponse,
  getAuthCookie,
  getSecret,
  parseExpiry,
  setAuthCookieOnResponse,
  signToken,
  verifyToken,
} from '../auth';

jest.mock('next/headers', () => {
  return {
    cookies: jest.fn(),
  };
});

describe('auth/getSecret', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('should throw an error if AUTH_SECRET is not set', () => {
    delete process.env.AUTH_SECRET;
    expect(() => getSecret()).toThrow('AUTH_SECRET is not set');
  });

  it('should return the secret if it is set', () => {
    process.env.AUTH_SECRET = 'test-secret';
    const secret = getSecret();
    expect(secret).toBeInstanceOf(Uint8Array);
  });
});

describe('auth/parseExpiry', () => {
  it('should parse seconds', () => {
    expect(parseExpiry('10s')).toBe(10);
  });

  it('should parse minutes', () => {
    expect(parseExpiry('5m')).toBe(300);
  });

  it('should parse hours', () => {
    expect(parseExpiry('2h')).toBe(7200);
  });

  it('should parse days', () => {
    expect(parseExpiry('3d')).toBe(259200);
  });

  it('should return default for invalid input', () => {
    const sevenDays = 7 * 24 * 60 * 60;
    expect(parseExpiry('invalid')).toBe(sevenDays);
    expect(parseExpiry('1w')).toBe(sevenDays);
    expect(parseExpiry('')).toBe(sevenDays);
  });
});

describe('auth/signToken and auth/verifyToken', () => {
  beforeAll(() => {
    process.env.AUTH_SECRET = 'test-secret';
  });

  it('should sign and verify a token', async () => {
    const payload = {
      sub: '123',
      email: 'test@example.com',
      role: 'ADMIN' as const,
    };
    const token = await signToken(payload);
    const verified = await verifyToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.sub).toBe(payload.sub);
    expect(verified?.email).toBe(payload.email);
    expect(verified?.role).toBe(payload.role);
  });

  it('should return null for an invalid token', async () => {
    const verified = await verifyToken('invalid-token');
    expect(verified).toBeNull();
  });
});

describe('auth cookie functions', () => {
  it('should set the auth cookie on the response', () => {
    const mockSet = jest.fn();
    const mockRes = {
      cookies: {
        set: mockSet,
      },
    } as any;
    setAuthCookieOnResponse(mockRes, 'test-token');
    expect(mockSet).toHaveBeenCalledWith('auth_token', 'test-token', {
      httpOnly: true,
      secure: false, // NODE_ENV is 'test'
      sameSite: 'lax',
      path: '/',
      maxAge: 604800,
    });
  });

  it('should clear the auth cookie on the response', () => {
    const mockSet = jest.fn();
    const mockRes = {
      cookies: {
        set: mockSet,
      },
    } as any;
    clearAuthCookieOnResponse(mockRes);
    expect(mockSet).toHaveBeenCalledWith('auth_token', '', {
      httpOnly: true,
      secure: false, // NODE_ENV is 'test'
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
  });
});

describe('auth/getAuthCookie', () => {
  const { cookies } = require('next/headers');

  it('should return the auth token if it exists', async () => {
    cookies.mockReturnValue({
      get: jest.fn().mockReturnValue({ value: 'test-token' }),
    });
    const token = await getAuthCookie();
    expect(token).toBe('test-token');
    expect(cookies().get).toHaveBeenCalledWith(AUTH_COOKIE_NAME);
  });

  it('should return null if the auth token does not exist', async () => {
    cookies.mockReturnValue({
      get: jest.fn().mockReturnValue(undefined),
    });
    const token = await getAuthCookie();
    expect(token).toBeNull();
  });
});
