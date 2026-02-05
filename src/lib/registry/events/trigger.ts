export const EVENT_KEYS = {
    // core: {
    //     agency: {
    //         account: {
    //             created: 'core.agency.account.created',
    //             updated: 'core.agency.account.updated',
    //             deleted: 'core.agency.account.deleted',
    //         }
    //     }
    // },
    fi: {
        general_ledger: {
            // ─────────────────────────────────────────────────────────────
            // Chart of Accounts Events
            // ─────────────────────────────────────────────────────────────
            accounts: {
                created: 'fi.general_ledger.accounts.created',
                updated: 'fi.general_ledger.accounts.updated',
                deleted: 'fi.general_ledger.accounts.deleted',
                archived: 'fi.general_ledger.accounts.archived',
                restored: 'fi.general_ledger.accounts.restored',
            },
            // ─────────────────────────────────────────────────────────────
            // Journal Entry Events (full lifecycle)
            // ─────────────────────────────────────────────────────────────
            journal_entries: {
                // Creation & Submission
                created: 'fi.general_ledger.journal_entries.created',
                drafted: 'fi.general_ledger.journal_entries.drafted',
                submitted: 'fi.general_ledger.journal_entries.submitted',
                // Approval workflow
                approved: 'fi.general_ledger.journal_entries.approved',
                rejected: 'fi.general_ledger.journal_entries.rejected',
                // Posting
                posted: 'fi.general_ledger.journal_entries.posted',
                // Reversal & Void
                reversed: 'fi.general_ledger.journal_entries.reversed',
                voided: 'fi.general_ledger.journal_entries.voided',
                // Bulk operations
                imported: 'fi.general_ledger.journal_entries.imported',
            },
            // ─────────────────────────────────────────────────────────────
            // Financial Period Events
            // ─────────────────────────────────────────────────────────────
            periods: {
                created: 'fi.general_ledger.periods.created',
                opened: 'fi.general_ledger.periods.opened',
                closed: 'fi.general_ledger.periods.closed',
                locked: 'fi.general_ledger.periods.locked',
                unlocked: 'fi.general_ledger.periods.unlocked',
                reopened: 'fi.general_ledger.periods.reopened',
            },
            // ─────────────────────────────────────────────────────────────
            // Account Balance Events
            // ─────────────────────────────────────────────────────────────
            balances: {
                updated: 'fi.general_ledger.balances.updated',
                snapshot: 'fi.general_ledger.balances.snapshot',
                recalculated: 'fi.general_ledger.balances.recalculated',
            },
            // ─────────────────────────────────────────────────────────────
            // GL Reconciliation Events
            // ─────────────────────────────────────────────────────────────
            reconciliation: {
                started: 'fi.general_ledger.reconciliation.started',
                completed: 'fi.general_ledger.reconciliation.completed',
                matched: 'fi.general_ledger.reconciliation.matched',
                unmatched: 'fi.general_ledger.reconciliation.unmatched',
                cleared: 'fi.general_ledger.reconciliation.cleared',
            },
            // ─────────────────────────────────────────────────────────────
            // Year-End Closing Events
            // ─────────────────────────────────────────────────────────────
            year_end: {
                initiated: 'fi.general_ledger.year_end.initiated',
                completed: 'fi.general_ledger.year_end.completed',
                reversed: 'fi.general_ledger.year_end.reversed',
            },
            // ─────────────────────────────────────────────────────────────
            // Carry Forward / Brought Forward Events
            // ─────────────────────────────────────────────────────────────
            carry_forward: {
                created: 'fi.general_ledger.carry_forward.created',
                processed: 'fi.general_ledger.carry_forward.processed',
            },
            // ─────────────────────────────────────────────────────────────
            // Consolidation Events (agency-level)
            // ─────────────────────────────────────────────────────────────
            consolidation: {
                started: 'fi.general_ledger.consolidation.started',
                completed: 'fi.general_ledger.consolidation.completed',
                failed: 'fi.general_ledger.consolidation.failed',
            },
            // ─────────────────────────────────────────────────────────────
            // Report Events
            // ─────────────────────────────────────────────────────────────
            reports: {
                generated: 'fi.general_ledger.reports.generated',
                exported: 'fi.general_ledger.reports.exported',
                scheduled: 'fi.general_ledger.reports.scheduled',
            },
            // ─────────────────────────────────────────────────────────────
            // Posting Rule Events (automation)
            // ─────────────────────────────────────────────────────────────
            posting_rules: {
                executed: 'fi.general_ledger.posting_rules.executed',
                failed: 'fi.general_ledger.posting_rules.failed',
                skipped: 'fi.general_ledger.posting_rules.skipped',
            },
            // ─────────────────────────────────────────────────────────────
            // Currency / Forex Events
            // ─────────────────────────────────────────────────────────────
            forex: {
                revalued: 'fi.general_ledger.forex.revalued',
                gain_posted: 'fi.general_ledger.forex.gain_posted',
                loss_posted: 'fi.general_ledger.forex.loss_posted',
            },
            // ─────────────────────────────────────────────────────────────
            // Adjustment Events
            // ─────────────────────────────────────────────────────────────
            adjustments: {
                posted: 'fi.general_ledger.adjustments.posted',
                reversed: 'fi.general_ledger.adjustments.reversed',
            },
            // ─────────────────────────────────────────────────────────────
            // Integration / Fanout Events
            // ─────────────────────────────────────────────────────────────
            fanout: {
                received: 'fi.general_ledger.fanout.received',
                processed: 'fi.general_ledger.fanout.processed',
                failed: 'fi.general_ledger.fanout.failed',
            },
        },
        accounts_payable: {
            // ─────────────────────────────────────────────────────────────
            // FI-AP: Invoice Events (Documents)
            // ─────────────────────────────────────────────────────────────
            invoices: {
                created: 'fi.accounts_payable.invoices.created',
                received: 'fi.accounts_payable.invoices.received',
                verified: 'fi.accounts_payable.invoices.verified',
                approved: 'fi.accounts_payable.invoices.approved',
                rejected: 'fi.accounts_payable.invoices.rejected',
                posted: 'fi.accounts_payable.invoices.posted',
                cancelled: 'fi.accounts_payable.invoices.cancelled',
            },
            // ─────────────────────────────────────────────────────────────
            // FI-AP: Payment Events (Money Out)
            // ─────────────────────────────────────────────────────────────
            payments: {
                scheduled: 'fi.accounts_payable.payments.scheduled',
                approved: 'fi.accounts_payable.payments.approved',
                executed: 'fi.accounts_payable.payments.executed',
                completed: 'fi.accounts_payable.payments.completed',
                failed: 'fi.accounts_payable.payments.failed',
                reversed: 'fi.accounts_payable.payments.reversed',
            },
            // ─────────────────────────────────────────────────────────────
            // FI-AP: Credit Memo Events
            // ─────────────────────────────────────────────────────────────
            credit_memos: {
                created: 'fi.accounts_payable.credit_memos.created',
                applied: 'fi.accounts_payable.credit_memos.applied',
                posted: 'fi.accounts_payable.credit_memos.posted',
            },
            // ─────────────────────────────────────────────────────────────
            // FI-AP: Vendor Events (Subledger)
            // ─────────────────────────────────────────────────────────────
            vendors: {
                created: 'fi.accounts_payable.vendors.created',
                updated: 'fi.accounts_payable.vendors.updated',
                blocked: 'fi.accounts_payable.vendors.blocked',
                unblocked: 'fi.accounts_payable.vendors.unblocked',
            },
            // ─────────────────────────────────────────────────────────────
            // FI-AP: Aging Events
            // ─────────────────────────────────────────────────────────────
            aging: {
                calculated: 'fi.accounts_payable.aging.calculated',
                overdue: 'fi.accounts_payable.aging.overdue',
            },
        },
        accounts_receivable: {
            // ─────────────────────────────────────────────────────────────
            // FI-AR: Invoice Events (Documents)
            // ─────────────────────────────────────────────────────────────
            invoices: {
                created: 'fi.accounts_receivable.invoices.created',
                drafted: 'fi.accounts_receivable.invoices.drafted',
                sent: 'fi.accounts_receivable.invoices.sent',
                billed: 'fi.accounts_receivable.invoices.billed',
                posted: 'fi.accounts_receivable.invoices.posted',
                cancelled: 'fi.accounts_receivable.invoices.cancelled',
                overdue: 'fi.accounts_receivable.invoices.overdue',
            },
            // ─────────────────────────────────────────────────────────────
            // FI-AR: Payment Events (Money In)
            // ─────────────────────────────────────────────────────────────
            payments: {
                expected: 'fi.accounts_receivable.payments.expected',
                received: 'fi.accounts_receivable.payments.received',
                applied: 'fi.accounts_receivable.payments.applied',
                partial: 'fi.accounts_receivable.payments.partial',
                overpaid: 'fi.accounts_receivable.payments.overpaid',
                reversed: 'fi.accounts_receivable.payments.reversed',
            },
            // ─────────────────────────────────────────────────────────────
            // FI-AR: Credit Memo / Refund Events
            // ─────────────────────────────────────────────────────────────
            credit_memos: {
                created: 'fi.accounts_receivable.credit_memos.created',
                applied: 'fi.accounts_receivable.credit_memos.applied',
                refunded: 'fi.accounts_receivable.credit_memos.refunded',
                posted: 'fi.accounts_receivable.credit_memos.posted',
            },
            // ─────────────────────────────────────────────────────────────
            // FI-AR: Customer Events (Subledger)
            // ─────────────────────────────────────────────────────────────
            customers: {
                created: 'fi.accounts_receivable.customers.created',
                updated: 'fi.accounts_receivable.customers.updated',
                blocked: 'fi.accounts_receivable.customers.blocked',
                unblocked: 'fi.accounts_receivable.customers.unblocked',
            },
            // ─────────────────────────────────────────────────────────────
            // FI-AR: Aging & Collections Events
            // ─────────────────────────────────────────────────────────────
            aging: {
                calculated: 'fi.accounts_receivable.aging.calculated',
                overdue: 'fi.accounts_receivable.aging.overdue',
            },
            dunning: {
                sent: 'fi.accounts_receivable.dunning.sent',
                escalated: 'fi.accounts_receivable.dunning.escalated',
            },
        },
        bank_ledger: {
            // ─────────────────────────────────────────────────────────────
            // FI-BL: Bank Account Events
            // ─────────────────────────────────────────────────────────────
            accounts: {
                created: 'fi.bank_ledger.accounts.created',
                updated: 'fi.bank_ledger.accounts.updated',
                connected: 'fi.bank_ledger.accounts.connected',
                disconnected: 'fi.bank_ledger.accounts.disconnected',
            },
            // ─────────────────────────────────────────────────────────────
            // FI-BL: Statement Events
            // ─────────────────────────────────────────────────────────────
            statements: {
                imported: 'fi.bank_ledger.statements.imported',
                parsed: 'fi.bank_ledger.statements.parsed',
                validated: 'fi.bank_ledger.statements.validated',
                failed: 'fi.bank_ledger.statements.failed',
            },
            // ─────────────────────────────────────────────────────────────
            // FI-BL: Transaction Events
            // ─────────────────────────────────────────────────────────────
            transactions: {
                imported: 'fi.bank_ledger.transactions.imported',
                categorized: 'fi.bank_ledger.transactions.categorized',
                matched: 'fi.bank_ledger.transactions.matched',
                unmatched: 'fi.bank_ledger.transactions.unmatched',
            },
            // ─────────────────────────────────────────────────────────────
            // FI-BL: Reconciliation Events
            // ─────────────────────────────────────────────────────────────
            reconciliation: {
                started: 'fi.bank_ledger.reconciliation.started',
                completed: 'fi.bank_ledger.reconciliation.completed',
                approved: 'fi.bank_ledger.reconciliation.approved',
                discrepancy: 'fi.bank_ledger.reconciliation.discrepancy',
            },
            // ─────────────────────────────────────────────────────────────
            // FI-BL: Transfer Events
            // ─────────────────────────────────────────────────────────────
            transfers: {
                initiated: 'fi.bank_ledger.transfers.initiated',
                pending: 'fi.bank_ledger.transfers.pending',
                completed: 'fi.bank_ledger.transfers.completed',
                failed: 'fi.bank_ledger.transfers.failed',
            },
            // ─────────────────────────────────────────────────────────────
            // FI-BL: Cash Position Events
            // ─────────────────────────────────────────────────────────────
            cash_position: {
                updated: 'fi.bank_ledger.cash_position.updated',
                forecast: 'fi.bank_ledger.cash_position.forecast',
            },
        },
    },
    co: {
        cost_centers: {
            allocation: {
                posted: 'co.cost_centers.allocation.posted',
            },
            assessment: {
                posted: 'co.cost_centers.assessment.posted',
            }
        }
    },
    apps: {
        stripe: {
            payment: {
                received: 'apps.stripe.payment.received',
            },
            payout: {
                sent: 'apps.stripe.payout.sent',
            },
            fee: {
                charged: 'apps.stripe.fee.charged',
            },
            refund: {
                issued: 'apps.stripe.refund.issued',
            }
        },
    },
    mm: {
        // mm subsmodules in SAP are what ? A: Material Management, related to inventory, warehousing, etc.
        // Q: the approriate name for 'related to inventory' is ? A: Inventory Management, 
        // Q: Inventory Management has what elements/components ? A: Inventory Receipt, Inventory Issue, Inventory Adjustment
        // Q: item is under which module ? A: Inventory Management under Material Management
        // Q: MM -> IM -> INV
        inventory_management: {
            inventory: {
                received: 'mm.inventory_management.inventory.received',
                issued: 'mm.inventory_management.inventory.issued',
                adjusted: 'mm.inventory_management.inventory.adjusted',
            },
        },

    }
} as const;

