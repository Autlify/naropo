import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E Test Configuration
 * 
 * Usage:
 *   bun run test:e2e           # Run all tests
 *   bun run test:e2e:ui        # Run with UI mode
 *   bun run test:e2e:headed    # Run in headed mode
 *   bun run test:e2e:debug     # Run in debug mode
 */

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  reporter: [
    ['html', { outputFolder: 'e2e/report' }],
    ['list'],
  ],

  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    
    // Take screenshot on failure
    screenshot: 'on',
    
    // Record video on failure
    video: 'on-first-retry',
    
    // Trace on failure for debugging
    trace: 'on-first-retry',
    
    // Viewport szei
    viewport: { width: 1280, height: 720 },
    
    // Ignore HTTPS errors for local development
    ignoreHTTPSErrors: true,
  },

  // Screenshot settings
  expect: {
    toHaveScreenshot: {
      maxDiffPixels: 100,
    },
  },

  // Global timeout
  timeout: 30000,

  // Output folder for test artifacts
  outputDir: 'e2e/results',

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Add more browsers if needed:
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
    // Mobile viewports:
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
  ],

  // Run local dev server before tests
  webServer: {
    command: 'bun run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})
