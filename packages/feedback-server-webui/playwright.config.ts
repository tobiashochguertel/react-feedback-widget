import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for feedback-server-webui E2E tests.
 *
 * Tests run against the WebUI which connects to the feedback-server API.
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Test directory
  testDir: "./tests/e2e",

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
    ["html", { outputFolder: "./playwright-report", open: "never" }],
    ["list"],
    process.env.CI ? ["github"] : ["dot"],
  ],

  // Shared settings for all projects
  use: {
    // Base URL for navigation (WebUI dev server)
    baseURL: "http://localhost:5173",

    // Collect trace on first retry
    trace: "on-first-retry",

    // Capture screenshot on failure
    screenshot: "only-on-failure",

    // Capture video on first retry
    video: "on-first-retry",
  },

  // Configure projects for major browsers
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },

    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },

    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },

    // Mobile viewports
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },

    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 12"] },
    },
  ],

  // Web Server - start Vite dev server before running tests
  webServer: [
    {
      command: "bun run dev",
      url: "http://localhost:5173",
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
    {
      command: "cd ../feedback-server && bun run dev",
      url: "http://localhost:3001/api/v1/health",
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
  ],
});
