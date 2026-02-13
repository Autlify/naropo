
'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import {
  coaTemplateSchema,
  type COATemplateInput,
} from '@/lib/schemas/fi/general-ledger/coa-template'
import { logGLAudit } from './audit'
import { AccountType } from '@/generated/prisma/client'
import { GLNormalBalance as NormalBalance } from '@/lib/schemas/fi/general-ledger/balances'
import { getActionContext, hasContextPermission, type ActionContext } from '@/lib/features/iam/authz/action-context'


// ========== Types ==========

type ActionResult<T> = {
  success: boolean
  data?: T
  error?: string
}

type TemplateContext = ActionContext

type TemplateAccount = {
  code: string
  name: string
  type: AccountType
  normalBalance: NormalBalance // TOVERIFY: should this be BalanceType instead of NormalBalance?
  description?: string
  isSystemAccount?: boolean
  parentCode?: string
  children?: TemplateAccount[]
}

// ========== Helper Functions ==========

const getContext = getActionContext
const checkPermission = hasContextPermission

// ========== Built-in Templates ==========
// TODO: Include more detailed templates for various industries, and differentiate PL into Operating vs Non-Operating too
const STANDARD_COA_TEMPLATE: TemplateAccount[] = [
  // Assets (1000-1999)
  {
    code: '1000',
    name: 'Assets',
    type: 'ASSET',
    normalBalance: 'DEBIT',
    description: 'Total Assets',
    children: [
      {
        code: '1100',
        name: 'Current Assets',
        type: 'ASSET',
        normalBalance: 'DEBIT',
        children: [
          { code: '1110', name: 'Cash and Cash Equivalents', type: 'ASSET', normalBalance: 'DEBIT', isSystemAccount: true },
          { code: '1120', name: 'Accounts Receivable', type: 'ASSET', normalBalance: 'DEBIT', isSystemAccount: true },
          { code: '1130', name: 'Allowance for Doubtful Accounts', type: 'ASSET', normalBalance: 'CREDIT' },
          { code: '1140', name: 'Inventory', type: 'ASSET', normalBalance: 'DEBIT' },
          { code: '1150', name: 'Prepaid Expenses', type: 'ASSET', normalBalance: 'DEBIT' },
        ],
      },
      {
        code: '1500',
        name: 'Non-Current Assets',
        type: 'ASSET',
        normalBalance: 'DEBIT',
        children: [
          { code: '1510', name: 'Property, Plant & Equipment', type: 'ASSET', normalBalance: 'DEBIT' },
          { code: '1520', name: 'Accumulated Depreciation', type: 'ASSET', normalBalance: 'CREDIT' },
          { code: '1530', name: 'Intangible Assets', type: 'ASSET', normalBalance: 'DEBIT' },
          { code: '1540', name: 'Investments', type: 'ASSET', normalBalance: 'DEBIT' },
        ],
      },
    ],
  },
  // Liabilities (2000-2999)
  {
    code: '2000',
    name: 'Liabilities',
    type: 'LIABILITY',
    normalBalance: 'CREDIT',
    description: 'Total Liabilities',
    children: [
      {
        code: '2100',
        name: 'Current Liabilities',
        type: 'LIABILITY',
        normalBalance: 'CREDIT',
        children: [
          { code: '2110', name: 'Accounts Payable', type: 'LIABILITY', normalBalance: 'CREDIT', isSystemAccount: true },
          { code: '2120', name: 'Accrued Expenses', type: 'LIABILITY', normalBalance: 'CREDIT' },
          { code: '2130', name: 'Unearned Revenue', type: 'LIABILITY', normalBalance: 'CREDIT' },
          { code: '2140', name: 'Short-term Debt', type: 'LIABILITY', normalBalance: 'CREDIT' },
          { code: '2150', name: 'Taxes Payable', type: 'LIABILITY', normalBalance: 'CREDIT' },
        ],
      },
      {
        code: '2500',
        name: 'Non-Current Liabilities',
        type: 'LIABILITY',
        normalBalance: 'CREDIT',
        children: [
          { code: '2510', name: 'Long-term Debt', type: 'LIABILITY', normalBalance: 'CREDIT' },
          { code: '2520', name: 'Deferred Tax Liability', type: 'LIABILITY', normalBalance: 'CREDIT' },
        ],
      },
    ],
  },
  // Equity (3000-3999)
  {
    code: '3000',
    name: 'Equity',
    type: 'EQUITY',
    normalBalance: 'CREDIT',
    description: 'Total Equity',
    children: [
      { code: '3100', name: 'Common Stock', type: 'EQUITY', normalBalance: 'CREDIT' },
      { code: '3200', name: 'Retained Earnings', type: 'EQUITY', normalBalance: 'CREDIT', isSystemAccount: true },
      { code: '3300', name: 'Current Year Earnings', type: 'EQUITY', normalBalance: 'CREDIT', isSystemAccount: true },
      { code: '3400', name: 'Treasury Stock', type: 'EQUITY', normalBalance: 'DEBIT' },
    ],
  },
  // Revenue (4000-4999)
  {
    code: '4000',
    name: 'Revenue',
    type: 'REVENUE',
    normalBalance: 'CREDIT',
    description: 'Total Revenue',
    children: [
      { code: '4100', name: 'Sales Revenue', type: 'REVENUE', normalBalance: 'CREDIT' },
      { code: '4200', name: 'Service Revenue', type: 'REVENUE', normalBalance: 'CREDIT' },
      { code: '4300', name: 'Interest Income', type: 'REVENUE', normalBalance: 'CREDIT' },
      { code: '4400', name: 'Other Income', type: 'REVENUE', normalBalance: 'CREDIT' },
    ],
  },
  // Expenses (5000-5999)
  {
    code: '5000',
    name: 'Expenses',
    type: 'EXPENSE',
    normalBalance: 'DEBIT',
    description: 'Total Expenses',
    children: [
      { code: '5100', name: 'Cost of Goods Sold', type: 'EXPENSE', normalBalance: 'DEBIT' },
      { code: '5200', name: 'Salaries & Wages', type: 'EXPENSE', normalBalance: 'DEBIT' },
      { code: '5300', name: 'Rent Expense', type: 'EXPENSE', normalBalance: 'DEBIT' },
      { code: '5400', name: 'Utilities Expense', type: 'EXPENSE', normalBalance: 'DEBIT' },
      { code: '5500', name: 'Depreciation Expense', type: 'EXPENSE', normalBalance: 'DEBIT' },
      { code: '5600', name: 'Interest Expense', type: 'EXPENSE', normalBalance: 'DEBIT' },
      { code: '5700', name: 'Professional Fees', type: 'EXPENSE', normalBalance: 'DEBIT' },
      { code: '5800', name: 'Marketing Expense', type: 'EXPENSE', normalBalance: 'DEBIT' },
      { code: '5900', name: 'Other Expenses', type: 'EXPENSE', normalBalance: 'DEBIT' },
    ],
  },
]

