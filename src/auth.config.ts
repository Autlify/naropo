import type { NextAuthConfig } from 'next-auth'
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id'
import GitHub from 'next-auth/providers/github'
import Keycloak from 'next-auth/providers/keycloak'
import Zitadel from 'next-auth/providers/zitadel'

// Edge-compatible auth config (no Prisma)
const githubClientId = process.env.GITHUB_CLIENT_ID
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET

// Support both legacy env var names and the newer "ENTRA"-prefixed keys used in your .env.
const microsoftClientId = process.env.MICROSOFT_CLIENT_ID || process.env.MICROSOFT_ENTRA_ID_ID
const microsoftClientSecret =
  process.env.MICROSOFT_CLIENT_SECRET || process.env.MICROSOFT_ENTRA_ID_SECRET
const microsoftTenantId = process.env.MICROSOFT_TENANT_ID || process.env.MICROSOFT_ENTRA_ID_TENANT

const providers: NextAuthConfig['providers'] = []

// Only register providers when fully configured; this prevents "error=Configuration" in production.
if (githubClientId && githubClientSecret) {
  providers.push(
    GitHub({
      clientId: githubClientId,
      clientSecret: githubClientSecret,
    })
  )
}

if (microsoftClientId && microsoftClientSecret && microsoftTenantId) {
  providers.push(
    MicrosoftEntraID({
      clientId: microsoftClientId,
      clientSecret: microsoftClientSecret,
      issuer: `https://login.microsoftonline.com/${microsoftTenantId}/v2.0`,
    })
  )
}

// Keycloak (OIDC)
const keycloakClientId = process.env.KEYCLOAK_CLIENT_ID
const keycloakClientSecret = process.env.KEYCLOAK_CLIENT_SECRET
const keycloakIssuer = process.env.KEYCLOAK_ISSUER
if (keycloakClientId && keycloakClientSecret && keycloakIssuer) {
  providers.push(
    Keycloak({
      clientId: keycloakClientId,
      clientSecret: keycloakClientSecret,
      issuer: keycloakIssuer,
    })
  )
}

// ZITADEL (OIDC)
const zitadelClientId = process.env.ZITADEL_CLIENT_ID
const zitadelClientSecret = process.env.ZITADEL_CLIENT_SECRET
const zitadelIssuer = process.env.ZITADEL_ISSUER
if (zitadelClientId && zitadelClientSecret && zitadelIssuer) {
  providers.push(
    Zitadel({
      clientId: zitadelClientId,
      clientSecret: zitadelClientSecret,
      issuer: zitadelIssuer,
    })
  )
}

const authConfig = { providers } satisfies NextAuthConfig

export default authConfig