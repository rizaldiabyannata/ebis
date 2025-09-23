import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: ['node_modules/(?!(jose)/)'],
};

export default async function jestConfig() {
  // Let next/jest create the base config, then ensure our overrides (especially transformIgnorePatterns) are applied
  const base = await createJestConfig(customJestConfig)();
  return {
    ...base,
    testEnvironment: customJestConfig.testEnvironment,
    transformIgnorePatterns: customJestConfig.transformIgnorePatterns,
  } as Config;
}