const SERVICE_BUSINESS_TEMPLATE: TemplateAccount[] = [
  // Assets (1000-1999)
  {
    code: '1000',
    name: 'Assets',
    type: 'ASSET',
    normalBalance: 'DEBIT',
    description: 'Total Assets',
    children: [
      {
        code: '1100',
        name: 'Current Assets',
        type: 'ASSET',
        normalBalance: 'DEBIT',
        children: [
          { code: '1110', name: 'Cash and Cash Equivalents', type: 'ASSET', normalBalance: 'DEBIT', isSystemAccount: true },
          { code: '1120', name: 'Accounts Receivable', type: 'ASSET', normalBalance: 'DEBIT', isSystemAccount: true },
          { code: '1130', name: 'Allowance for Doubtful Accounts', type: 'ASSET', normalBalance: 'CREDIT' },
          { code: '1140', name: 'Work in Progress', type: 'ASSET', normalBalance: 'DEBIT' },
          { code: '1150', name: 'Prepaid Expenses', type: 'ASSET', normalBalance: 'DEBIT' },
        ],
      },
      {
        code: '1500',
        name: 'Non-Current Assets',
        type: 'ASSET',
        normalBalance: 'DEBIT',
        children: [
          { code: '1510', name: 'Office Equipment', type: 'ASSET', normalBalance: 'DEBIT' },
          { code: '1520', name: 'Computer Equipment', type: 'ASSET', normalBalance: 'DEBIT' },
          { code: '1530', name: 'Accumulated Depreciation', type: 'ASSET', normalBalance: 'CREDIT' },
          { code: '1540', name: 'Software Licenses', type: 'ASSET', normalBalance: 'DEBIT' },
        ],
      },
    ],
  },
  // Liabilities (2000-2999)
  {
    code: '2000',
    name: 'Liabilities',
    type: 'LIABILITY',
    normalBalance: 'CREDIT',
    description: 'Total Liabilities',
    children: [
      {
        code: '2100',
        name: 'Current Liabilities',
        type: 'LIABILITY',
        normalBalance: 'CREDIT',
        children: [
          { code: '2110', name: 'Accounts Payable', type: 'LIABILITY', normalBalance: 'CREDIT', isSystemAccount: true },
          { code: '2120', name: 'Accrued Salaries', type: 'LIABILITY', normalBalance: 'CREDIT' },
          { code: '2130', name: 'Deferred Revenue', type: 'LIABILITY', normalBalance: 'CREDIT' },
          { code: '2140', name: 'Client Deposits', type: 'LIABILITY', normalBalance: 'CREDIT' },
          { code: '2150', name: 'Payroll Taxes Payable', type: 'LIABILITY', normalBalance: 'CREDIT' },
          { code: '2160', name: 'Sales Tax Payable', type: 'LIABILITY', normalBalance: 'CREDIT' },
        ],
      },
      {
        code: '2500',
        name: 'Non-Current Liabilities',
        type: 'LIABILITY',
        normalBalance: 'CREDIT',
        children: [
          { code: '2510', name: 'Long-term Loans', type: 'LIABILITY', normalBalance: 'CREDIT' },
        ],
      },
    ],
  },
  // Equity (3000-3999)
  {
    code: '3000',
    name: 'Equity',
    type: 'EQUITY',
    normalBalance: 'CREDIT',
    description: 'Total Equity',
    children: [
      { code: '3100', name: 'Owner\'s Capital', type: 'EQUITY', normalBalance: 'CREDIT' },
      { code: '3200', name: 'Retained Earnings', type: 'EQUITY', normalBalance: 'CREDIT', isSystemAccount: true },
      { code: '3300', name: 'Current Year Earnings', type: 'EQUITY', normalBalance: 'CREDIT', isSystemAccount: true },
      { code: '3400', name: 'Drawings', type: 'EQUITY', normalBalance: 'DEBIT' },
    ],
  },
  // Revenue (4000-4999)
  {
    code: '4000',
    name: 'Revenue',
    type: 'REVENUE',
    normalBalance: 'CREDIT',
    description: 'Total Revenue',
    children: [
      { code: '4100', name: 'Consulting Revenue', type: 'REVENUE', normalBalance: 'CREDIT' },
      { code: '4200', name: 'Professional Services Revenue', type: 'REVENUE', normalBalance: 'CREDIT' },
      { code: '4300', name: 'Retainer Revenue', type: 'REVENUE', normalBalance: 'CREDIT' },
      { code: '4400', name: 'Training Revenue', type: 'REVENUE', normalBalance: 'CREDIT' },
      { code: '4500', name: 'Reimbursable Expenses', type: 'REVENUE', normalBalance: 'CREDIT' },
      { code: '4900', name: 'Other Income', type: 'REVENUE', normalBalance: 'CREDIT' },
    ],
  },
  // Expenses (5000-5999)
  {
    code: '5000',
    name: 'Expenses',
    type: 'EXPENSE',
    normalBalance: 'DEBIT',
    description: 'Total Expenses',
    children: [
      { code: '5100', name: 'Salaries & Wages', type: 'EXPENSE', normalBalance: 'DEBIT' },
      { code: '5110', name: 'Payroll Taxes', type: 'EXPENSE', normalBalance: 'DEBIT' },
      { code: '5120', name: 'Employee Benefits', type: 'EXPENSE', normalBalance: 'DEBIT' },
      { code: '5200', name: 'Contractor Expenses', type: 'EXPENSE', normalBalance: 'DEBIT' },
      { code: '5300', name: 'Rent Expense', type: 'EXPENSE', normalBalance: 'DEBIT' },
      { code: '5400', name: 'Utilities', type: 'EXPENSE', normalBalance: 'DEBIT' },
      { code: '5500', name: 'Software & Subscriptions', type: 'EXPENSE', normalBalance: 'DEBIT' },
      { code: '5600', name: 'Professional Development', type: 'EXPENSE', normalBalance: 'DEBIT' },
      { code: '5700', name: 'Professional Fees', type: 'EXPENSE', normalBalance: 'DEBIT' },
      { code: '5800', name: 'Travel & Entertainment', type: 'EXPENSE', normalBalance: 'DEBIT' },
      { code: '5850', name: 'Office Supplies', type: 'EXPENSE', normalBalance: 'DEBIT' },
      { code: '5900', name: 'Depreciation Expense', type: 'EXPENSE', normalBalance: 'DEBIT' },
      { code: '5950', name: 'Insurance Expense', type: 'EXPENSE', normalBalance: 'DEBIT' },
      { code: '5990', name: 'Other Expenses', type: 'EXPENSE', normalBalance: 'DEBIT' },
    ],
  },
]

