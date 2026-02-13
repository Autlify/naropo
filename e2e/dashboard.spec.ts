import { test, expect } from '@playwright/test'
import { takeScreenshot, waitForPageLoad, login, generateTestUser } from './fixtures'

/**
 * Dashboard E2E Tests
 * 
 * Tests authenticated dashboard functionality including:
 * - Dashboard access
 * - Navigation within dashboard
 * - Settings pages
 * 
 * Note: These tests require authentication setup
 */

test.describe('Dashboard', () => {
  // Skip these tests by default - enable when running with proper auth
  test.describe.configure({ mode: 'serial' })

  test.skip('should redirect unauthenticated users', async ({ page }) => {
    await page.goto('/agency')
    await waitForPageLoad(page)

    // Should redirect to sign-in
    await expect(page).toHaveURL(/sign-in/)
    await takeScreenshot(page, 'dashboard-redirect-unauthenticated')
  })

  test.skip('should display dashboard for authenticated users', async ({ page }) => {
    // This would require actual login credentials
    const testUser = generateTestUser()
    
    // Attempt login (will fail without real credentials)
    await login(page, testUser.email, testUser.password)
    
    await takeScreenshot(page, 'dashboard-main')
  })

  test.skip('should display sidebar navigation', async ({ page }) => {
    await page.goto('/agency')
    await waitForPageLoad(page)

    const sidebar = page.locator('[class*="sidebar"], aside, nav[aria-label*="Main"]')
    if (await sidebar.first().isVisible()) {
      await takeScreenshot(page, 'dashboard-sidebar')
    }
  })
})

test.describe('Settings Pages', () => {
  test.skip('should display profile settings', async ({ page }) => {
    await page.goto('/agency/settings/profile')
    await waitForPageLoad(page)
    await takeScreenshot(page, 'settings-profile')
  })

  test.skip('should display billing settings', async ({ page }) => {
    await page.goto('/agency/settings/billing')
    await waitForPageLoad(page)
    await takeScreenshot(page, 'settings-billing')
  })

  test.skip('should display security settings', async ({ page }) => {
    await page.goto('/agency/settings/security')
    await waitForPageLoad(page)
    await takeScreenshot(page, 'settings-security')
  })

  test.skip('should display roles settings', async ({ page }) => {
    await page.goto('/agency/settings/roles')
    await waitForPageLoad(page)
    await takeScreenshot(page, 'settings-roles')
  })
})

test.describe('Agency Management', () => {
  test.skip('should display agency creation page', async ({ page }) => {
    await page.goto('/agency/create')
    await waitForPageLoad(page)
    await takeScreenshot(page, 'agency-create')
  })

  test.skip('should display team members page', async ({ page }) => {
    await page.goto('/agency/team')
    await waitForPageLoad(page)
    await takeScreenshot(page, 'agency-team')
  })
})
