import crypto from 'crypto'

export function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex')
}

export function sha256Hex(input: string | Buffer) {
  return crypto.createHash('sha256').update(input).digest('hex')
}

export function hmacSha256Hex(secret: string | Buffer, data: string | Buffer) {
  return crypto.createHmac('sha256', secret).update(data).digest('hex')
}

export function timingSafeEqualHex(aHex: string, bHex: string) {
  const a = Buffer.from(aHex, 'hex')
  const b = Buffer.from(bHex, 'hex')
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}


// AES-256-GCM helpers for encrypting secrets at rest.
// Provide AUTLIFY_ENCRYPTION_KEY as 32-byte key in hex or base64.
function getEncryptionKey(): Buffer | null {
  const raw = process.env.AUTLIFY_ENCRYPTION_KEY
  if (!raw) return null
  // hex (64 chars) or base64
  if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, 'hex')
  try {
    const b = Buffer.from(raw, 'base64')
    if (b.length === 32) return b
  } catch {}
  return null
}

export function encryptStringGcm(plain: string): string | null {
  const key = getEncryptionKey()
  if (!key) return null
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  // v1.<iv>.<ciphertext>.<tag> (base64url)
  const b64url = (buf: Buffer) => buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
  return `v1.${b64url(iv)}.${b64url(enc)}.${b64url(tag)}`
}

export function decryptStringGcm(blob: string): string | null {
  const key = getEncryptionKey()
  if (!key) return null
  const parts = String(blob).split('.')
  if (parts.length !== 4 || parts[0] !== 'v1') return null

  const b64urlToBuf = (s: string) => {
    const pad = '='.repeat((4 - (s.length % 4)) % 4)
    const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + pad
    return Buffer.from(b64, 'base64')
  }

  const iv = b64urlToBuf(parts[1])
  const enc = b64urlToBuf(parts[2])
  const tag = b64urlToBuf(parts[3])

  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(tag)
    const dec = Buffer.concat([decipher.update(enc), decipher.final()])
    return dec.toString('utf8')
  } catch {
    return null
  }
}
