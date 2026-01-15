import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

/**
 * Vitest configuration for react-visual-feedback library.
 *
 * Test structure:
 * - tests/unit/       - Unit tests for individual modules
 * - tests/integration/ - Integration tests for component interactions
 * - tests/e2e/        - End-to-end tests (run with Playwright)
 *
 * @see https://vitest.dev/config/
 */
export default defineConfig({
  test: {
    // Environment
    environment: 'jsdom',

    // Global setup
    globals: true,
    setupFiles: ['./tests/setup.ts'],

    // Test file patterns
    include: [
      'tests/unit/**/*.{test,spec}.{ts,tsx}',
      'tests/integration/**/*.{test,spec}.{ts,tsx}',
    ],
    exclude: [
      'tests/e2e/**/*',
      'node_modules/**/*',
      'dist/**/*',
    ],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/types/**/*',
        'src/**/__tests__/**/*',
        'src/**/index.ts',
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

    // Type checking
    // TODO: Re-enable when memory issues are resolved
    typecheck: {
      enabled: false,
      tsconfig: './tsconfig.json',
    },

    // Reporter options
    reporters: ['default', 'html'],
    outputFile: {
      html: './test-results/index.html',
    },

    // Test timeouts
    testTimeout: 10000,
    hookTimeout: 10000,

    // Retry failed tests
    retry: 0,

    // Watch mode options
    watch: false,
    watchExclude: ['node_modules/**', 'dist/**'],

    // Threading (Vitest 4+ uses top-level pool options)
    pool: 'threads',

    // Mocking
    mockReset: true,
    restoreMocks: true,
    clearMocks: true,
  },

  // Thread pool options (moved to top level in Vitest 4)
  poolOptions: {
    threads: {
      singleThread: false,
    },
  },

  // Path resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
    // Prefer .ts/.tsx over .js/.jsx when both exist
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
  },

  // esbuild options for JSX
  esbuild: {
    jsx: 'automatic',
  },
});
