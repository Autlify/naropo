import { test, expect } from '@playwright/test'
import { takeScreenshot, waitForPageLoad } from './fixtures'

/**
 * Landing Page E2E Tests
 * 
 * Tests the landing page functionality including:
 * - Page load performance
 * - Hero section
 * - Navigation
 * - Footer
 */

test.describe('Landing Page', () => {
  test('should load landing page successfully', async ({ page }) => {
    await page.goto('/')
    await waitForPageLoad(page)

    // Take hero section screenshot
    await takeScreenshot(page, 'landing-hero')

    // Verify page loaded
    await expect(page).toHaveTitle(/.+/)
  })

  test('should display hero section', async ({ page }) => {
    await page.goto('/')
    await waitForPageLoad(page)

    // Look for hero elements
    const hero = page.locator('header, [class*="hero"], main > section:first-child')
    await expect(hero.first()).toBeVisible()

    await page.screenshot({
      path: 'e2e/screenshots/landing-hero-section.png',
    })
  })

  test('should display navigation correctly', async ({ page }) => {
    await page.goto('/')
    await waitForPageLoad(page)

    // Find navigation
    const nav = page.locator('nav, header')
    await expect(nav.first()).toBeVisible()

    await takeScreenshot(page, 'landing-navigation')
  })

  test('should have working navigation links', async ({ page }) => {
    await page.goto('/')
    await waitForPageLoad(page)

    // Find sign-in link
    const signInLink = page.locator('a[href*="sign-in"]').first()
    
    if (await signInLink.isVisible()) {
      await signInLink.click()
      await page.waitForURL('**/sign-in**')
      await takeScreenshot(page, 'landing-to-signin-navigation')
    }
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    await waitForPageLoad(page)

    await page.screenshot({
      path: 'e2e/screenshots/landing-mobile-view.png',
      fullPage: true,
    })
  })

  test('should be responsive on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/')
    await waitForPageLoad(page)

    await page.screenshot({
      path: 'e2e/screenshots/landing-tablet-view.png',
      fullPage: true,
    })
  })

  test('should display footer', async ({ page }) => {
    await page.goto('/')
    await waitForPageLoad(page)

    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(500)

    const footer = page.locator('footer')
    if (await footer.isVisible()) {
      await takeScreenshot(page, 'landing-footer')
    }
  })
})

test.describe('Dark Mode', () => {
  test('should support dark mode toggle', async ({ page }) => {
    await page.goto('/')
    await waitForPageLoad(page)

    // Screenshot in default mode
    await takeScreenshot(page, 'landing-default-mode')

    // Try to find and click theme toggle
    const themeToggle = page.locator('[class*="theme"], button[aria-label*="theme"], button[aria-label*="mode"]')
    
    if (await themeToggle.first().isVisible()) {
      await themeToggle.first().click()
      await page.waitForTimeout(500)
      await takeScreenshot(page, 'landing-toggled-mode')
    }
  })

  test('should support forced dark mode via preference', async ({ page }) => {
    // Set dark mode preference
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/')
    await waitForPageLoad(page)

    await page.screenshot({
      path: 'e2e/screenshots/landing-dark-mode-forced.png',
      fullPage: true,
    })
  })
})

test.describe('Performance', () => {
  test('should load within acceptable time', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/')
    await waitForPageLoad(page)
    const loadTime = Date.now() - startTime

    console.log(`Page load time: ${loadTime}ms`)
    
    // Take performance screenshot
    await takeScreenshot(page, `landing-performance-${loadTime}ms`)
    
    // Assert reasonable load time (adjust as needed)
    expect(loadTime).toBeLessThan(10000) // 10 seconds max
  })
})