const AGENCY_TEMPLATE: TemplateAccount[] = [
  // Assets (1000-1999)
  {
    code: '1000',
    name: 'Assets',
    type: 'ASSET',
    normalBalance: 'DEBIT',
    description: 'Total Assets',
    children: [
      {
        code: '1100',
        name: 'Current Assets',
        type: 'ASSET',
        normalBalance: 'DEBIT',
        children: [
          { code: '1110', name: 'Operating Cash Account', type: 'ASSET', normalBalance: 'DEBIT', isSystemAccount: true },
          { code: '1115', name: 'Payroll Cash Account', type: 'ASSET', normalBalance: 'DEBIT' },
          { code: '1120', name: 'Client Receivables', type: 'ASSET', normalBalance: 'DEBIT', isSystemAccount: true },
          { code: '1125', name: 'Unbilled Work in Progress', type: 'ASSET', normalBalance: 'DEBIT' },
          { code: '1130', name: 'Allowance for Doubtful Accounts', type: 'ASSET', normalBalance: 'CREDIT' },
          { code: '1140', name: 'Media Buying Receivables', type: 'ASSET', normalBalance: 'DEBIT' },
          { code: '1150', name: 'Prepaid Media Costs', type: 'ASSET', normalBalance: 'DEBIT' },
          { code: '1160', name: 'Prepaid Expenses', type: 'ASSET', normalBalance: 'DEBIT' },
          { code: '1170', name: 'Employee Advances', type: 'ASSET', normalBalance: 'DEBIT' },
        ],
      },
      {
        code: '1500',
        name: 'Non-Current Assets',
        type: 'ASSET',
        normalBalance: 'DEBIT',
        children: [
          { code: '1510', name: 'Office Furniture & Fixtures', type: 'ASSET', normalBalance: 'DEBIT' },
          { code: '1520', name: 'Computer & Video Equipment', type: 'ASSET', normalBalance: 'DEBIT' },
          { code: '1530', name: 'Leasehold Improvements', type: 'ASSET', normalBalance: 'DEBIT' },
          { code: '1540', name: 'Accumulated Depreciation', type: 'ASSET', normalBalance: 'CREDIT' },
          { code: '1550', name: 'Software & Licenses', type: 'ASSET', normalBalance: 'DEBIT' },
          { code: '1560', name: 'Security Deposits', type: 'ASSET', normalBalance: 'DEBIT' },
        ],
      },
    ],
  },
  // Liabilities (2000-2999)
  {
    code: '2000',
    name: 'Liabilities',
    type: 'LIABILITY',
    normalBalance: 'CREDIT',
    description: 'Total Liabilities',
    children: [
      {
        code: '2100',
        name: 'Current Liabilities',
        type: 'LIABILITY',
        normalBalance: 'CREDIT',
        children: [
          { code: '2110', name: 'Vendor Payables', type: 'LIABILITY', normalBalance: 'CREDIT', isSystemAccount: true },
          { code: '2115', name: 'Media Vendor Payables', type: 'LIABILITY', normalBalance: 'CREDIT' },
          { code: '2120', name: 'Freelancer Payables', type: 'LIABILITY', normalBalance: 'CREDIT' },
          { code: '2130', name: 'Accrued Expenses', type: 'LIABILITY', normalBalance: 'CREDIT' },
          { code: '2140', name: 'Client Deposits & Retainers', type: 'LIABILITY', normalBalance: 'CREDIT' },
          { code: '2150', name: 'Deferred Revenue', type: 'LIABILITY', normalBalance: 'CREDIT' },
          { code: '2160', name: 'Payroll Liabilities', type: 'LIABILITY', normalBalance: 'CREDIT' },
          { code: '2170', name: 'Credit Cards Payable', type: 'LIABILITY', normalBalance: 'CREDIT' },
          { code: '2180', name: 'Sales Tax Payable', type: 'LIABILITY', normalBalance: 'CREDIT' },
        ],
      },
      {
        code: '2500',
        name: 'Non-Current Liabilities',
        type: 'LIABILITY',
        normalBalance: 'CREDIT',
        children: [
          { code: '2510', name: 'Line of Credit', type: 'LIABILITY', normalBalance: 'CREDIT' },
          { code: '2520', name: 'Long-term Debt', type: 'LIABILITY', normalBalance: 'CREDIT' },
          { code: '2530', name: 'Deferred Rent', type: 'LIABILITY', normalBalance: 'CREDIT' },
        ],
      },
    ],
  },
  // Equity (3000-3999)
  {
    code: '3000',
    name: 'Equity',
    type: 'EQUITY',
    normalBalance: 'CREDIT',
    description: 'Total Equity',
    children: [
      { code: '3100', name: 'Partner/Shareholder Capital', type: 'EQUITY', normalBalance: 'CREDIT' },
      { code: '3200', name: 'Retained Earnings', type: 'EQUITY', normalBalance: 'CREDIT', isSystemAccount: true },
      { code: '3300', name: 'Current Year Earnings', type: 'EQUITY', normalBalance: 'CREDIT', isSystemAccount: true },
      { code: '3400', name: 'Distributions', type: 'EQUITY', normalBalance: 'DEBIT' },
    ],
  },
  // Revenue (4000-4999)
  {
    code: '4000',
    name: 'Revenue',
    type: 'REVENUE',
    normalBalance: 'CREDIT',
    description: 'Total Revenue',
    children: [
      {
        code: '4100',
        name: 'Agency Fee Revenue',
        type: 'REVENUE',
        normalBalance: 'CREDIT',
        children: [
          { code: '4110', name: 'Retainer Fees', type: 'REVENUE', normalBalance: 'CREDIT' },
          { code: '4120', name: 'Project Fees', type: 'REVENUE', normalBalance: 'CREDIT' },
          { code: '4130', name: 'Hourly Billing', type: 'REVENUE', normalBalance: 'CREDIT' },
          { code: '4140', name: 'Performance Bonuses', type: 'REVENUE', normalBalance: 'CREDIT' },
        ],
      },
      {
        code: '4200',
        name: 'Service Revenue',
        type: 'REVENUE',
        normalBalance: 'CREDIT',
        children: [
          { code: '4210', name: 'Creative Services', type: 'REVENUE', normalBalance: 'CREDIT' },
          { code: '4220', name: 'Strategy & Planning', type: 'REVENUE', normalBalance: 'CREDIT' },
          { code: '4230', name: 'Digital Marketing', type: 'REVENUE', normalBalance: 'CREDIT' },
          { code: '4240', name: 'Social Media Management', type: 'REVENUE', normalBalance: 'CREDIT' },
          { code: '4250', name: 'Content Production', type: 'REVENUE', normalBalance: 'CREDIT' },
          { code: '4260', name: 'Web Development', type: 'REVENUE', normalBalance: 'CREDIT' },
          { code: '4270', name: 'SEO/SEM Services', type: 'REVENUE', normalBalance: 'CREDIT' },
        ],
      },
      {
        code: '4300',
        name: 'Media Revenue',
        type: 'REVENUE',
        normalBalance: 'CREDIT',
        children: [
          { code: '4310', name: 'Media Commissions', type: 'REVENUE', normalBalance: 'CREDIT' },
          { code: '4320', name: 'Media Markup', type: 'REVENUE', normalBalance: 'CREDIT' },
        ],
      },
      {
        code: '4400',
        name: 'Production Pass-Through',
        type: 'REVENUE',
        normalBalance: 'CREDIT',
        children: [
          { code: '4410', name: 'Print Production', type: 'REVENUE', normalBalance: 'CREDIT' },
          { code: '4420', name: 'Video Production', type: 'REVENUE', normalBalance: 'CREDIT' },
          { code: '4430', name: 'Photography', type: 'REVENUE', normalBalance: 'CREDIT' },
        ],
      },
      { code: '4900', name: 'Other Income', type: 'REVENUE', normalBalance: 'CREDIT' },
    ],
  },
  // Cost of Services (5000-5499)
  {
    code: '5000',
    name: 'Cost of Services',
    type: 'EXPENSE',
    normalBalance: 'DEBIT',
    description: 'Direct costs related to client work',
    children: [
      { code: '5100', name: 'Freelance & Contract Labor', type: 'EXPENSE', normalBalance: 'DEBIT' },
      { code: '5200', name: 'Media Costs', type: 'EXPENSE', normalBalance: 'DEBIT' },
      { code: '5300', name: 'Production Costs', type: 'EXPENSE', normalBalance: 'DEBIT' },
      { code: '5400', name: 'Stock Assets & Licensing', type: 'EXPENSE', normalBalance: 'DEBIT' },
      { code: '5450', name: 'Client Reimbursable Expenses', type: 'EXPENSE', normalBalance: 'DEBIT' },
    ],
  },
  // Operating Expenses (6000-6999)
  {
    code: '6000',
    name: 'Operating Expenses',
    type: 'EXPENSE',
    normalBalance: 'DEBIT',
    description: 'General operating expenses',
    children: [
      {
        code: '6100',
        name: 'Payroll Expenses',
        type: 'EXPENSE',
        normalBalance: 'DEBIT',
        children: [
          { code: '6110', name: 'Salaries & Wages', type: 'EXPENSE', normalBalance: 'DEBIT' },
          { code: '6120', name: 'Payroll Taxes', type: 'EXPENSE', normalBalance: 'DEBIT' },
          { code: '6130', name: 'Health Insurance', type: 'EXPENSE', normalBalance: 'DEBIT' },
          { code: '6140', name: 'Retirement Benefits', type: 'EXPENSE', normalBalance: 'DEBIT' },
          { code: '6150', name: 'Bonuses & Incentives', type: 'EXPENSE', normalBalance: 'DEBIT' },
        ],
      },
      {
        code: '6200',
        name: 'Occupancy Expenses',
        type: 'EXPENSE',
        normalBalance: 'DEBIT',
        children: [
          { code: '6210', name: 'Office Rent', type: 'EXPENSE', normalBalance: 'DEBIT' },
          { code: '6220', name: 'Utilities', type: 'EXPENSE', normalBalance: 'DEBIT' },
          { code: '6230', name: 'Office Maintenance', type: 'EXPENSE', normalBalance: 'DEBIT' },
        ],
      },
      {
        code: '6300',
        name: 'Technology Expenses',
        type: 'EXPENSE',
        normalBalance: 'DEBIT',
        children: [
          { code: '6310', name: 'Software Subscriptions', type: 'EXPENSE', normalBalance: 'DEBIT' },
          { code: '6320', name: 'Cloud Services', type: 'EXPENSE', normalBalance: 'DEBIT' },
          { code: '6330', name: 'IT Support', type: 'EXPENSE', normalBalance: 'DEBIT' },
          { code: '6340', name: 'Equipment Maintenance', type: 'EXPENSE', normalBalance: 'DEBIT' },
        ],
      },
      {
        code: '6400',
        name: 'Business Development',
        type: 'EXPENSE',
        normalBalance: 'DEBIT',
        children: [
          { code: '6410', name: 'New Business Pitches', type: 'EXPENSE', normalBalance: 'DEBIT' },
          { code: '6420', name: 'Marketing & Advertising', type: 'EXPENSE', normalBalance: 'DEBIT' },
          { code: '6430', name: 'Industry Events', type: 'EXPENSE', normalBalance: 'DEBIT' },
          { code: '6440', name: 'Client Entertainment', type: 'EXPENSE', normalBalance: 'DEBIT' },
        ],
      },
      { code: '6500', name: 'Travel & Transportation', type: 'EXPENSE', normalBalance: 'DEBIT' },
      { code: '6600', name: 'Professional Fees', type: 'EXPENSE', normalBalance: 'DEBIT' },
      { code: '6700', name: 'Insurance', type: 'EXPENSE', normalBalance: 'DEBIT' },
      { code: '6800', name: 'Depreciation & Amortization', type: 'EXPENSE', normalBalance: 'DEBIT' },
      { code: '6900', name: 'Office Supplies & Expenses', type: 'EXPENSE', normalBalance: 'DEBIT' },
      { code: '6950', name: 'Training & Development', type: 'EXPENSE', normalBalance: 'DEBIT' },
      { code: '6990', name: 'Other Operating Expenses', type: 'EXPENSE', normalBalance: 'DEBIT' },
    ],
  },
  // Other Income/Expense (7000-7999)
  {
    code: '7000',
    name: 'Other Income & Expenses',
    type: 'EXPENSE',
    normalBalance: 'DEBIT',
    description: 'Non-operating items',
    children: [
      { code: '7100', name: 'Interest Income', type: 'REVENUE', normalBalance: 'CREDIT' },
      { code: '7200', name: 'Interest Expense', type: 'EXPENSE', normalBalance: 'DEBIT' },
      { code: '7300', name: 'Bank Fees', type: 'EXPENSE', normalBalance: 'DEBIT' },
      { code: '7900', name: 'Other Non-Operating', type: 'EXPENSE', normalBalance: 'DEBIT' },
    ],
  },
]

