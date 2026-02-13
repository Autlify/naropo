import { hmacSha256Hex, timingSafeEqualHex } from './crypto'

export function verifyGitHubSignature256(opts: {
  webhookSecret: string
  rawBody: string | Buffer
  signatureHeader: string | null
}) {
  const sig = opts.signatureHeader || ''
  if (!sig.startsWith('sha256=')) return false
  const expected = 'sha256=' + hmacSha256Hex(opts.webhookSecret, opts.rawBody)
  // Compare hex parts in a timing-safe way
  const expectedHex = expected.replace('sha256=', '')
  const actualHex = sig.replace('sha256=', '')
  return timingSafeEqualHex(expectedHex, actualHex)
}

export function verifySlackSignature(opts: {
  signingSecret: string
  rawBody: string | Buffer
  timestampHeader: string | null
  signatureHeader: string | null
  toleranceSeconds?: number
}) {
  const timestamp = Number(opts.timestampHeader || '0')
  if (!timestamp || !opts.signatureHeader) return false

  const tolerance = opts.toleranceSeconds ?? 300
  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - timestamp) > tolerance) return false

  // Slack base string: v0:{timestamp}:{rawBody}
  const base = `v0:${timestamp}:${typeof opts.rawBody === 'string' ? opts.rawBody : opts.rawBody.toString('utf8')}`
  const expectedHex = hmacSha256Hex(opts.signingSecret, base)
  const expected = `v0=${expectedHex}`

  // timing-safe compare on hex portion
  const actual = opts.signatureHeader
  if (!actual.startsWith('v0=')) return false
  return timingSafeEqualHex(expected.replace('v0=', ''), actual.replace('v0=', ''))
}
