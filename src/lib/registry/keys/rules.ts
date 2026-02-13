// Dependency/prerequisite rules.
// Use cases:
// - Assigning permission A requires permission B + D (fan-out)
// - UI gating: show why an action is unavailable

export type KeyRuleMap = Record<string, string[]>

// Example:
// {
//   'iam.authz.roles.manage': ['iam.authz.permissions.read', 'iam.authz.roles.read'],
// }
export const KEY_PREREQUISITES: KeyRuleMap = {
  // FI-GL: Consolidation requires COA access
  'fi.general_ledger.consolidation.manage': [
    'fi.master_data.accounts.view',
    'fi.general_ledger.journal_entries.read',
  ],
  'fi.general_ledger.consolidation.view': [
    'fi.master_data.accounts.view',
  ],
  // FI-GL: Year-end requires period management
  'fi.general_ledger.year_end.manage': [
    'fi.configuration.fiscal_years.manage',
    'fi.general_ledger.journal_entries.create',
  ],
  'fi.general_ledger.year_end.view': [
    'fi.configuration.fiscal_years.view',
  ],
  // FI-GL: Posting rules require COA access
  'fi.configuration.posting_rules.manage': [
    'fi.master_data.accounts.view',
  ],
  'fi.general_ledger.posting_rules.update': [
    'fi.master_data.accounts.view',
  ],
  // FI-GL: Approval requires journal access
  'fi.general_ledger.approval.approve': [
    'fi.general_ledger.journal_entries.read',
  ],
  'fi.general_ledger.approval.manage': [
    'fi.general_ledger.journal_entries.read',
    'fi.general_ledger.settings.manage',
  ],
  // FI-GL: Tax management requires COA and settings
  'fi.general_ledger.tax.manage': [
    'fi.master_data.accounts.view',
    'fi.general_ledger.settings.view',
  ],
  // FI-GL: Reports require data access
  'fi.general_ledger.reports.generate': [
    'fi.master_data.accounts.view',
    'fi.general_ledger.journal_entries.read',
    'fi.configuration.fiscal_years.view',
  ],
}

export function getPrerequisites(key: string): string[] {
  return KEY_PREREQUISITES[key] ?? []
}