const MINIMAL_COA_TEMPLATE: TemplateAccount[] = [
  // Assets
  {
    code: '1000',
    name: 'Assets',
    type: 'ASSET',
    normalBalance: 'DEBIT',
    description: 'Total Assets',
    children: [
      { code: '1100', name: 'Cash', type: 'ASSET', normalBalance: 'DEBIT', isSystemAccount: true },
      { code: '1200', name: 'Accounts Receivable', type: 'ASSET', normalBalance: 'DEBIT', isSystemAccount: true },
      { code: '1500', name: 'Fixed Assets', type: 'ASSET', normalBalance: 'DEBIT' },
    ],
  },
  // Liabilities
  {
    code: '2000',
    name: 'Liabilities',
    type: 'LIABILITY',
    normalBalance: 'CREDIT',
    description: 'Total Liabilities',
    children: [
      { code: '2100', name: 'Accounts Payable', type: 'LIABILITY', normalBalance: 'CREDIT', isSystemAccount: true },
      { code: '2200', name: 'Accrued Liabilities', type: 'LIABILITY', normalBalance: 'CREDIT' },
      { code: '2500', name: 'Long-term Debt', type: 'LIABILITY', normalBalance: 'CREDIT' },
    ],
  },
  // Equity
  {
    code: '3000',
    name: 'Equity',
    type: 'EQUITY',
    normalBalance: 'CREDIT',
    description: 'Total Equity',
    children: [
      { code: '3100', name: 'Owner\'s Equity', type: 'EQUITY', normalBalance: 'CREDIT' },
      { code: '3200', name: 'Retained Earnings', type: 'EQUITY', normalBalance: 'CREDIT', isSystemAccount: true },
      { code: '3300', name: 'Current Year Earnings', type: 'EQUITY', normalBalance: 'CREDIT', isSystemAccount: true },
    ],
  },
  // Revenue
  {
    code: '4000',
    name: 'Revenue',
    type: 'REVENUE',
    normalBalance: 'CREDIT',
    description: 'Total Revenue',
    children: [
      { code: '4100', name: 'Sales Revenue', type: 'REVENUE', normalBalance: 'CREDIT' },
      { code: '4200', name: 'Service Revenue', type: 'REVENUE', normalBalance: 'CREDIT' },
      { code: '4900', name: 'Other Income', type: 'REVENUE', normalBalance: 'CREDIT' },
    ],
  },
  // Expenses
  {
    code: '5000',
    name: 'Expenses',
    type: 'EXPENSE',
    normalBalance: 'DEBIT',
    description: 'Total Expenses',
    children: [
      { code: '5100', name: 'Cost of Goods Sold', type: 'EXPENSE', normalBalance: 'DEBIT' },
      { code: '5200', name: 'Payroll Expenses', type: 'EXPENSE', normalBalance: 'DEBIT' },
      { code: '5300', name: 'Rent Expense', type: 'EXPENSE', normalBalance: 'DEBIT' },
      { code: '5400', name: 'Utilities', type: 'EXPENSE', normalBalance: 'DEBIT' },
      { code: '5500', name: 'Office Supplies', type: 'EXPENSE', normalBalance: 'DEBIT' },
      { code: '5900', name: 'Other Expenses', type: 'EXPENSE', normalBalance: 'DEBIT' },
    ],
  },
]

