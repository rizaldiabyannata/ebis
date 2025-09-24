import { PrismaClient } from '@prisma/client'
import { mockDeep, DeepMockProxy } from 'jest-mock-extended'

// This file provides a deep mock of the PrismaClient.
// jest-mock-extended is used to create a type-safe mock that
// allows faking return values for any Prisma method.

// We export a single instance of the mock, which will be used
// across all test files.
const prismaMock = mockDeep<PrismaClient>()
export default prismaMock

// We also export the type of the mock for convenience in test files.
export type MockPrismaClient = DeepMockProxy<PrismaClient>
