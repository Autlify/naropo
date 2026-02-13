import 'server-only'

import { hmacSha256Hex } from './crypto'

export type OutboundWebhookHeaders = Record<string, string>

export function signAutlifyWebhook(opts: {
  secret: string
  body: string
  timestamp?: number
}) {
  const t = opts.timestamp ?? Math.floor(Date.now() / 1000)
  const base = `t=${t}.${opts.body}`
  const v1 = hmacSha256Hex(opts.secret, base)
  return { timestamp: t, signature: `t=${t},v1=${v1}` }
}

export async function sendWebhookAttempt(opts: {
  url: string
  secret?: string | null
  body: any
  headers?: OutboundWebhookHeaders
  timeoutMs?: number
}) {
  const bodyStr = JSON.stringify(opts.body ?? {})
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    ...(opts.headers ?? {}),
  }

  if (opts.secret) {
    const { timestamp, signature } = signAutlifyWebhook({
      secret: opts.secret,
      body: bodyStr,
    })
    headers['x-autlify-timestamp'] = String(timestamp)
    headers['x-autlify-signature'] = signature
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs ?? 15000)

  const start = Date.now()
  try {
    const res = await fetch(opts.url, {
      method: 'POST',
      headers,
      body: bodyStr,
      signal: controller.signal,
    })
    const durationMs = Date.now() - start
    const text = await res.text().catch(() => '')
    return { ok: res.ok, status: res.status, body: text, durationMs }
  } catch (e: any) {
    const durationMs = Date.now() - start
    return { ok: false, status: null, body: null, error: e?.message ?? String(e), durationMs }
  } finally {
    clearTimeout(timeout)
  }
}
