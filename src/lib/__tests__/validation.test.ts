import { imageUrlSchema } from '../validation';

describe('validation/imageUrlSchema', () => {
  it('should accept a valid absolute http URL', () => {
    const result = imageUrlSchema.safeParse('http://example.com/image.png');
    expect(result.success).toBe(true);
  });

  it('should accept a valid absolute https URL', () => {
    const result = imageUrlSchema.safeParse('https://example.com/image.png');
    expect(result.success).toBe(true);
  });

  it('should accept a valid relative URL', () => {
    const result = imageUrlSchema.safeParse('/uploads/image.png');
    expect(result.success).toBe(true);
  });

  it('should reject an invalid URL', () => {
    const result = imageUrlSchema.safeParse('not-a-url');
    expect(result.success).toBe(false);
  });

  it('should reject a URL with a different protocol', () => {
    const result = imageUrlSchema.safeParse('ftp://example.com/image.png');
    expect(result.success).toBe(false);
  });
});
