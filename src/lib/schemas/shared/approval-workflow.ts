import { z } from 'zod';

/**
 * Approval Status Enum
 * Status of an approval request or step
 */
export const approvalStatusEnum = z.enum([
  'PENDING',          // Awaiting approval
  'APPROVED',         // Approved
  'REJECTED',         // Rejected
  'ESCALATED',        // Escalated to next level
  'RECALLED',         // Recalled by submitter
  'EXPIRED',          // Approval window expired
  'SKIPPED',          // Skipped (auto-approved)
  'DELEGATED',        // Delegated to another approver
]);

export type ApprovalStatus = z.infer<typeof approvalStatusEnum>;

/**
 * Approval Action Enum
 * Actions that can be taken on approval requests
 */
export const approvalActionEnum = z.enum([
  'SUBMIT',           // Submit for approval
  'APPROVE',          // Approve the request
  'REJECT',           // Reject the request
  'ESCALATE',         // Escalate to next level
  'RECALL',           // Recall submission
  'DELEGATE',         // Delegate to another user
  'REQUEST_INFO',     // Request more information
  'COMMENT',          // Add comment without action
]);

export type ApprovalAction = z.infer<typeof approvalActionEnum>;

/**
 * Approval Rule Type Enum
 * How approval requirements are evaluated
 */
export const approvalRuleTypeEnum = z.enum([
  'ANY',              // Any one approver from the list
  'ALL',              // All approvers must approve
  'SEQUENTIAL',       // Approvers in sequence
  'THRESHOLD',        // Based on amount thresholds
  'MATRIX',           // Based on approval matrix rules
]);

export type ApprovalRuleType = z.infer<typeof approvalRuleTypeEnum>;

/**
 * Approval Trigger Enum
 * What triggers the approval workflow
 */
export const approvalTriggerEnum = z.enum([
  'ON_SUBMIT',        // When document is submitted
  'ON_AMOUNT',        // When amount exceeds threshold
  'ON_CREATE',        // On document creation
  'ON_UPDATE',        // On document update
  'ON_STATUS_CHANGE', // On status change
  'ON_PAYMENT',       // Before payment execution
  'MANUAL',           // Manually triggered
]);

export type ApprovalTrigger = z.infer<typeof approvalTriggerEnum>;

/**
 * Approver Type Enum
 * Type of approver assignment
 */
export const approverTypeEnum = z.enum([
  'USER',             // Specific user
  'ROLE',             // Anyone with role
  'MANAGER',          // Document owner's manager
  'DEPARTMENT_HEAD',  // Department head
  'COST_CENTER_OWNER', // Cost center owner
  'PROJECT_MANAGER',  // Project manager
  'DYNAMIC',          // Dynamically determined
]);

export type ApproverType = z.infer<typeof approverTypeEnum>;

/**
 * Escalation Action Enum
 * What happens when approval times out
 */
export const escalationActionEnum = z.enum([
  'ESCALATE',         // Escalate to next level
  'AUTO_APPROVE',     // Auto-approve after timeout
  'AUTO_REJECT',      // Auto-reject after timeout
  'NOTIFY',           // Send reminder notification
  'NONE',             // Take no action
]);

export type EscalationAction = z.infer<typeof escalationActionEnum>;

/**
 * Approval Workflow Definition Schema
 * Defines an approval workflow template
 */
export const approvalWorkflowSchema = z.object({
  id: z.string().uuid(),
  agencyId: z.string().uuid(),
  subAccountId: z.string().uuid().optional(),

  // Identification
  code: z.string().max(50),
  name: z.string().max(100),
  description: z.string().max(500).optional(),

  // Scope
  documentType: z.string().max(50), // INVOICE, PAYMENT, JOURNAL_ENTRY, etc.
  trigger: approvalTriggerEnum.default('ON_SUBMIT'),

  // Rules
  ruleType: approvalRuleTypeEnum.default('SEQUENTIAL'),
  isActive: z.boolean().default(true),
  priority: z.number().int().min(0).default(0), // For rule ordering

  // Thresholds (for THRESHOLD type)
  minAmount: z.number().min(0).optional(),
  maxAmount: z.number().optional(),
  currencyCode: z.string().length(3).optional(),

  // Settings
  allowRecall: z.boolean().default(true),
  allowDelegation: z.boolean().default(false),
  requireCommentOnReject: z.boolean().default(true),
  notifyOnApproval: z.boolean().default(true),
  notifyOnRejection: z.boolean().default(true),

  // Metadata
  createdAt: z.coerce.date().optional(),
  createdBy: z.string().uuid().optional(),
  updatedAt: z.coerce.date().optional(),
  updatedBy: z.string().uuid().optional(),
});