// ========== Template Actions ==========

export const getAvailableTemplates = async (): Promise<
  ActionResult<{ id: string; name: string; description: string; accountCount: number }[]>
> => {
  try {
    const templates = [
      {
        id: 'standard',
        name: 'Standard Business COA',
        description: 'General-purpose chart of accounts suitable for most businesses',
        accountCount: 45,
      },
      {
        id: 'service-business',
        name: 'Service Business COA',
        description: 'Optimized for professional service companies',
        accountCount: 38,
      },
      {
        id: 'agency',
        name: 'Agency/Creative COA',
        description: 'Designed for marketing and creative agencies with project tracking',
        accountCount: 52,
      },
      {
        id: 'minimal',
        name: 'Minimal COA',
        description: 'Basic accounts for simple bookkeeping needs',
        accountCount: 20,
      },
    ]

    // Also fetch custom templates
    const context = await getContext()
    if (context) {
      const customTemplates = await db.cOATemplate.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          description: true,
          template: true,
        },
      })

      customTemplates.forEach((t) => {
        const templateData = t.template as any
        templates.push({
          id: t.id,
          name: t.name,
          description: t.description ?? 'Custom template',
          accountCount: Array.isArray(templateData) ? templateData.length : 0,
        })
      })
    }

    return { success: true, data: templates }
  } catch (error) {
    console.error('Error fetching templates:', error)
    return { success: false, error: 'Failed to fetch templates' }
  }
}

