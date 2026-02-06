export type SupportScope =
  | { type: 'AGENCY'; agencyId: string }
  | { type: 'SUBACCOUNT'; subaccountId: string }

export const scopeQuery = (scope: SupportScope) => {
  return scope.type === 'AGENCY'
    ? `agencyId=${encodeURIComponent(scope.agencyId)}`
    : `subAccountId=${encodeURIComponent(scope.subaccountId)}`
}