export type ApprovalWorkflow = z.infer<typeof approvalWorkflowSchema>;

/**
 * Approval Step Definition Schema
 * Defines a step within an approval workflow
 */
export const approvalStepSchema = z.object({
  id: z.string().uuid(),
  workflowId: z.string().uuid(),

  // Sequence
  stepOrder: z.number().int().min(1),
  name: z.string().max(100),
  description: z.string().max(255).optional(),

  // Approver configuration
  approverType: approverTypeEnum.default('USER'),
  approverUserIds: z.array(z.string().uuid()).optional(), // For USER type
  approverRoleIds: z.array(z.string().uuid()).optional(), // For ROLE type
  dynamicApproverField: z.string().max(100).optional(), // For DYNAMIC type

  // Approval requirements
  requiredApprovals: z.number().int().min(1).default(1), // For ALL type
  canSkip: z.boolean().default(false),
  skipCondition: z.string().max(500).optional(), // JSON/expression

  // Escalation
  escalationHours: z.number().int().min(1).optional(), // Hours before escalation
  escalationAction: escalationActionEnum.default('NOTIFY'),
  escalationRecipientIds: z.array(z.string().uuid()).optional(),

  // Active
  isActive: z.boolean().default(true),
});

export type ApprovalStep = z.infer<typeof approvalStepSchema>;

/**
 * Approval Request Schema
 * An actual approval request instance
 */
