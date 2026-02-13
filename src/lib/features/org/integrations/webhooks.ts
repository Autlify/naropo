export type WebhookEventGroup = {
  group: string
  events: { key: string; label: string; description?: string }[]
}

// MVP event catalog aligned with current modules (CRM + Billing).
export const WEBHOOK_EVENT_GROUPS: WebhookEventGroup[] = [
  {
    group: 'CRM',
    events: [
      { key: 'member.created', label: 'Member Created' },
      { key: 'member.updated', label: 'Member Updated' },
      { key: 'contact.created', label: 'Contact Created' },
      { key: 'contact.updated', label: 'Contact Updated' },
      { key: 'pipeline.deal.created', label: 'Deal Created' },
      { key: 'pipeline.deal.stage_changed', label: 'Deal Stage Changed' },
      { key: 'pipeline.deal.won', label: 'Deal Won' },
      { key: 'pipeline.deal.lost', label: 'Deal Lost' },
    ],
  },
  {
    group: 'Billing',
    events: [
      { key: 'billing.subscription.updated', label: 'Subscription Updated' },
      { key: 'billing.invoice.paid', label: 'Invoice Paid' },
      { key: 'billing.payment_failed', label: 'Payment Failed' },
      { key: 'usage.threshold_reached', label: 'Usage Threshold Reached' },
    ],
  },
]

export const ALL_WEBHOOK_EVENTS = WEBHOOK_EVENT_GROUPS.flatMap((g) => g.events.map((e) => e.key))
