import { POST } from '../route';
import { NextRequest } from 'next/server';
import { AUTH_COOKIE_NAME } from '@/lib/auth';

describe('API /auth/logout', () => {
  it('should return 200 and a cookie-clearing header', async () => {
    // Arrange
    const request = new NextRequest('http://localhost/api/auth/logout', {
      method: 'POST',
    });

    // Act
    const response = await POST();
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body.message).toBe('Logout successful');

    const cookie = response.headers.get('Set-Cookie');
    expect(cookie).not.toBeNull();
    expect(cookie).toContain(`${AUTH_COOKIE_NAME}=;`);
    expect(cookie?.toLowerCase()).toContain('max-age=0');
  });
});
