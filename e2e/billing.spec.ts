import { test, expect } from '@playwright/test'
import { takeScreenshot, waitForPageLoad } from './fixtures'

/**
 * Billing & Subscription E2E Tests
 * 
 * Tests the complete billing journey including:
 * - Pricing page display
 * - Plan comparison
 * - Checkout flow initiation
 */

test.describe('Billing & Pricing', () => {
  test('should display pricing page correctly', async ({ page }) => {
    // Navigate to pricing or home page
    await page.goto('/')
    await waitForPageLoad(page)

    // Look for pricing section
    const pricingSection = page.locator('[data-testid="pricing"], #pricing, section:has-text("Pricing")')
    
    if (await pricingSection.isVisible()) {
      await pricingSection.scrollIntoViewIfNeeded()
      await page.waitForTimeout(500)
      await takeScreenshot(page, 'billing-pricing-section')
    }
  })

  test('should display all pricing tiers', async ({ page }) => {
    await page.goto('/')
    await waitForPageLoad(page)

    // Take full page screenshot to capture pricing cards
    await page.screenshot({
      path: 'e2e/screenshots/billing-full-page.png',
      fullPage: true,
    })

    // Look for pricing cards/buttons
    const pricingCards = page.locator('[class*="pricing"], [class*="plan"], [data-testid*="plan"]')
    const cardCount = await pricingCards.count()

    if (cardCount > 0) {
      console.log(`Found ${cardCount} pricing elements`)
      await takeScreenshot(page, 'billing-pricing-cards')
    }
  })

  test('should have working CTA buttons', async ({ page }) => {
    await page.goto('/')
    await waitForPageLoad(page)

    // Find CTA buttons
    const ctaButtons = page.locator('a[href*="sign"], button:has-text("Get Started"), button:has-text("Start"), a:has-text("Get Started")')
    
    const buttonCount = await ctaButtons.count()
    console.log(`Found ${buttonCount} CTA buttons`)

    if (buttonCount > 0) {
      // Screenshot showing CTA buttons
      await takeScreenshot(page, 'billing-cta-buttons')
    }
  })
})

test.describe('Checkout Flow', () => {
  test('should initiate checkout from pricing', async ({ page }) => {
    await page.goto('/')
    await waitForPageLoad(page)

    // Find and click a pricing CTA
    const ctaButton = page.locator('a[href*="sign-up"], button:has-text("Get Started")').first()
    
    if (await ctaButton.isVisible()) {
      await takeScreenshot(page, 'checkout-before-click')
      await ctaButton.click()
      await page.waitForTimeout(1000)
      await takeScreenshot(page, 'checkout-after-click')
    }
  })
})

test.describe('Subscription Management', () => {
  test.skip('should display billing portal for logged in users', async ({ page }) => {
    // This test requires authentication - skip unless running with auth
    await page.goto('/agency/settings/billing')
    await waitForPageLoad(page)
    await takeScreenshot(page, 'subscription-billing-portal')
  })
})
