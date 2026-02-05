/**
 * @abstraction Permission Keys Registry
 * @description This file contains a structured registry of permission keys used throughout the application.
 * Each key is organized hierarchically by module, sub-module, and specific features or actions.
 * This structure facilitates consistent permission management and access control across different parts of the system.
 *
 * @namespace Autlify.Lib.Registry.Keys.Permissions
 * @name Permission Keys Registry
 * @module REGISTRY
 * @author Autlify Team
 * @created 2026-01-15
 * @summary Centralized, Standardized, Normalized permission keys for access control, entitlement features, role management, and authorization checks.
 */


export const KEYS = {
    core: {
        organization: {
            profile: {
                view: 'core.organization.profile.view',
                manage: 'core.organization.profile.manage',
            },
            security: {
                view: 'core.organization.security.view',
                manage: 'core.organization.security.manage',
            },
            integrations: {
                view: 'core.organization.integrations.view',
                manage: 'core.organization.integrations.manage',
            },
            automation: {
                view: 'core.organization.automation.view',
                manage: 'core.organization.automation.manage',
            },
        },
        agency: {
            // Data entity - CRUD pattern
            account: {
                read: 'core.agency.account.read',
                update: 'core.agency.account.update',
                delete: 'core.agency.account.delete',
            },
            // Data entity - CRUD pattern
            subaccounts: {
                read: 'core.agency.subaccounts.read',
                create: 'core.agency.subaccounts.create',
                update: 'core.agency.subaccounts.update',
                delete: 'core.agency.subaccounts.delete',
            },
            // Actions on members
            team_member: {
                invite: 'core.agency.team_member.invite',
                remove: 'core.agency.team_member.remove',
                manage: 'core.agency.team_member.manage',
            },
            // Non-data (configuration) - view/manage pattern
            settings: {
                view: 'core.agency.settings.view',
                manage: 'core.agency.settings.manage',
            },
            storage: {
                view: 'core.agency.storage.view',
                manage: 'core.agency.storage.manage',
            }
        },
        billing: {
            // Non-data (configuration) - view/manage pattern
            account: {
                view: 'core.billing.account.view',
                manage: 'core.billing.account.manage',
            },
            // Data entity (cards) - CRUD pattern
            payment_methods: {
                read: 'core.billing.payment_methods.read',
                create: 'core.billing.payment_methods.create',
                delete: 'core.billing.payment_methods.delete',
            },
            // Non-data (configuration) - view/manage pattern
            subscription: {
                view: 'core.billing.subscription.view',
                manage: 'core.billing.subscription.manage',
            },
            // Non-data - manage only
            features: {
                manage: 'core.billing.features.manage',
            },
            // Non-data (reporting) - view/action pattern
            usage: {
                view: 'core.billing.usage.view',
                consume: 'core.billing.usage.consume',
            },
            // Non-data (reporting) - view only
            entitlements: {
                view: 'core.billing.entitlements.view',
            },
            // Non-data (balance) - view only
            credits: {
                view: 'core.billing.credits.view',
            },
            // Plan-gated features (Boolean entitlements)
            rebilling: {
                manage: 'core.billing.rebilling.manage',
            },
            priority_support: {
                view: 'core.billing.priority_support.view',
            },
        },
        subaccount: {
            // Data entity - CRUD pattern
            account: {
                read: 'core.subaccount.account.read',
                update: 'core.subaccount.account.update',
                delete: 'core.subaccount.account.delete',
            },
            // Actions on members
            team_member: {
                invite: 'core.subaccount.team_member.invite',
                remove: 'core.subaccount.team_member.remove',
            }, 
        },
        experimental: {
            // User preferences - action pattern
            flag: {
                toggle: 'core.experimental.flag.toggle',
            },
        },
        apps: {
            // Non-data (configuration) - view/manage pattern
            app: {
                view: 'core.apps.app.view',
                install: 'core.apps.app.install',
                manage: 'core.apps.app.manage',
                uninstall: 'core.apps.app.uninstall',
            },
            webhooks: {
                manage: 'core.apps.webhooks.manage', // Overall management permission including creating/deleting webhooks, deliveries, etc.
                view: 'core.apps.webhooks.view', // View existing webhooks

            },
            // Data entities for metering - CRUD pattern
            api_keys: {
                read: 'core.apps.api_keys.read',
                create: 'core.apps.api_keys.create',
                delete: 'core.apps.api_keys.delete',
            },
        },
        support: {
            tickets: {
                view: 'core.support.tickets.view',
                create: 'core.support.tickets.create',
                update: 'core.support.tickets.update',
                close: 'core.support.tickets.close',
            },
            diagnostics: {
                run: 'core.support.diagnostics.run',
            }
        },
    },
    iam: {
        authZ: {
            roles: {
                read: 'iam.authZ.roles.read',
                create: 'iam.authZ.roles.create',
                update: 'iam.authZ.roles.update',
                delete: 'iam.authZ.roles.delete',
            },
            permissions: {
                view: 'iam.authZ.permissions.view',
            },
            members: {
                assign: 'iam.authZ.members.assign',
                revoke: 'iam.authZ.members.revoke',
            },
        },
    },
    fi: {
        configuration: {
            fiscal_years: {
                view: 'fi.configuration.fiscal_years.view',
                manage: 'fi.configuration.fiscal_years.manage',
            },
            currencies: {
                view: 'fi.configuration.currencies.view',
                manage: 'fi.configuration.currencies.manage',
            },
            tax_settings: {
                view: 'fi.configuration.tax_settings.view',
                manage: 'fi.configuration.tax_settings.manage',
            },
            tolerances: {
                view: 'fi.configuration.tolerances.view',
                manage: 'fi.configuration.tolerances.manage',
            },
            number_ranges: {
                view: 'fi.configuration.number_ranges.view',
                manage: 'fi.configuration.number_ranges.manage',
            },
            posting_rules: {
                view: 'fi.configuration.posting_rules.view',
                manage: 'fi.configuration.posting_rules.manage',
                simulate: 'fi.configuration.posting_rules.simulate',
            },
        },
        master_data: {
            accounts: {
                view: 'fi.master_data.accounts.view',
                manage: 'fi.master_data.accounts.manage',
            },
            customers: {
                view: 'fi.master_data.customers.view',
                manage: 'fi.master_data.customers.manage',
            },
            vendors: {
                view: 'fi.master_data.vendors.view',
                manage: 'fi.master_data.vendors.manage',
            },
            banks: {
                view: 'fi.master_data.banks.view',
                manage: 'fi.master_data.banks.manage',
            },

        },
        general_ledger: {
            accounts: {
                view: 'fi.general_ledger.accounts.view',
                manage: 'fi.general_ledger.accounts.manage',
            },
            subledgers: {
                view: 'fi.general_ledger.subledgers.view',
                allocate: 'fi.general_ledger.subledgers.allocate',
                manage: 'fi.general_ledger.subledgers.manage',
            },
            // GL Module settings
            balances: {
                view: 'fi.general_ledger.balances.view',
                recalculate: 'fi.general_ledger.balances.recalculate',
                rollforward: 'fi.general_ledger.balances.rollforward',
            },
            settings: {
                view: 'fi.general_ledger.settings.view',
                manage: 'fi.general_ledger.settings.manage',
                setup: 'fi.general_ledger.settings.setup',
            },
            // Data entity with approval - CRUD + approve pattern
            journal_entries: {
                read: 'fi.general_ledger.journal_entries.read',
                create: 'fi.general_ledger.journal_entries.create',
                update: 'fi.general_ledger.journal_entries.update',
                submit: 'fi.general_ledger.journal_entries.submit',
                delete: 'fi.general_ledger.journal_entries.delete',
                reverse: 'fi.general_ledger.journal_entries.reverse',
                reject: 'fi.general_ledger.journal_entries.reject',
                approve: 'fi.general_ledger.journal_entries.approve', // -> can approve: if Journal Approval Configured 
            },
            // Non-data (reporting) - view/action pattern
            reports: {
                view: 'fi.general_ledger.reports.view',
                generate: 'fi.general_ledger.reports.generate',
                approve: 'fi.general_ledger.reports.approve', // -> can approve: if Report Approval Configured
                export: 'fi.general_ledger.reports.export',
            },
            // Multi-entity consolidation (Agency-level)
            consolidation: {
                view: 'fi.general_ledger.consolidation.view',
                manage: 'fi.general_ledger.consolidation.manage',
            },
            // Year-end closing operations
            year_end: {
                view: 'fi.general_ledger.year_end.view',
                manage: 'fi.general_ledger.year_end.manage',
                close: 'fi.general_ledger.year_end.close', // Execute year-end closing
            },
            // Account reconciliation
            reconciliation: {
                view: 'fi.general_ledger.reconciliation.view',
                manage: 'fi.general_ledger.reconciliation.manage',
                clear: 'fi.general_ledger.reconciliation.clear', // -> perform clearing of open items
                reset: 'fi.general_ledger.reconciliation.reset', // -> reset cleared items
            },
        },
        // Accounts Receivable - add-on module
        accounts_receivable: {
            subledgers: {
                view: 'fi.accounts_receivable.subledgers.view',
                allocate: 'fi.accounts_receivable.subledgers.allocate',
                manage: 'fi.accounts_receivable.subledgers.manage',
            },

        },
        // Accounts Payable - add-on module
        accounts_payable: {
            subledgers: {
                view: 'fi.accounts_payable.subledgers.view',
                allocate: 'fi.accounts_payable.subledgers.allocate',
                manage: 'fi.accounts_payable.subledgers.manage',
            },
        },
        // Bank Ledger - add-on module
        bank_ledger: {
            bank_accounts: {
                view: 'fi.bank_ledger.bank_accounts.view',
                manage: 'fi.bank_ledger.bank_accounts.manage',
            },
            subledgers: {
                view: 'fi.bank_ledger.subledgers.view',
                allocate: 'fi.bank_ledger.subledgers.allocate',
                manage: 'fi.bank_ledger.subledgers.manage',
            },
        },
        // Controlling (Cost Centers) - add-on module
        // @deprecated - Use co.cost_centers instead. Kept for backward compatibility.
        controlling: {
            cost_centers: {
                view: 'fi.controlling.cost_centers.view',
                manage: 'fi.controlling.cost_centers.manage',
            },
        },
        advanced_reporting: {
            financial_statements: {
                view: 'fi.advanced_reporting.financial_statements.view',
                generate: 'fi.advanced_reporting.financial_statements.generate',
            },
            custom_reports: {
                view: 'fi.advanced_reporting.custom_reports.view',
                create: 'fi.advanced_reporting.custom_reports.create',
                update: 'fi.advanced_reporting.custom_reports.update',
                delete: 'fi.advanced_reporting.custom_reports.delete',
            },
        },
    },
    crm: {
        customers: {
            // Data entity - CRUD pattern
            contact: {
                read: 'crm.customers.contact.read',
                create: 'crm.customers.contact.create',
                update: 'crm.customers.contact.update',
                delete: 'crm.customers.contact.delete',
            },
            billing: { // Rebilling related permissions
                read: 'crm.customers.billing.read',
                create: 'crm.customers.billing.create',
                update: 'crm.customers.billing.update',
                delete: 'crm.customers.billing.delete',
            },

        },
        media: {
            // Data entity - CRUD pattern
            file: {
                read: 'crm.media.file.read',
                create: 'crm.media.file.create',
                delete: 'crm.media.file.delete',
            },
        },
        funnels: {
            // Data entity - CRUD pattern + publish action
            content: {
                read: 'crm.funnels.content.read',
                create: 'crm.funnels.content.create',
                update: 'crm.funnels.content.update',
                delete: 'crm.funnels.content.delete',
                publish: 'crm.funnels.content.publish',
            }
        },
        pipelines: {
            // Data entities - CRUD pattern
            lane: {
                read: 'crm.pipelines.lane.read',
                create: 'crm.pipelines.lane.create',
                update: 'crm.pipelines.lane.update',
                delete: 'crm.pipelines.lane.delete',
            },
            ticket: {
                read: 'crm.pipelines.ticket.read',
                create: 'crm.pipelines.ticket.create',
                update: 'crm.pipelines.ticket.update',
                delete: 'crm.pipelines.ticket.delete',
            },
            tag: {
                read: 'crm.pipelines.tag.read',
                create: 'crm.pipelines.tag.create',
                update: 'crm.pipelines.tag.update',
                delete: 'crm.pipelines.tag.delete',
            },
        },
    },
    /**
     * CO - Controlling Module (SAP CO equivalent)
     * Separate from FI for internal cost analysis and management reporting.
     * 
     * SAP Reference:
     * - CO-CCA: Cost Center Accounting
     * - CO-PCA: Profit Center Accounting  
     * - CO-PA: Profitability Analysis
     * - CO-OM-OPA: Internal Orders
     * - CO-PC: Product Costing
     */
    co: {
        // CO-CCA: Cost Center Accounting
        cost_centers: {
            master_data: {
                read: 'co.cost_centers.master_data.read',
                create: 'co.cost_centers.master_data.create',
                update: 'co.cost_centers.master_data.update',
                delete: 'co.cost_centers.master_data.delete',
            },
            hierarchy: {
                view: 'co.cost_centers.hierarchy.view',
                manage: 'co.cost_centers.hierarchy.manage',
            },
            allocations: {
                view: 'co.cost_centers.allocations.view',
                execute: 'co.cost_centers.allocations.execute',
            },
            reports: {
                view: 'co.cost_centers.reports.view',
                generate: 'co.cost_centers.reports.generate',
            },
        },
        // CO-PCA: Profit Center Accounting
        profit_centers: {
            master_data: {
                read: 'co.profit_centers.master_data.read',
                create: 'co.profit_centers.master_data.create',
                update: 'co.profit_centers.master_data.update',
                delete: 'co.profit_centers.master_data.delete',
            },
            hierarchy: {
                view: 'co.profit_centers.hierarchy.view',
                manage: 'co.profit_centers.hierarchy.manage',
            },
            reports: {
                view: 'co.profit_centers.reports.view',
                generate: 'co.profit_centers.reports.generate',
            },
        },
        // CO-OM-OPA: Internal Orders (for tracking costs of internal projects/events)
        internal_orders: {
            master_data: {
                read: 'co.internal_orders.master_data.read',
                create: 'co.internal_orders.master_data.create',
                update: 'co.internal_orders.master_data.update',
                close: 'co.internal_orders.master_data.close',
            },
            settlement: {
                view: 'co.internal_orders.settlement.view',
                execute: 'co.internal_orders.settlement.execute',
            },
        },
        // CO-PA: Profitability Analysis
        profitability: {
            segments: {
                view: 'co.profitability.segments.view',
                manage: 'co.profitability.segments.manage',
            },
            reports: {
                view: 'co.profitability.reports.view',
                generate: 'co.profitability.reports.generate',
            },
        },
        // Budgeting (integrates with cost centers)
        budgets: {
            planning: {
                view: 'co.budgets.planning.view',
                create: 'co.budgets.planning.create',
                update: 'co.budgets.planning.update',
                approve: 'co.budgets.planning.approve',
            },
            monitoring: {
                view: 'co.budgets.monitoring.view',
                alerts: 'co.budgets.monitoring.alerts',
            },
        },
    },
    /**
     * MM - Materials Management Module (SAP MM equivalent)
     * @future Ready for integration with existing inventory system.
     * 
     * SAP Reference:
     * - MM-PUR: Purchasing
     * - MM-IM: Inventory Management
     * - MM-IV: Invoice Verification
     * - MM-WM: Warehouse Management
     * 
     * Integration Points:
     * - FI-AP: Invoice → Vendor Payment
     * - FI-GL: Goods Receipt → Inventory Account
     * - CO: Cost allocation for materials
     */
    // mm: {
    //     // MM-PUR: Purchasing
    //     purchasing: {
    //         requisitions: {
    //             read: 'mm.purchasing.requisitions.read',
    //             create: 'mm.purchasing.requisitions.create',
    //             approve: 'mm.purchasing.requisitions.approve',
    //             delete: 'mm.purchasing.requisitions.delete',
    //         },
    //         orders: {
    //             read: 'mm.purchasing.orders.read',
    //             create: 'mm.purchasing.orders.create',
    //             update: 'mm.purchasing.orders.update',
    //             approve: 'mm.purchasing.orders.approve',
    //             delete: 'mm.purchasing.orders.delete',
    //         },
    //         vendors: {
    //             read: 'mm.purchasing.vendors.read',
    //             create: 'mm.purchasing.vendors.create',
    //             update: 'mm.purchasing.vendors.update',
    //             block: 'mm.purchasing.vendors.block',
    //         },
    //     },
    //     // MM-IM: Inventory Management
    //     inventory: {
    //         materials: {
    //             read: 'mm.inventory.materials.read',
    //             create: 'mm.inventory.materials.create',
    //             update: 'mm.inventory.materials.update',
    //             delete: 'mm.inventory.materials.delete',
    //         },
    //         stock: {
    //             view: 'mm.inventory.stock.view',
    //             transfer: 'mm.inventory.stock.transfer',
    //             adjust: 'mm.inventory.stock.adjust',
    //         },
    //         goods_receipt: {
    //             create: 'mm.inventory.goods_receipt.create',
    //             reverse: 'mm.inventory.goods_receipt.reverse',
    //         },
    //         goods_issue: {
    //             create: 'mm.inventory.goods_issue.create',
    //             reverse: 'mm.inventory.goods_issue.reverse',
    //         },
    //         valuation: {
    //             view: 'mm.inventory.valuation.view',
    //             manage: 'mm.inventory.valuation.manage',
    //         },
    //     },
    //     // MM-IV: Invoice Verification (integrates with FI-AP)
    //     invoice_verification: {
    //         invoices: {
    //             read: 'mm.invoice_verification.invoices.read',
    //             create: 'mm.invoice_verification.invoices.create',
    //             verify: 'mm.invoice_verification.invoices.verify',
    //             block: 'mm.invoice_verification.invoices.block',
    //         },
    //     },
    //     // Configuration
    //     configuration: {
    //         plants: {
    //             view: 'mm.configuration.plants.view',
    //             manage: 'mm.configuration.plants.manage',
    //         },
    //         storage_locations: {
    //             view: 'mm.configuration.storage_locations.view',
    //             manage: 'mm.configuration.storage_locations.manage',
    //         },
    //         valuation_classes: {
    //             view: 'mm.configuration.valuation_classes.view',
    //             manage: 'mm.configuration.valuation_classes.manage',
    //         },
    //     },
    // },
} as const;


export type ModuleCode = keyof typeof KEYS;
export type ModuleKey = ModuleCode;
export type ModuleType = Uppercase<ModuleCode>;

export type SubModuleOf<M extends ModuleCode> = M extends keyof typeof KEYS
    ? Extract<keyof (typeof KEYS)[M], string>
    : never;

export type ResourceOf<M extends ModuleCode, S extends SubModuleOf<M>> = Extract<
    keyof (typeof KEYS)[M][S],
    string
>; 

export type ActionOf<
    M extends ModuleCode,
    S extends SubModuleOf<M>,
    R extends ResourceOf<M, S>
> = Extract<keyof (typeof KEYS)[M][S][R], string>;

// Union types for all levels
export type SubModuleCode = {
    [M in ModuleCode]: Extract<keyof (typeof KEYS)[M], string>
}[ModuleCode];

export type SubModuleKey = {
    [M in ModuleCode]: `${M}.${SubModuleOf<M>}`
}[ModuleCode];

export type SubModuleType = Uppercase<SubModuleCode>;
