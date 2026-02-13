import { test, expect } from './fixtures'

const ENDPOINT_PATH = '/api/features/core/iam/permissions/version'

test.describe('IAM Permission Version API', () => {
  test('returns 401 for unauthenticated requests', async ({ request }) => {
    const response = await request.get(`${ENDPOINT_PATH}?agencyId=test-agency`)
    expect(response.status()).toBe(401)

    const body = await response.json()
    expect(body).toMatchObject({
      ok: false,
      reason: 'UNAUTHENTICATED',
    })
  })
})

test.describe('IAM Permission Version API (authenticated)', () => {
  test.skip(
    !process.env.E2E_AUTH_STORAGE_STATE || !process.env.E2E_TEST_AGENCY_ID,
    'Set E2E_AUTH_STORAGE_STATE and E2E_TEST_AGENCY_ID to run authenticated permission-version checks.'
  )

  test.use({ storageState: process.env.E2E_AUTH_STORAGE_STATE })

  test('returns ETag on first request and 304 on conditional request', async ({ request }) => {
    const agencyId = process.env.E2E_TEST_AGENCY_ID as string
    const endpoint = `${ENDPOINT_PATH}?agencyId=${encodeURIComponent(agencyId)}`

    const first = await request.get(endpoint)
    expect(first.status()).toBe(200)

    const etag = first.headers()['etag']
    expect(etag).toBeTruthy()

    const firstBody = await first.json()
    expect(firstBody).toMatchObject({
      ok: true,
      scopeKey: expect.any(String),
      permissionHash: expect.any(String),
      permissionVersion: expect.any(Number),
    })

    const second = await request.get(endpoint, {
      headers: {
        'if-none-match': etag as string,
      },
    })

    expect(second.status()).toBe(304)
  })
})