export const approvalRequestSchema = z.object({
  id: z.string().uuid(),
  agencyId: z.string().uuid(),
  subAccountId: z.string().uuid().optional(),

  // Workflow reference
  workflowId: z.string().uuid(),
  currentStepId: z.string().uuid().optional(),

  // Document reference
  documentType: z.string().max(50),
  documentId: z.string().uuid(),
  documentNumber: z.string().max(100).optional(),
  documentAmount: z.number().optional(),
  documentCurrency: z.string().length(3).optional(),

  // Status
  status: approvalStatusEnum.default('PENDING'),
  currentStepOrder: z.number().int().min(1).default(1),
  totalSteps: z.number().int().min(1).default(1),

  // Submitter
  submittedBy: z.string().uuid(),
  submittedAt: z.coerce.date(),
  submitterNotes: z.string().max(500).optional(),

  // Completion
  completedAt: z.coerce.date().optional(),
  completedBy: z.string().uuid().optional(),
  finalStatus: approvalStatusEnum.optional(),

  // Delegation
  delegatedTo: z.string().uuid().optional(),
  delegatedBy: z.string().uuid().optional(),
  delegatedAt: z.coerce.date().optional(),
  delegationReason: z.string().max(255).optional(),

  // Deadlines
  dueDate: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional(),

  // Metadata
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export type ApprovalRequest = z.infer<typeof approvalRequestSchema>;

/**
 * Approval History Schema
 * Records each approval action
 */
export const approvalHistorySchema = z.object({
  id: z.string().uuid(),
  requestId: z.string().uuid(),
  stepId: z.string().uuid().optional(),

  // Action details
  action: approvalActionEnum,
  previousStatus: approvalStatusEnum,
  newStatus: approvalStatusEnum,

  // Actor
  actorId: z.string().uuid(),
  actorName: z.string().max(100).optional(),
  actorRole: z.string().max(100).optional(),

  // Comments
  comments: z.string().max(1000).optional(),
  internalNotes: z.string().max(500).optional(),

  // Delegation
  delegatedToId: z.string().uuid().optional(),
  delegatedToName: z.string().max(100).optional(),

  // Timestamp
  actionAt: z.coerce.date(),

  // IP/Device info (for audit)
  ipAddress: z.string().max(45).optional(),
  userAgent: z.string().max(255).optional(),
});

export type ApprovalHistory = z.infer<typeof approvalHistorySchema>;

/**
 * Submit for Approval Action Schema
 */
export const submitForApprovalSchema = z.object({
  documentType: z.string().max(50),
  documentId: z.string().uuid(),
  documentNumber: z.string().max(100).optional(),
  documentAmount: z.number().optional(),
  documentCurrency: z.string().length(3).optional(),
  notes: z.string().max(500).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  dueDate: z.coerce.date().optional(),
});

export type SubmitForApproval = z.infer<typeof submitForApprovalSchema>;

/**
 * Approve Action Schema
 */
export const approveActionSchema = z.object({
  requestId: z.string().uuid(),
  comments: z.string().max(1000).optional(),
  conditions: z.string().max(500).optional(), // Conditional approval
});

export type ApproveAction = z.infer<typeof approveActionSchema>;

/**
 * Reject Action Schema
 */
export const rejectActionSchema = z.object({
  requestId: z.string().uuid(),
  reason: z.string().min(1).max(1000), // Required reason
  suggestedChanges: z.string().max(1000).optional(),
});

export type RejectAction = z.infer<typeof rejectActionSchema>;

/**
 * Delegate Action Schema
 */
export const delegateActionSchema = z.object({
  requestId: z.string().uuid(),
  delegateToUserId: z.string().uuid(),
  reason: z.string().max(500).optional(),
  expiresAt: z.coerce.date().optional(),
});

export type DelegateAction = z.infer<typeof delegateActionSchema>;

/**
 * Recall Action Schema
 */
export const recallActionSchema = z.object({
  requestId: z.string().uuid(),
  reason: z.string().max(500).optional(),
});

export type RecallAction = z.infer<typeof recallActionSchema>;

/**
 * Escalate Action Schema
 */
export const escalateActionSchema = z.object({
  requestId: z.string().uuid(),
  escalateToUserIds: z.array(z.string().uuid()).optional(),
  reason: z.string().max(500),
  urgencyLevel: z.enum(['NORMAL', 'HIGH', 'CRITICAL']).default('HIGH'),
});

export type EscalateAction = z.infer<typeof escalateActionSchema>;

/**
 * Approval Request Filter Schema
 */
export const approvalRequestFilterSchema = z.object({
  agencyId: z.string().uuid(),
  subAccountId: z.string().uuid().optional(),
  workflowId: z.string().uuid().optional(),
  documentType: z.string().max(50).optional(),
  status: approvalStatusEnum.optional(),
  submittedBy: z.string().uuid().optional(),
  pendingForUserId: z.string().uuid().optional(), // Requests pending for specific user
  submittedDateFrom: z.coerce.date().optional(),
  submittedDateTo: z.coerce.date().optional(),
  isOverdue: z.boolean().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

export type ApprovalRequestFilter = z.infer<typeof approvalRequestFilterSchema>;

/**
 * Create Approval Workflow Schema
 */
export const createApprovalWorkflowSchema = approvalWorkflowSchema.omit({
  id: true,
  createdAt: true,
  createdBy: true,
  updatedAt: true,
  updatedBy: true,
});

export type CreateApprovalWorkflow = z.infer<typeof createApprovalWorkflowSchema>;

/**
 * Update Approval Workflow Schema
 */
export const updateApprovalWorkflowSchema = createApprovalWorkflowSchema.partial().extend({
  id: z.string().uuid(),
});

export type UpdateApprovalWorkflow = z.infer<typeof updateApprovalWorkflowSchema>;

/**
 * Create Approval Step Schema
 */
export const createApprovalStepSchema = approvalStepSchema.omit({ id: true });

export type CreateApprovalStep = z.infer<typeof createApprovalStepSchema>;

/**
 * Update Approval Step Schema
 */
export const updateApprovalStepSchema = createApprovalStepSchema.partial().extend({
  id: z.string().uuid(),
});

export type UpdateApprovalStep = z.infer<typeof updateApprovalStepSchema>;

/**
 * Approval Summary Schema
 * Summary for dashboard widgets
 */
export const approvalSummarySchema = z.object({
  pendingCount: z.number().int().min(0),
  approvedToday: z.number().int().min(0),
  rejectedToday: z.number().int().min(0),
  overdueCount: z.number().int().min(0),
  avgApprovalTimeHours: z.number().min(0).optional(),
  pendingByDocumentType: z.record(z.string(), z.number().int().min(0)).optional(),
});

export type ApprovalSummary = z.infer<typeof approvalSummarySchema>;