export const getTemplatePreview = async (
  templateId: string
): Promise<ActionResult<TemplateAccount[]>> => {
  try {
    // Built-in templates
    switch (templateId) {
      case 'standard':
        return { success: true, data: STANDARD_COA_TEMPLATE }
      case 'service-business':
        return { success: true, data: SERVICE_BUSINESS_TEMPLATE }
      case 'agency':
        return { success: true, data: AGENCY_TEMPLATE }
      case 'minimal':
        return { success: true, data: MINIMAL_COA_TEMPLATE }
    }

    // Custom template
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const template = await db.cOATemplate.findUnique({
      where: { id: templateId },
    })

    if (!template) {
      return { success: false, error: 'Template not found' }
    }

    return { success: true, data: template.template as TemplateAccount[] }
  } catch (error) {
    console.error('Error fetching template preview:', error)
    return { success: false, error: 'Failed to fetch template preview' }
  }
}

export const applyTemplate = async (
  templateId: string,
  options?: {
    overwriteExisting?: boolean
    includeSystemAccounts?: boolean
  }
): Promise<ActionResult<{ accountsCreated: number }>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'fi.master_data.accounts.manage')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    // Get template accounts
    const templateResult = await getTemplatePreview(templateId)
    if (!templateResult.success || !templateResult.data) {
      return { success: false, error: templateResult.error ?? 'Template not found' }
    }

    const whereClause = context.subAccountId
      ? { subAccountId: context.subAccountId }
      : { agencyId: context.agencyId, subAccountId: null }

    // Check for existing accounts
    if (!options?.overwriteExisting) {
      const existingCount = await db.chartOfAccount.count({ where: whereClause })
      if (existingCount > 0) {
        return {
          success: false,
          error: 'Accounts already exist. Use overwriteExisting option to replace.',
        }
      }
    }

    // Flatten template hierarchy
    const flattenAccounts = (
      accounts: TemplateAccount[],
      parentId?: string
    ): { account: TemplateAccount; parentCode?: string }[] => {
      const result: { account: TemplateAccount; parentCode?: string }[] = []
      for (const account of accounts) {
        result.push({ account, parentCode: parentId })
        if (account.children) {
          result.push(...flattenAccounts(account.children, account.code))
        }
      }
      return result
    }

    const flatAccounts = flattenAccounts(templateResult.data)
    let accountsCreated = 0

    await db.$transaction(async (tx) => {
      // Delete existing if overwriting
      if (options?.overwriteExisting) {
        await tx.chartOfAccount.deleteMany({ where: whereClause })
      }

      // Create parent accounts first
      const codeToId: Record<string, string> = {}

      for (const { account, parentCode } of flatAccounts) {
        // Skip system accounts if not requested
        if (account.isSystemAccount && !options?.includeSystemAccounts) {
          continue
        }

        const created = await tx.chartOfAccount.create({
          data: {
            code: account.code,
            name: account.name,
            accountType: account.type as AccountType,
            normalBalance: account.normalBalance,
            description: account.description ?? '',
            isSystemAccount: account.isSystemAccount ?? false,
            isActive: true,
            parentAccountId: parentCode ? codeToId[parentCode] : null,
            agencyId: context.agencyId ?? null,
            subAccountId: context.subAccountId ?? null,
            createdBy: context.userId,
          },
        })

        codeToId[account.code] = created.id
        accountsCreated++
      }
    })

    await logGLAudit({
      action: 'CREATE',
      entityType: 'ChartOfAccount',
      entityId: templateId,
      agencyId: context.agencyId,
      subAccountId: context.subAccountId,
      description: `Applied COA template: ${templateId} (${accountsCreated} accounts)`,
    })

    revalidatePath(`/agency/${context.agencyId}/finance/gl/accounts`)

    return { success: true, data: { accountsCreated } }
  } catch (error) {
    console.error('Error applying template:', error)
    return { success: false, error: 'Failed to apply template' }
  }
}

