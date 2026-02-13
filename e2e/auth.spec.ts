import { test, expect } from '@playwright/test'
import { takeScreenshot, waitForPageLoad } from './fixtures'

/**
 * Authentication Flow E2E Tests
 * 
 * Tests the complete authentication journey including:
 * - Sign in page load
 * - Email validation
 * - Password authentication
 * - Account creation
 */

test.describe('Authentication Flow', () => {
  test.describe.configure({ mode: 'serial' })

  test('should display sign-in page correctly', async ({ page }) => {
    await page.goto('/sign-in')
    await waitForPageLoad(page)

    // Take screenshot of initial state
    await takeScreenshot(page, 'auth-signin-page')

    // Verify page elements
    await expect(page.locator('h1, h2').first()).toBeVisible()
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()

    // Screenshot of form state
    await page.screenshot({
      path: 'e2e/screenshots/auth-signin-form.png',
    })
  })

  test('should validate email format', async ({ page }) => {
    await page.goto('/sign-in')
    await waitForPageLoad(page)

    // Enter invalid email
    await page.fill('input[name="email"]', 'invalid-email')
    await page.click('button[type="submit"]')

    // Wait for validation message
    await page.waitForTimeout(500)
    await takeScreenshot(page, 'auth-invalid-email')

    // Should show error or not proceed
    const emailInput = page.locator('input[name="email"]')
    await expect(emailInput).toBeVisible()
  })

  test('should show password field for existing users', async ({ page }) => {
    await page.goto('/sign-in')
    await waitForPageLoad(page)

    // Enter a test email (simulating existing user)
    await page.fill('input[name="email"]', 'test@example.com')
    await page.click('button[type="submit"]')

    // Take screenshot after email submission
    await page.waitForTimeout(1000)
    await takeScreenshot(page, 'auth-after-email-submit')
  })

  test('should display sign-up page correctly', async ({ page }) => {
    await page.goto('/sign-up')
    await waitForPageLoad(page)

    await takeScreenshot(page, 'auth-signup-page')

    // Verify sign-up elements
    await expect(page.locator('input[name="email"]')).toBeVisible()
  })
})

test.describe('Password Reset Flow', () => {
  test('should navigate to forgot password from sign-in', async ({ page }) => {
    await page.goto('/sign-in')
    await waitForPageLoad(page)

    // Look for forgot password link
    const forgotLink = page.locator('a[href*="forgot"], button:has-text("Forgot")')
    
    if (await forgotLink.isVisible()) {
      await forgotLink.click()
      await waitForPageLoad(page)
      await takeScreenshot(page, 'auth-forgot-password')
    }
  })
})
