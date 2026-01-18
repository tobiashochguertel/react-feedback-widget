import { defineConfig } from 'vitest/config';

/**
 * Vitest configuration for feedback-server-cli package.
 *
 * Test structure:
 * - tests/unit/       - Unit tests for individual modules
 * - tests/integration/ - Integration tests against running server
 *
 * @see https://vitest.dev/config/
 */
export default defineConfig({
  test: {
    // Environment - Node.js for CLI
    environment: 'node',

    // Global setup
    globals: true,
    setupFiles: ['./tests/setup.ts'],

    // Test file patterns
    include: [
      'tests/unit/**/*.{test,spec}.ts',
      'tests/integration/**/*.{test,spec}.ts',
    ],
    exclude: ['node_modules/**/*', 'dist/**/*'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/types/**/*',
        'src/index.ts', // Entry point
      ],
      // Thresholds
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
        },
      },
    },

    // Test timeout
    testTimeout: 10000,
  },
});
