import React from 'react'

import { db } from '@/lib/db'
import { stripe } from '@/lib/stripe'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { InvoiceActions } from './_components/invoice-actions'

type Props = { params: Promise<{ agencyId: string }> }

export default async function InvoicesPage({ params }: Props) {
  const { agencyId } = await params

  const agency = await db.agency.findUnique({ where: { id: agencyId }, select: { customerId: true } })
  const customerId = agency?.customerId ?? null

  const invoices = customerId
    ? await stripe.invoices.list({ customer: customerId, limit: 25 })
    : { data: [] }

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Invoices</h2>
              {customerId ? (
                <Badge variant="secondary" className="font-mono text-xs">{customerId}</Badge>
              ) : (
                <Badge variant="outline" className="text-xs">No customer</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Stripe invoices for this agency customer.
            </p>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Number</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4 text-right">Amount</th>
                <th className="py-2 pr-4">Period</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {invoices.data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-muted-foreground">
                    No invoices found.
                  </td>
                </tr>
              ) : (
                invoices.data.map((inv) => (
                  <tr key={inv.id}>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {inv.created ? new Date(inv.created * 1000).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs">{inv.number ?? '—'}</td>
                    <td className="py-3 pr-4">
                      <Badge variant={inv.status === 'paid' ? 'default' : 'secondary'}>{inv.status ?? '—'}</Badge>
                    </td>
                    <td className="py-3 pr-4 text-right font-medium">
                      {(inv.amount_paid ?? inv.amount_due ?? 0) / 100} {inv.currency?.toUpperCase()}
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {inv.period_start && inv.period_end
                        ? `${new Date(inv.period_start * 1000).toLocaleDateString()} → ${new Date(inv.period_end * 1000).toLocaleDateString()}`
                        : '—'}
                    </td>
                    <td className="py-3">
                      <InvoiceActions
                        invoiceNumber={inv.number ?? null}
                        hostedInvoiceUrl={inv.hosted_invoice_url ?? null}
                        invoicePdf={inv.invoice_pdf ?? null}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