export const saveAsTemplate = async (
  name: string,
  description?: string
): Promise<ActionResult<{ id: string }>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'fi.general_ledger.settings.manage')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    const whereClause = context.subAccountId
      ? { subAccountId: context.subAccountId }
      : { agencyId: context.agencyId, subAccountId: null }

    // Get current accounts
    const accounts = await db.chartOfAccount.findMany({
      where: whereClause,
      select: {
        code: true,
        name: true,
        accountType: true,
        normalBalance: true,
        description: true,
        isSystemAccount: true,
        ParentAccount: { select: { code: true } },
      },
    })

    if (accounts.length === 0) {
      return { success: false, error: 'No accounts to save as template' }
    }

    // Convert to template format
    const templateAccounts = accounts.map((a) => ({
      code: a.code,
      name: a.name,
      type: a.accountType,
      normalBalance: a.normalBalance,
      description: a.description,
      isSystemAccount: a.isSystemAccount,
      parentCode: a.ParentAccount?.code,
    }))

    const template = await db.cOATemplate.create({
      data: {
        name,
        description: description ?? '',
        template: templateAccounts as any,
        industry: 'GENERIC',
      },
    })

    return { success: true, data: { id: template.id } }
  } catch (error) {
    console.error('Error saving template:', error)
    return { success: false, error: 'Failed to save template' }
  }
}

// ========== COA Import/Export ==========

