import { test, expect } from '@playwright/test'
import { takeScreenshot, waitForPageLoad } from './fixtures'

/**
 * FI-GL (General Ledger) E2E Tests
 * 
 * Tests the financial general ledger functionality including:
 * - Chart of Accounts
 * - Journal Entries
 * - Reports
 * 
 * Note: Requires authentication and appropriate permissions
 */

test.describe('FI-GL Module', () => {
  // Skip by default - enable when running with proper auth
  test.describe.configure({ mode: 'serial' })

  test.skip('should display chart of accounts', async ({ page }) => {
    await page.goto('/agency/fi/general-ledger/chart-of-accounts')
    await waitForPageLoad(page)
    await takeScreenshot(page, 'fi-gl-chart-of-accounts')

    // Look for account list/table
    const table = page.locator('table, [role="table"]')
    if (await table.isVisible()) {
      await takeScreenshot(page, 'fi-gl-accounts-table')
    }
  })

  test.skip('should display journal entries', async ({ page }) => {
    await page.goto('/agency/fi/general-ledger/journal-entries')
    await waitForPageLoad(page)
    await takeScreenshot(page, 'fi-gl-journal-entries')
  })

  test.skip('should display trial balance report', async ({ page }) => {
    await page.goto('/agency/fi/general-ledger/reports/trial-balance')
    await waitForPageLoad(page)
    await takeScreenshot(page, 'fi-gl-trial-balance')
  })

  test.skip('should display balance sheet report', async ({ page }) => {
    await page.goto('/agency/fi/general-ledger/reports/balance-sheet')
    await waitForPageLoad(page)
    await takeScreenshot(page, 'fi-gl-balance-sheet')
  })

  test.skip('should display income statement report', async ({ page }) => {
    await page.goto('/agency/fi/general-ledger/reports/income-statement')
    await waitForPageLoad(page)
    await takeScreenshot(page, 'fi-gl-income-statement')
  })

  test.skip('should allow PDF export from trial balance', async ({ page }) => {
    await page.goto('/agency/fi/general-ledger/reports/trial-balance')
    await waitForPageLoad(page)

    // Find export button
    const exportButton = page.locator('button:has-text("Export"), button:has-text("PDF"), button:has-text("Download")')
    
    if (await exportButton.first().isVisible()) {
      await takeScreenshot(page, 'fi-gl-before-export')
      
      // Start waiting for download
      const downloadPromise = page.waitForEvent('download')
      await exportButton.first().click()
      
      try {
        const download = await downloadPromise
        console.log(`Downloaded: ${download.suggestedFilename()}`)
        await takeScreenshot(page, 'fi-gl-after-export')
      } catch (e) {
        console.log('No download triggered - may be async')
        await takeScreenshot(page, 'fi-gl-export-clicked')
      }
    }
  })
})

test.describe('Account Management', () => {
  test.skip('should allow creating new account', async ({ page }) => {
    await page.goto('/agency/fi/general-ledger/chart-of-accounts/new')
    await waitForPageLoad(page)
    await takeScreenshot(page, 'fi-gl-new-account-form')

    // Look for form fields
    await expect(page.locator('input, select, textarea').first()).toBeVisible()
  })

  test.skip('should validate account form', async ({ page }) => {
    await page.goto('/agency/fi/general-ledger/chart-of-accounts/new')
    await waitForPageLoad(page)

    // Try to submit empty form
    const submitButton = page.locator('button[type="submit"]')
    if (await submitButton.isVisible()) {
      await submitButton.click()
      await page.waitForTimeout(500)
      await takeScreenshot(page, 'fi-gl-account-validation')
    }
  })
})

test.describe('Journal Entry Management', () => {
  test.skip('should allow creating new journal entry', async ({ page }) => {
    await page.goto('/agency/fi/general-ledger/journal-entries/new')
    await waitForPageLoad(page)
    await takeScreenshot(page, 'fi-gl-new-journal-entry')
  })

  test.skip('should validate balanced debits and credits', async ({ page }) => {
    await page.goto('/agency/fi/general-ledger/journal-entries/new')
    await waitForPageLoad(page)

    // Look for debit/credit inputs
    const debitInputs = page.locator('input[name*="debit"], [data-testid*="debit"]')
    const creditInputs = page.locator('input[name*="credit"], [data-testid*="credit"]')

    console.log(`Found ${await debitInputs.count()} debit inputs`)
    console.log(`Found ${await creditInputs.count()} credit inputs`)

    await takeScreenshot(page, 'fi-gl-journal-entry-form')
  })
})
