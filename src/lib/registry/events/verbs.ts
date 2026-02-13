/**
 * @abstraction Event Verb Registry
 * @description
 * Event verbs (past tense) are intentionally NOT the same as permission/actions (present tense).
 * This file exists to avoid brittle inflection hacks like `action + 'ed' | 'd' | 'red'`.
 */

/** Past-tense event verbs used across EVENT_KEYS */
export const EVENT_VERBS = [
  'created',
  'updated',
  'deleted',
  'archived',
  'restored',
  'drafted',
  'submitted',
  'approved',
  'rejected',
  'posted',
  'reversed',
  'voided',
  'imported',
  'generated',
  'exported',
  'scheduled',
  'started',
  'completed',
  'failed',
  'processed',
  'received',
  'sent',
  'billed',
  'matched',
  'unmatched',
  'cleared',
  'locked',
  'unlocked',
  'reopened',
  'initiated',
  'executed',
  'skipped',
  'revalued',
  'connected',
  'disconnected',
  'parsed',
  'validated',
  'categorized',
  'issued',
  'adjusted',
] as const

export type EventVerb = (typeof EVENT_VERBS)[number]

/** Present-tense command verbs that may be useful in code (e.g. CRUD, workflows) */
export const COMMAND_VERBS = [
  'create',
  'update',
  'delete',
  'archive',
  'restore',
  'draft',
  'submit',
  'approve',
  'reject',
  'post',
  'reverse',
  'void',
  'import',
  'generate',
  'export',
  'schedule',
  'start',
  'complete',
  'fail',
  'process',
  'receive',
  'send',
  'bill',
  'match',
  'unmatch',
  'clear',
  'lock',
  'unlock',
  'reopen',
  'initiate',
  'execute',
  'skip',
  'revalue',
  'connect',
  'disconnect',
  'parse',
  'validate',
  'categorize',
  'issue',
  'adjust',
] as const

export type CommandVerb = (typeof COMMAND_VERBS)[number]

/**
 * Explicit mapping between command verbs and event verbs.
 * Keep this list explicit instead of using string inflection.
 */
export const COMMAND_TO_EVENT_VERB: Record<CommandVerb, EventVerb> = {
  create: 'created',
  update: 'updated',
  delete: 'deleted',
  archive: 'archived',
  restore: 'restored',
  draft: 'drafted',
  submit: 'submitted',
  approve: 'approved',
  reject: 'rejected',
  post: 'posted',
  reverse: 'reversed',
  void: 'voided',
  import: 'imported',
  generate: 'generated',
  export: 'exported',
  schedule: 'scheduled',
  start: 'started',
  complete: 'completed',
  fail: 'failed',
  process: 'processed',
  receive: 'received',
  send: 'sent',
  bill: 'billed',
  match: 'matched',
  unmatch: 'unmatched',
  clear: 'cleared',
  lock: 'locked',
  unlock: 'unlocked',
  reopen: 'reopened',
  initiate: 'initiated',
  execute: 'executed',
  skip: 'skipped',
  revalue: 'revalued',
  connect: 'connected',
  disconnect: 'disconnected',
  parse: 'parsed',
  validate: 'validated',
  categorize: 'categorized',
  issue: 'issued',
  adjust: 'adjusted',
}

export function toEventVerb(command: CommandVerb): EventVerb {
  return COMMAND_TO_EVENT_VERB[command]
}