export const exportCOA = async (
  format: 'json' | 'csv'
): Promise<ActionResult<string>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'fi.master_data.accounts.view')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    const whereClause = context.subAccountId
      ? { subAccountId: context.subAccountId }
      : { agencyId: context.agencyId, subAccountId: null }

    const accounts = await db.chartOfAccount.findMany({
      where: whereClause,
      include: { ParentAccount: { select: { code: true } } },
      orderBy: { code: 'asc' },
    })

    if (format === 'csv') {
      const headers = [
        'Account Code',
        'Account Name',
        'Type',
        'Normal Balance',
        'Description',
        'Parent Code',
        'Is System Account',
        'Is Active',
      ]
      const rows = accounts.map((a) =>
        [
          a.code,
          `"${a.name}"`,
          a.accountType,
          a.normalBalance,
          `"${a.description ?? ''}"`,
          a.ParentAccount?.code ?? '',
          a.isSystemAccount ? 'Yes' : 'No',
          a.isActive ? 'Yes' : 'No',
        ].join(',')
      )

      return { success: true, data: [headers.join(','), ...rows].join('\n') }
    }

    // JSON format
    const jsonData = accounts.map((a) => ({
      code: a.code,
      name: a.name,
      type: a.accountType,
      normalBalance: a.normalBalance,
      description: a.description,
      parentCode: a.ParentAccount?.code,
      isSystemAccount: a.isSystemAccount,
      isActive: a.isActive,
    }))

    return { success: true, data: JSON.stringify(jsonData, null, 2) }
  } catch (error) {
    console.error('Error exporting COA:', error)
    return { success: false, error: 'Failed to export COA' }
  }
}

export const importCOA = async (
  data: string,
  format: 'json' | 'csv',
  options?: { overwriteExisting?: boolean }
): Promise<ActionResult<{ imported: number; skipped: number; errors: string[] }>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'fi.master_data.accounts.manage')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    let accounts: {
      code: string
      name: string
      type: string
      normalBalance: string
      description?: string
      parentCode?: string
      isSystemAccount?: boolean
      isActive?: boolean
    }[] = []

    if (format === 'json') {
      try {
        accounts = JSON.parse(data)
      } catch {
        return { success: false, error: 'Invalid JSON format' }
      }
    } else {
      // Parse CSV
      const lines = data.split('\n').filter((l) => l.trim())
      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/\s+/g, ''))

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].match(/(?:^|,)("(?:[^"]*(?:""[^"]*)*)"|[^,]*)/g)
        if (!values) continue

        const row: Record<string, string> = {}
        values.forEach((v, idx) => {
          row[headers[idx]] = v.replace(/^,?"?|"?$/g, '').replace(/""/g, '"')
        })

        accounts.push({
          code: row['accountcode'] ?? row['code'],
          name: row['accountname'] ?? row['name'],
          type: row['type']?.toUpperCase(),
          normalBalance: row['normalbalance']?.toUpperCase(),
          description: row['description'],
          parentCode: row['parentcode'],
          isSystemAccount: row['issystemaccount']?.toLowerCase() === 'yes',
          isActive: row['isactive']?.toLowerCase() !== 'no',
        })
      }
    }

    const whereClause = context.subAccountId
      ? { subAccountId: context.subAccountId }
      : { agencyId: context.agencyId, subAccountId: null }

    let imported = 0
    let skipped = 0
    const errors: string[] = []

    await db.$transaction(async (tx) => {
      // Get existing codes
      const existing = await tx.chartOfAccount.findMany({
        where: whereClause,
        select: { code: true, id: true },
      })
      const existingCodes = new Map(existing.map((e) => [e.code, e.id]))

      // First pass: create/update accounts without parent
      for (const account of accounts) {
        if (!account.code || !account.name || !account.type) {
          errors.push(`Skipped invalid account: ${account.code}`)
          skipped++
          continue
        }

        const existingId = existingCodes.get(account.code)

        if (existingId && !options?.overwriteExisting) {
          skipped++
          continue
        }

        try {
          if (existingId) {
            await tx.chartOfAccount.update({
              where: { id: existingId },
              data: {
                name: account.name,
                accountType: account.type as AccountType,
                normalBalance: account.normalBalance,
                description: account.description ?? '',
                isSystemAccount: account.isSystemAccount ?? false,
                isActive: account.isActive ?? true,
              },
            })
          } else {
            const created = await tx.chartOfAccount.create({
              data: {
                code: account.code,
                name: account.name,
                accountType: account.type as AccountType,
                normalBalance: account.normalBalance,
                description: account.description ?? '',
                isSystemAccount: account.isSystemAccount ?? false,
                isActive: account.isActive ?? true,
                agencyId: context.agencyId ?? null,
                subAccountId: context.subAccountId ?? null,
                createdBy: context.userId,
              },
            })
            existingCodes.set(account.code, created.id)
          }
          imported++
        } catch (err: any) {
          errors.push(`Error importing ${account.code}: ${err.message}`)
        }
      }

      // Second pass: set parent relationships
      for (const account of accounts) {
        if (account.parentCode) {
          const childId = existingCodes.get(account.code)
          const parentId = existingCodes.get(account.parentCode)

          if (childId && parentId) {
            await tx.chartOfAccount.update({
              where: { id: childId },
              data: { parentAccountId: parentId },
            })
          }
        }
      }
    })

    await logGLAudit({
      action: 'CREATE',
      entityType: 'ChartOfAccount',
      entityId: 'import',
      agencyId: context.agencyId,
      subAccountId: context.subAccountId,
      description: `Imported COA: ${imported} accounts`,
    })

    revalidatePath(`/agency/${context.agencyId}/finance/gl/accounts`)

    return { success: true, data: { imported, skipped, errors } }
  } catch (error) {
    console.error('Error importing COA:', error)
    return { success: false, error: 'Failed to import COA' }
  }
}
