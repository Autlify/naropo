/**
 * Event Trigger Mappings
 * Maps EventKey to posting rule trigger types
 * 
 * @description SSoT for event-to-trigger mapping used by fanout service
 * @namespace Autlify.Lib.Registry.Events.TriggerMappings
 * @module REGISTRY
 */

import { EVENT_KEYS, EventKey } from './trigger'

// =====================================================
// EVENT TRIGGER MAPPING (SSoT)
// =====================================================

/**
 * Maps EventKey to posting rule trigger type
 * Uses registry EVENT_KEYS as the single source of truth
 */
export const EVENT_TRIGGER_MAPPING: Record<EventKey, string> = {
  // ─────────────────────────────────────────────────────────────────────────
  // FI-GL: Chart of Accounts Events
  // ─────────────────────────────────────────────────────────────────────────
  [EVENT_KEYS.fi.general_ledger.accounts.created]: 'GL_ACCOUNT_CREATED',
  [EVENT_KEYS.fi.general_ledger.accounts.updated]: 'GL_ACCOUNT_UPDATED',
  [EVENT_KEYS.fi.general_ledger.accounts.deleted]: 'GL_ACCOUNT_DELETED',
  [EVENT_KEYS.fi.general_ledger.accounts.archived]: 'GL_ACCOUNT_ARCHIVED',
  [EVENT_KEYS.fi.general_ledger.accounts.restored]: 'GL_ACCOUNT_RESTORED',

  // ─────────────────────────────────────────────────────────────────────────
  // FI-GL: Journal Entry Events (full lifecycle)
  // ─────────────────────────────────────────────────────────────────────────
  [EVENT_KEYS.fi.general_ledger.journal_entries.created]: 'JOURNAL_CREATED',
  [EVENT_KEYS.fi.general_ledger.journal_entries.drafted]: 'JOURNAL_DRAFTED',
  [EVENT_KEYS.fi.general_ledger.journal_entries.submitted]: 'JOURNAL_SUBMITTED',
  [EVENT_KEYS.fi.general_ledger.journal_entries.approved]: 'JOURNAL_APPROVED',
  [EVENT_KEYS.fi.general_ledger.journal_entries.rejected]: 'JOURNAL_REJECTED',
  [EVENT_KEYS.fi.general_ledger.journal_entries.posted]: 'JOURNAL_POSTED',
  [EVENT_KEYS.fi.general_ledger.journal_entries.reversed]: 'JOURNAL_REVERSED',
  [EVENT_KEYS.fi.general_ledger.journal_entries.voided]: 'JOURNAL_VOIDED',
  [EVENT_KEYS.fi.general_ledger.journal_entries.imported]: 'JOURNAL_IMPORTED',

  // ─────────────────────────────────────────────────────────────────────────
  // FI-GL: Financial Period Events
  // ─────────────────────────────────────────────────────────────────────────
  [EVENT_KEYS.fi.general_ledger.periods.created]: 'PERIOD_CREATED',
  [EVENT_KEYS.fi.general_ledger.periods.opened]: 'PERIOD_OPENED',
  [EVENT_KEYS.fi.general_ledger.periods.closed]: 'PERIOD_CLOSED',
  [EVENT_KEYS.fi.general_ledger.periods.locked]: 'PERIOD_LOCKED',
  [EVENT_KEYS.fi.general_ledger.periods.unlocked]: 'PERIOD_UNLOCKED',
  [EVENT_KEYS.fi.general_ledger.periods.reopened]: 'PERIOD_REOPENED',

  // ─────────────────────────────────────────────────────────────────────────
  // FI-GL: Account Balance Events
  // ─────────────────────────────────────────────────────────────────────────
  [EVENT_KEYS.fi.general_ledger.balances.updated]: 'BALANCE_UPDATED',
  [EVENT_KEYS.fi.general_ledger.balances.snapshot]: 'BALANCE_SNAPSHOT',
  [EVENT_KEYS.fi.general_ledger.balances.recalculated]: 'BALANCE_RECALCULATED',

  // ─────────────────────────────────────────────────────────────────────────
  // FI-GL: Reconciliation Events
  // ─────────────────────────────────────────────────────────────────────────
  [EVENT_KEYS.fi.general_ledger.reconciliation.started]: 'GL_RECON_STARTED',
  [EVENT_KEYS.fi.general_ledger.reconciliation.completed]: 'GL_RECON_COMPLETED',
  [EVENT_KEYS.fi.general_ledger.reconciliation.matched]: 'GL_RECON_MATCHED',
  [EVENT_KEYS.fi.general_ledger.reconciliation.unmatched]: 'GL_RECON_UNMATCHED',
  [EVENT_KEYS.fi.general_ledger.reconciliation.cleared]: 'GL_RECON_CLEARED',

  // ─────────────────────────────────────────────────────────────────────────
  // FI-GL: Year-End Closing Events
  // ─────────────────────────────────────────────────────────────────────────
  [EVENT_KEYS.fi.general_ledger.year_end.initiated]: 'YEAR_END_INITIATED',
  [EVENT_KEYS.fi.general_ledger.year_end.completed]: 'YEAR_END_COMPLETED',
  [EVENT_KEYS.fi.general_ledger.year_end.reversed]: 'YEAR_END_REVERSED',

  // ─────────────────────────────────────────────────────────────────────────
  // FI-GL: Carry Forward Events
  // ─────────────────────────────────────────────────────────────────────────
  [EVENT_KEYS.fi.general_ledger.carry_forward.created]: 'CARRY_FORWARD_CREATED',
  [EVENT_KEYS.fi.general_ledger.carry_forward.processed]: 'CARRY_FORWARD_PROCESSED',

  // ─────────────────────────────────────────────────────────────────────────
  // FI-GL: Consolidation Events
  // ─────────────────────────────────────────────────────────────────────────
  [EVENT_KEYS.fi.general_ledger.consolidation.started]: 'CONSOLIDATION_STARTED',
  [EVENT_KEYS.fi.general_ledger.consolidation.completed]: 'CONSOLIDATION_COMPLETED',
  [EVENT_KEYS.fi.general_ledger.consolidation.failed]: 'CONSOLIDATION_FAILED',

  // ─────────────────────────────────────────────────────────────────────────
  // FI-GL: Report Events
  // ─────────────────────────────────────────────────────────────────────────
  [EVENT_KEYS.fi.general_ledger.reports.generated]: 'REPORT_GENERATED',
  [EVENT_KEYS.fi.general_ledger.reports.exported]: 'REPORT_EXPORTED',
  [EVENT_KEYS.fi.general_ledger.reports.scheduled]: 'REPORT_SCHEDULED',

  // ─────────────────────────────────────────────────────────────────────────
  // FI-GL: Posting Rules Events
  // ─────────────────────────────────────────────────────────────────────────
  [EVENT_KEYS.fi.general_ledger.posting_rules.executed]: 'POSTING_RULE_EXECUTED',
  [EVENT_KEYS.fi.general_ledger.posting_rules.failed]: 'POSTING_RULE_FAILED',
  [EVENT_KEYS.fi.general_ledger.posting_rules.skipped]: 'POSTING_RULE_SKIPPED',

  // ─────────────────────────────────────────────────────────────────────────
  // FI-GL: Forex Events
  // ─────────────────────────────────────────────────────────────────────────
  [EVENT_KEYS.fi.general_ledger.forex.revalued]: 'FOREX_REVALUED',
  [EVENT_KEYS.fi.general_ledger.forex.gain_posted]: 'FOREX_GAIN_POSTED',
  [EVENT_KEYS.fi.general_ledger.forex.loss_posted]: 'FOREX_LOSS_POSTED',

  // ─────────────────────────────────────────────────────────────────────────
  // FI-GL: Adjustment Events
  // ─────────────────────────────────────────────────────────────────────────
  [EVENT_KEYS.fi.general_ledger.adjustments.posted]: 'ADJUSTMENT_POSTED',
  [EVENT_KEYS.fi.general_ledger.adjustments.reversed]: 'ADJUSTMENT_REVERSED',

  // ─────────────────────────────────────────────────────────────────────────
  // FI-GL: Fanout Integration Events
  // ─────────────────────────────────────────────────────────────────────────
  [EVENT_KEYS.fi.general_ledger.fanout.received]: 'FANOUT_RECEIVED',
  [EVENT_KEYS.fi.general_ledger.fanout.processed]: 'FANOUT_PROCESSED',
  [EVENT_KEYS.fi.general_ledger.fanout.failed]: 'FANOUT_FAILED',

  // ─────────────────────────────────────────────────────────────────────────
  // FI-AP: Invoice Events
  // ─────────────────────────────────────────────────────────────────────────
  [EVENT_KEYS.fi.accounts_payable.invoices.created]: 'AP_INVOICE_CREATED',
  [EVENT_KEYS.fi.accounts_payable.invoices.received]: 'AP_INVOICE_RECEIVED',
  [EVENT_KEYS.fi.accounts_payable.invoices.verified]: 'AP_INVOICE_VERIFIED',
  [EVENT_KEYS.fi.accounts_payable.invoices.approved]: 'AP_INVOICE_APPROVED',
  [EVENT_KEYS.fi.accounts_payable.invoices.rejected]: 'AP_INVOICE_REJECTED',
  [EVENT_KEYS.fi.accounts_payable.invoices.posted]: 'AP_INVOICE_POSTED',
  [EVENT_KEYS.fi.accounts_payable.invoices.cancelled]: 'AP_INVOICE_CANCELLED',

  // ─────────────────────────────────────────────────────────────────────────
  // FI-AP: Payment Events
  // ─────────────────────────────────────────────────────────────────────────
  [EVENT_KEYS.fi.accounts_payable.payments.scheduled]: 'AP_PAYMENT_SCHEDULED',
  [EVENT_KEYS.fi.accounts_payable.payments.approved]: 'AP_PAYMENT_APPROVED',
  [EVENT_KEYS.fi.accounts_payable.payments.executed]: 'AP_PAYMENT_EXECUTED',
  [EVENT_KEYS.fi.accounts_payable.payments.completed]: 'AP_PAYMENT_COMPLETED',
  [EVENT_KEYS.fi.accounts_payable.payments.failed]: 'AP_PAYMENT_FAILED',
  [EVENT_KEYS.fi.accounts_payable.payments.reversed]: 'AP_PAYMENT_REVERSED',

  // ─────────────────────────────────────────────────────────────────────────
  // FI-AP: Credit Memo & Vendor Events
  // ─────────────────────────────────────────────────────────────────────────
  [EVENT_KEYS.fi.accounts_payable.credit_memos.created]: 'AP_CREDIT_MEMO_CREATED',
  [EVENT_KEYS.fi.accounts_payable.credit_memos.applied]: 'AP_CREDIT_MEMO_APPLIED',
  [EVENT_KEYS.fi.accounts_payable.credit_memos.posted]: 'AP_CREDIT_MEMO_POSTED',
  [EVENT_KEYS.fi.accounts_payable.vendors.created]: 'AP_VENDOR_CREATED',
  [EVENT_KEYS.fi.accounts_payable.vendors.updated]: 'AP_VENDOR_UPDATED',
  [EVENT_KEYS.fi.accounts_payable.vendors.blocked]: 'AP_VENDOR_BLOCKED',
  [EVENT_KEYS.fi.accounts_payable.vendors.unblocked]: 'AP_VENDOR_UNBLOCKED',
  [EVENT_KEYS.fi.accounts_payable.aging.calculated]: 'AP_AGING_CALCULATED',
  [EVENT_KEYS.fi.accounts_payable.aging.overdue]: 'AP_AGING_OVERDUE',

  // ─────────────────────────────────────────────────────────────────────────
  // FI-AR: Invoice Events
  // ─────────────────────────────────────────────────────────────────────────
  [EVENT_KEYS.fi.accounts_receivable.invoices.created]: 'AR_INVOICE_CREATED',
  [EVENT_KEYS.fi.accounts_receivable.invoices.drafted]: 'AR_INVOICE_DRAFTED',
  [EVENT_KEYS.fi.accounts_receivable.invoices.sent]: 'AR_INVOICE_SENT',
  [EVENT_KEYS.fi.accounts_receivable.invoices.billed]: 'AR_INVOICE_BILLED',
  [EVENT_KEYS.fi.accounts_receivable.invoices.posted]: 'AR_INVOICE_POSTED',
  [EVENT_KEYS.fi.accounts_receivable.invoices.cancelled]: 'AR_INVOICE_CANCELLED',
  [EVENT_KEYS.fi.accounts_receivable.invoices.overdue]: 'AR_INVOICE_OVERDUE',

  // ─────────────────────────────────────────────────────────────────────────
  // FI-AR: Payment Events
  // ─────────────────────────────────────────────────────────────────────────
  [EVENT_KEYS.fi.accounts_receivable.payments.expected]: 'AR_PAYMENT_EXPECTED',
  [EVENT_KEYS.fi.accounts_receivable.payments.received]: 'AR_PAYMENT_RECEIVED',
  [EVENT_KEYS.fi.accounts_receivable.payments.applied]: 'AR_PAYMENT_APPLIED',
  [EVENT_KEYS.fi.accounts_receivable.payments.partial]: 'AR_PAYMENT_PARTIAL',
  [EVENT_KEYS.fi.accounts_receivable.payments.overpaid]: 'AR_PAYMENT_OVERPAID',
  [EVENT_KEYS.fi.accounts_receivable.payments.reversed]: 'AR_PAYMENT_REVERSED',

  // ─────────────────────────────────────────────────────────────────────────
  // FI-AR: Credit Memo, Customer & Collections Events
  // ─────────────────────────────────────────────────────────────────────────
  [EVENT_KEYS.fi.accounts_receivable.credit_memos.created]: 'AR_CREDIT_MEMO_CREATED',
  [EVENT_KEYS.fi.accounts_receivable.credit_memos.applied]: 'AR_CREDIT_MEMO_APPLIED',
  [EVENT_KEYS.fi.accounts_receivable.credit_memos.refunded]: 'AR_CREDIT_MEMO_REFUNDED',
  [EVENT_KEYS.fi.accounts_receivable.credit_memos.posted]: 'AR_CREDIT_MEMO_POSTED',
  [EVENT_KEYS.fi.accounts_receivable.customers.created]: 'AR_CUSTOMER_CREATED',
  [EVENT_KEYS.fi.accounts_receivable.customers.updated]: 'AR_CUSTOMER_UPDATED',
  [EVENT_KEYS.fi.accounts_receivable.customers.blocked]: 'AR_CUSTOMER_BLOCKED',
  [EVENT_KEYS.fi.accounts_receivable.customers.unblocked]: 'AR_CUSTOMER_UNBLOCKED',
  [EVENT_KEYS.fi.accounts_receivable.aging.calculated]: 'AR_AGING_CALCULATED',
  [EVENT_KEYS.fi.accounts_receivable.aging.overdue]: 'AR_AGING_OVERDUE',
  [EVENT_KEYS.fi.accounts_receivable.dunning.sent]: 'AR_DUNNING_SENT',
  [EVENT_KEYS.fi.accounts_receivable.dunning.escalated]: 'AR_DUNNING_ESCALATED',

  // ─────────────────────────────────────────────────────────────────────────
  // FI-BL: Bank Account & Statement Events
  // ─────────────────────────────────────────────────────────────────────────
  [EVENT_KEYS.fi.bank_ledger.accounts.created]: 'BL_ACCOUNT_CREATED',
  [EVENT_KEYS.fi.bank_ledger.accounts.updated]: 'BL_ACCOUNT_UPDATED',
  [EVENT_KEYS.fi.bank_ledger.accounts.connected]: 'BL_ACCOUNT_CONNECTED',
  [EVENT_KEYS.fi.bank_ledger.accounts.disconnected]: 'BL_ACCOUNT_DISCONNECTED',
  [EVENT_KEYS.fi.bank_ledger.statements.imported]: 'BL_STATEMENT_IMPORTED',
  [EVENT_KEYS.fi.bank_ledger.statements.parsed]: 'BL_STATEMENT_PARSED',
  [EVENT_KEYS.fi.bank_ledger.statements.validated]: 'BL_STATEMENT_VALIDATED',
  [EVENT_KEYS.fi.bank_ledger.statements.failed]: 'BL_STATEMENT_FAILED',

  // ─────────────────────────────────────────────────────────────────────────
  // FI-BL: Transaction & Reconciliation Events
  // ─────────────────────────────────────────────────────────────────────────
  [EVENT_KEYS.fi.bank_ledger.transactions.imported]: 'BL_TXN_IMPORTED',
  [EVENT_KEYS.fi.bank_ledger.transactions.categorized]: 'BL_TXN_CATEGORIZED',
  [EVENT_KEYS.fi.bank_ledger.transactions.matched]: 'BL_TXN_MATCHED',
  [EVENT_KEYS.fi.bank_ledger.transactions.unmatched]: 'BL_TXN_UNMATCHED',
  [EVENT_KEYS.fi.bank_ledger.reconciliation.started]: 'BL_RECON_STARTED',
  [EVENT_KEYS.fi.bank_ledger.reconciliation.completed]: 'BL_RECON_COMPLETED',
  [EVENT_KEYS.fi.bank_ledger.reconciliation.approved]: 'BL_RECON_APPROVED',
  [EVENT_KEYS.fi.bank_ledger.reconciliation.discrepancy]: 'BL_RECON_DISCREPANCY',

  // ─────────────────────────────────────────────────────────────────────────
  // FI-BL: Transfer & Cash Position Events
  // ─────────────────────────────────────────────────────────────────────────
  [EVENT_KEYS.fi.bank_ledger.transfers.initiated]: 'BL_TRANSFER_INITIATED',
  [EVENT_KEYS.fi.bank_ledger.transfers.pending]: 'BL_TRANSFER_PENDING',
  [EVENT_KEYS.fi.bank_ledger.transfers.completed]: 'BL_TRANSFER_COMPLETED',
  [EVENT_KEYS.fi.bank_ledger.transfers.failed]: 'BL_TRANSFER_FAILED',
  [EVENT_KEYS.fi.bank_ledger.cash_position.updated]: 'BL_CASH_POSITION_UPDATED',
  [EVENT_KEYS.fi.bank_ledger.cash_position.forecast]: 'BL_CASH_POSITION_FORECAST',

  // ─────────────────────────────────────────────────────────────────────────
  // CO-CCA (Cost Center Accounting) Events
  // ─────────────────────────────────────────────────────────────────────────
  [EVENT_KEYS.co.cost_centers.allocation.posted]: 'COST_ALLOCATION',
  [EVENT_KEYS.co.cost_centers.assessment.posted]: 'COST_ASSESSMENT',

  // ─────────────────────────────────────────────────────────────────────────
  // Apps - Stripe Events
  // ─────────────────────────────────────────────────────────────────────────
  [EVENT_KEYS.apps.stripe.payment.received]: 'STRIPE_PAYMENT',
  [EVENT_KEYS.apps.stripe.payout.sent]: 'STRIPE_PAYOUT',
  [EVENT_KEYS.apps.stripe.fee.charged]: 'STRIPE_FEE',
  [EVENT_KEYS.apps.stripe.refund.issued]: 'STRIPE_REFUND',

  // ─────────────────────────────────────────────────────────────────────────
  // MM - Inventory Events
  // ─────────────────────────────────────────────────────────────────────────
  [EVENT_KEYS.mm.inventory_management.inventory.received]: 'INVENTORY_RECEIPT',
  [EVENT_KEYS.mm.inventory_management.inventory.issued]: 'INVENTORY_ISSUE',
  [EVENT_KEYS.mm.inventory_management.inventory.adjusted]: 'INVENTORY_ADJUSTMENT',
}

