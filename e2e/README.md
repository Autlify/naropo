# E2E Tests

Automated end-to-end tests using Playwright with screenshot capture.

## Quick Start

```bash
# Run all tests
bun run test:e2e

# Run with UI mode (recommended for development)
bun run test:e2e:ui

# Run in headed mode (see browser)
bun run test:e2e:headed

# Debug mode
bun run test:e2e:debug

# View test report
bun run test:e2e:report
```

## Test Suites

| File | Description |
|------|-------------|
| `landing.spec.ts` | Landing page tests (hero, navigation, responsive) |
| `auth.spec.ts` | Authentication flow tests (sign-in, sign-up, password reset) |
| `billing.spec.ts` | Billing & subscription tests (pricing, checkout) |
| `dashboard.spec.ts` | Dashboard tests (requires auth) |
| `fi-gl.spec.ts` | FI-GL module tests (requires auth + permissions) |
| `iam-permission-version.spec.ts` | Permission version endpoint tests (401 unauth + ETag/304 auth flow) |

## Screenshots

Screenshots are automatically captured:
- On every test (success or failure)
- In `e2e/screenshots/` directory
- With timestamps for easy tracking

### Screenshot Naming Convention
```
{test-area}-{description}-{timestamp}.png
```

Examples:
- `landing-hero-2026-01-30T10-30-00.png`
- `auth-signin-page-2026-01-30T10-30-01.png`
- `billing-pricing-cards-2026-01-30T10-30-02.png`

## Configuration

Edit `playwright.config.ts` to:
- Change base URL
- Add more browsers (Firefox, Safari)
- Adjust viewport sizes
- Enable/disable video recording

## Running Against Production

```bash
# Set different base URL
E2E_BASE_URL=https://autlify.com bun run test:e2e
```

## CI/CD Integration

Tests are configured for CI:
- Runs in headless mode
- Retries failed tests twice
- Single worker for stability
- HTML report generation

## Adding New Tests

1. Create a new `.spec.ts` file in `e2e/`
2. Import from `./fixtures.ts`
3. Use `takeScreenshot()` for screenshots
4. Use `waitForPageLoad()` before interactions

Example:
```typescript
import { test, expect } from '@playwright/test'
import { takeScreenshot, waitForPageLoad } from './fixtures'

test.describe('My Feature', () => {
  test('should work correctly', async ({ page }) => {
    await page.goto('/my-feature')
    await waitForPageLoad(page)
    await takeScreenshot(page, 'my-feature-initial')
    
    // Your test assertions
    await expect(page.locator('h1')).toBeVisible()
  })
})
```

## Artifacts

| Folder | Contents |
|--------|----------|
| `e2e/screenshots/` | Screenshots from tests |
| `e2e/results/` | Test artifacts (videos, traces) |
| `e2e/report/` | HTML test report |

## Authenticated Tests

Dashboard and FI-GL tests require authentication. To run these:

1. Set up test credentials in `.env.test`:
   ```
   E2E_TEST_EMAIL=test@example.com
   E2E_TEST_PASSWORD=TestPassword123!
   ```

2. Update `fixtures.ts` to use these credentials

3. Remove `.skip` from test blocks
