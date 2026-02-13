import { NextResponse } from 'next/server'
import { requireIntegrationAuth } from '@/lib/features/org/integrations/guards'
import { signOAuthState, verifyOAuthState } from '@/lib/features/org/integrations/oauth'
import { upsertConnection, updateConnectionById } from '@/lib/features/org/integrations/store'
import { KEYS } from '@/lib/registry/keys/permissions'

type Props = { params: Promise<{ provider: string }> }

/**
 * GET /api/features/core/webhooks/providers/:provider/oauth
 * 
 * Without code param: Start OAuth flow (redirect to provider consent screen)
 * With code param: Handle OAuth callback (exchange code for token)
 */
export async function GET(req: Request, props: Props) {
  const { provider } = await props.params
  const url = new URL(req.url)
  const code = url.searchParams.get('code')

  // If code is present, this is a callback
  if (code) {
    return handleCallback(req, provider, url)
  }

  // Otherwise, start OAuth flow
  return handleStart(req, provider, url)
}

// ============ START OAUTH ============

async function handleStart(req: Request, provider: string, url: URL) {
  try {
    const auth = await requireIntegrationAuth(req, { requireWrite: true, requiredKeys: [KEYS.org.apps.webhooks.manage] })

    // Create/update connection record
    const connection = await upsertConnection({
      scope: auth.scope,
      provider,
      status: 'DISCONNECTED',
    })

    const redirectUri = getRedirectUri(provider, url)
    const state = signOAuthState({
      provider,
      scope: auth.scope,
      connectionId: connection?.id,
      t: Date.now(),
    })

    const redirectTo = buildProviderAuthUrl(provider, {
      redirectUri,
      state,
    })

    return NextResponse.redirect(redirectTo)
  } catch (e: any) {
    if (e instanceof Response) return e
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============ CALLBACK ============

async function handleCallback(req: Request, provider: string, url: URL) {
  try {
    const code = url.searchParams.get('code')!
    const state = url.searchParams.get('state')

    if (!state) return NextResponse.json({ error: 'Missing state' }, { status: 400 })

    const decoded = verifyOAuthState<{ provider: string; connectionId?: string }>(state)
    if (!decoded || decoded.provider !== provider) {
      return NextResponse.json({ error: 'Invalid state' }, { status: 400 })
    }
    if (!decoded.connectionId) {
      return NextResponse.json({ error: 'Missing connectionId in state' }, { status: 400 })
    }

    const redirectUri = getRedirectUri(provider, url)
    const token = await exchangeCodeForToken(provider, { code, redirectUri })

    await updateConnectionById(decoded.connectionId, {
      status: 'CONNECTED',
      credentials: token,
    })

    // Redirect back to Apps Hub (best-effort)
    const back = url.searchParams.get('back') || '/'
    return NextResponse.redirect(new URL(back, url.origin))
  } catch (e: any) {
    if (e instanceof Response) return e
    console.error(e)
    return NextResponse.json({ error: 'OAuth callback failed' }, { status: 500 })
  }
}

// ============ HELPERS ============

function getRedirectUri(provider: string, reqUrl: URL) {
  const origin = reqUrl.origin
  return `${origin}/api/features/core/webhooks/providers/${provider}/oauth`
}

function buildProviderAuthUrl(provider: string, opts: { redirectUri: string; state: string }) {
  if (provider === 'github') {
    const clientId = process.env.GITHUB_CLIENT_ID
    if (!clientId) throw new Response('Missing GITHUB_CLIENT_ID', { status: 500 })
    const p = new URL('https://github.com/login/oauth/authorize')
    p.searchParams.set('client_id', clientId)
    p.searchParams.set('redirect_uri', opts.redirectUri)
    p.searchParams.set('state', opts.state)
    p.searchParams.set('scope', process.env.GITHUB_SCOPES || 'read:user repo')
    return p.toString()
  }

  if (provider === 'slack') {
    const clientId = process.env.SLACK_CLIENT_ID
    if (!clientId) throw new Response('Missing SLACK_CLIENT_ID', { status: 500 })
    const p = new URL('https://slack.com/oauth/v2/authorize')
    p.searchParams.set('client_id', clientId)
    p.searchParams.set('redirect_uri', opts.redirectUri)
    p.searchParams.set('state', opts.state)
    p.searchParams.set('scope', process.env.SLACK_SCOPES || 'chat:write,channels:read')
    return p.toString()
  }

  throw new Response('Unsupported provider', { status: 400 })
}

async function exchangeCodeForToken(provider: string, opts: { code: string; redirectUri: string }) {
  if (provider === 'github') {
    const clientId = process.env.GITHUB_CLIENT_ID
    const clientSecret = process.env.GITHUB_CLIENT_SECRET
    if (!clientId || !clientSecret) throw new Response('Missing GitHub OAuth env', { status: 500 })

    const res = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: opts.code,
        redirect_uri: opts.redirectUri,
      }),
    })
    const json = await res.json()
    if (!res.ok) throw new Response('GitHub token exchange failed', { status: 400 })
    return {
      provider: 'github',
      access_token: json.access_token,
      scope: json.scope,
      token_type: json.token_type,
    }
  }

  if (provider === 'slack') {
    const clientId = process.env.SLACK_CLIENT_ID
    const clientSecret = process.env.SLACK_CLIENT_SECRET
    if (!clientId || !clientSecret) throw new Response('Missing Slack OAuth env', { status: 500 })

    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code: opts.code,
      redirect_uri: opts.redirectUri,
    })

    const res = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    })
    const json = await res.json()
    if (!res.ok || !json.ok) throw new Response('Slack token exchange failed', { status: 400 })
    return json
  }

  throw new Response('Unsupported provider', { status: 400 })
}
