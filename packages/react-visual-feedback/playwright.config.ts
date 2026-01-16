import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

/**
 * BDD Test Directory Configuration
 *
 * This generates test files from Gherkin feature files using playwright-bdd.
 * The generated files are placed in .features-gen directory.
 */
const bddTestDir = defineBddConfig({
  features: './tests/bdd/features/**/*.feature',
  steps: ['./tests/bdd/steps/**/*.ts', './tests/bdd/fixtures.ts'],
  outputDir: './.features-gen',
});

/**
 * Playwright configuration for end-to-end tests.
 *
 * Tests run against the feedback-example Next.js app which demonstrates
 * all library features.
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Test directory - use BDD generated tests
  testDir: bddTestDir,

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if test.only is found
  forbidOnly: !!process.env.CI,

  // Retry failed tests on CI
  retries: process.env.CI ? 2 : 0,

  // Limit parallel workers on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter
  reporter: [
    ['html', { outputFolder: './playwright-report', open: 'never' }],
    ['list'],
    process.env.CI ? ['github'] : ['dot'],
  ],

  // Shared settings for all projects
  use: {
    // Base URL for navigation
    baseURL: 'http://localhost:3002',

    // Collect trace on first retry
    trace: 'on-first-retry',

    // Capture screenshot on failure
    screenshot: 'only-on-failure',

    // Capture video on first retry
    video: 'on-first-retry',

    // Timeouts
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  // Test timeout
  timeout: 30000,

  // Expect timeout
  expect: {
    timeout: 5000,
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Mobile viewports
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },

    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // Run your local dev server before starting the tests
  webServer: {
    command: 'cd ../feedback-example && npm run dev',
    url: 'http://localhost:3002',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  // Output directory for test artifacts
  outputDir: './test-results',
});