// Q: Material Management -> SAP submodules are ? A: Inventory Management, Warehouse Management, Procurement Management
// Q: Inventory Management has which components ? A: Inventory Receipt, Inventory Issue, Inventory Adjustment
// Q: Warehouse Management has which components ? A: Stock Transfer, Bin Management, Picking and Packing
// Q: Procurement Management has which components ? A: Purchase Requisition, Purchase Order, Vendor Management
// Q: Vendor Subledger handled by ? A: Accounts Payable module in FI -> link to -> FI-GL
// Q: there is a specific object/components called 'item' in SAP, what module is it under ? A: Inventory Management under Material Management
// Q: item = inventory ? A: yes
// Q: mm.inventory.items.received vs. mm.inventory_management.inventory.received ? A: the latter is preferred for clarity




export type ModuleCode = keyof typeof EVENT_KEYS;
export type ModuleKey = ModuleCode;
export type ModuleType = Uppercase<ModuleCode>;

export type SubModuleOf<M extends ModuleCode> = M extends keyof typeof EVENT_KEYS
    ? Extract<keyof (typeof EVENT_KEYS)[M], string>
    : never;

export type ResourceOf<M extends ModuleCode, S extends SubModuleOf<M>> = Extract<
    keyof (typeof EVENT_KEYS)[M][S],
    string