const ALL_TRIGGER_TYPES = Array.from(new Set(Object.values(EVENT_TRIGGER_MAPPING)))

const EVENT_KEYS_BY_TRIGGER = new Map<string, EventKey[]>()
for (const [eventKey, triggerType] of Object.entries(EVENT_TRIGGER_MAPPING) as [EventKey, string][]) {
  const list = EVENT_KEYS_BY_TRIGGER.get(triggerType)
  if (list) {
    list.push(eventKey)
  } else {
    EVENT_KEYS_BY_TRIGGER.set(triggerType, [eventKey])
  }
}

// =====================================================
// HELPER FUNCTIONS (Pure - no server action)
// =====================================================

/**
 * Check if a string is a valid EventKey
 */
export function isValidEventKey(key: string): key is EventKey {
  return key in EVENT_TRIGGER_MAPPING
}

/**
 * Get trigger type for an event key (with fallback)
 */
export function getTriggerType(eventKey: string): string {
  if (isValidEventKey(eventKey)) {
    return EVENT_TRIGGER_MAPPING[eventKey]
  }
  // Fallback: convert to uppercase trigger format
  return eventKey.split('.').pop()?.toUpperCase() ?? eventKey.toUpperCase()
}

/**
 * Get all trigger types as array
 */
export function getAllTriggerTypes(): string[] {
  return [...ALL_TRIGGER_TYPES]
}

/**
 * Get event keys for a trigger type
 */
export function getEventKeysForTrigger(triggerType: string): EventKey[] {
  const eventKeys = EVENT_KEYS_BY_TRIGGER.get(triggerType)
  return eventKeys ? [...eventKeys] : []
}
