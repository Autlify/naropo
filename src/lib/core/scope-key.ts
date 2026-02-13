import 'server-only'

export type ScopeKey = `agency:${string}` | `subaccount:${string}`

export const agencyScopeKey = (agencyId: string): ScopeKey => `agency:${agencyId}`
export const subAccountScopeKey = (subAccountId: string): ScopeKey => `subaccount:${subAccountId}`

export type ParsedScopeKey =
  | { scope: 'AGENCY'; agencyId: string }
  | { scope: 'SUBACCOUNT'; subAccountId: string }

export const parseScopeKey = (scopeKey: string): ParsedScopeKey | null => {
  if (scopeKey.startsWith('agency:')) {
    const agencyId = scopeKey.slice('agency:'.length)
    return agencyId ? { scope: 'AGENCY', agencyId } : null
  }
  if (scopeKey.startsWith('subaccount:')) {
    const subAccountId = scopeKey.slice('subaccount:'.length)
    return subAccountId ? { scope: 'SUBACCOUNT', subAccountId } : null
  }
  return null
}