>;

export type EventOf<
    M extends ModuleCode,
    S extends SubModuleOf<M>,
    R extends ResourceOf<M, S>
> = Extract<keyof (typeof EVENT_KEYS)[M][S][R], string>;

// Union types for all levels
export type SubModuleCode = {
    [M in ModuleCode]: Extract<keyof (typeof EVENT_KEYS)[M], string>
}[ModuleCode];

export type SubModuleKey = {
    [M in ModuleCode]: `${M}.${SubModuleOf<M>}`
}[ModuleCode];

export type SubModuleType = Uppercase<SubModuleCode>;

export type EventCode = {
    [M in ModuleCode]: {
        [S in SubModuleOf<M>]: {
            [R in ResourceOf<M, S>]: EventOf<M, S, R>
        }[ResourceOf<M, S>]
    }[SubModuleOf<M>]
}[ModuleCode];


export type EventKey = {
    [M in ModuleCode]: {
        [S in SubModuleOf<M>]: {
            [R in ResourceOf<M, S>]: `${M}.${S}.${R}.${EventOf<M, S, R>}`
        }[ResourceOf<M, S>]
    }[SubModuleOf<M>]
}[ModuleCode];

export type EventType = Uppercase<EventCode>;

// automatic validate all these key for Module, SubModule, Resource are valid in registry.keys.permissions (not frontend)
import { ModuleCode as PermModuleCode, SubModuleOf as PermSubModuleOf, ResourceOf as PermResourceOf, ActionOf as PermActionOf } from '@/lib/registry/keys/permissions';

type ValidateModule<M extends ModuleCode> = M extends PermModuleCode ? M : never;
type ValidateSubModule<M extends ModuleCode, S extends SubModuleOf<M>> = S extends PermSubModuleOf<ValidateModule<M>> ? S : never;
type ValidateResource<M extends ModuleCode, S extends SubModuleOf<M>, R extends ResourceOf<M, S>> = R extends PermResourceOf<ValidateModule<M>, ValidateSubModule<M, S>> ? R : never;
type ValidateAction<M extends ModuleCode, S extends SubModuleOf<M>, R extends ResourceOf<M, S>, A extends EventOf<M, S, R>> = A extends PermActionOf<ValidateModule<M>, ValidateSubModule<M, S>, ValidateResource<M, S, R>> ? A : never;

// Validate all EVENT_KEYS
// Q: no redline error means correct ? A: yes
