import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import { mockReset } from 'jest-mock-extended';
import prisma from '@/lib/prisma'; // This will resolve to the mock thanks to the jest.mock call

/**
 * Mock the Prisma client for all tests.
 * By creating a manual mock in `src/lib/__mocks__/prisma.ts`, Jest will automatically
 * use it when `jest.mock` is called for that module.
 */
jest.mock('@/lib/prisma');

/**
 * Reset the mock's state before each test.
 * This is crucial for ensuring that tests are isolated and do not interfere with each other.
 * `mockReset` clears all mock calls and replaces implementations with empty functions.
 */
beforeEach(() => {
  mockReset(prisma);
});

// Polyfills for features that may not be available in the JSDOM/Node environment
global.TextEncoder = TextEncoder as any;
global.TextDecoder = TextDecoder as any;
