import { test, expect } from '@playwright/test'

/**
 * E2E Test Fixtures and Utilities
 */

// Re-export test and expect with custom configurations
export { test, expect }

/**
 * Take a full-page screenshot with timestamp
 */
export async function takeScreenshot(
  page: import('@playwright/test').Page,
  name: string
): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  await page.screenshot({
    path: `e2e/screenshots/${name}-${timestamp}.png`,
    fullPage: true,
  })
}

/**
 * Wait for page to be fully loaded
 */
export async function waitForPageLoad(
  page: import('@playwright/test').Page
): Promise<void> {
  await page.waitForLoadState('networkidle')
  await page.waitForLoadState('domcontentloaded')
}

/**
 * Login helper
 */
export async function login(
  page: import('@playwright/test').Page,
  email: string,
  password: string
): Promise<void> {
  await page.goto('/sign-in')
  await page.fill('input[name="email"]', email)
  await page.click('button[type="submit"]')
  
  // Wait for password field to appear
  await page.waitForSelector('input[name="password"]')
  await page.fill('input[name="password"]', password)
  await page.click('button[type="submit"]')
  
  // Wait for redirect after login
  await page.waitForURL('**/agency/**', { timeout: 10000 })
}

/**
 * Generate test user credentials
 */
export function generateTestUser(): { email: string; password: string; name: string } {
  const timestamp = Date.now()
  return {
    email: `test-${timestamp}@autlify-e2e.test`,
    password: 'TestPassword123!',
    name: `Test User ${timestamp}`,
  }
}
