import BlurPage from '@/components/global/blur-page'
import CircleProgress from '@/components/global/circle-progress'
import PipelineValue from '@/components/global/pipeline-value'
import SubaccountFunnelChart from '@/components/global/subaccount-funnel-chart'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { db } from '@/lib/db'
import { stripe } from '@/lib/stripe'
import { AreaChart, BadgeDelta } from '@tremor/react'
import { ClipboardIcon, Contact2, DollarSign, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

type Props = {
  params: Promise<{ subaccountId: string }>
  searchParams: Promise<{
    code: string
  }>
}

const SubaccountPageId = async ({ params, searchParams }: Props) => {
  const { subaccountId } = await params
  const { code } = await searchParams
  
  let currency = 'USD'
  let sessions
  let totalClosedSessions
  let totalPendingSessions
  let net = 0
  let potentialIncome = 0
  let closingRate = 0

  const subaccountDetails = await db.subAccount.findUnique({
    where: {
      id: subaccountId,
    },
  })

  const currentYear = new Date().getFullYear()
  const startDate = new Date(`${currentYear}-01-01T00:00:00Z`).getTime() / 1000
  const endDate = new Date(`${currentYear}-12-31T23:59:59Z`).getTime() / 1000

  if (!subaccountDetails) return

  let connectAccountId = subaccountDetails.connectAccountId
  let connectAccountInvalid = false

  if (connectAccountId) {
    try {
      const response = await stripe.accounts.retrieve({
        stripeAccount: connectAccountId,
      })
      currency = response.default_currency?.toUpperCase() || 'USD'
      const checkoutSessions = await stripe.checkout.sessions.list(
        { created: { gte: startDate, lte: endDate }, limit: 100 },
        {
          stripeAccount: connectAccountId,
        }
      )
      sessions = checkoutSessions.data.map((session) => ({
        ...session,
        created: new Date(session.created).toLocaleDateString(),
        amount_total: session.amount_total ? session.amount_total / 100 : 0,
      }))

      totalClosedSessions = checkoutSessions.data
        .filter((session) => session.status === 'complete')
        .map((session) => ({
          ...session,
          created: new Date(session.created).toLocaleDateString(),
          amount_total: session.amount_total ? session.amount_total / 100 : 0,
        }))

      totalPendingSessions = checkoutSessions.data
        .filter(
          (session) => session.status === 'open' || session.status === 'expired'
        )
        .map((session) => ({
          ...session,
          created: new Date(session.created).toLocaleDateString(),
          amount_total: session.amount_total ? session.amount_total / 100 : 0,
        }))

      net = +totalClosedSessions
        .reduce((total, session) => total + (session.amount_total || 0), 0)
        .toFixed(2)

      potentialIncome = +totalPendingSessions
        .reduce((total, session) => total + (session.amount_total || 0), 0)
        .toFixed(2)

      const totalSessions = checkoutSessions.data.length
      closingRate = totalSessions > 0
        ? +(((totalClosedSessions.length / totalSessions) * 100).toFixed(2))
        : 0
    } catch (error) {
      // Connected account no longer accessible - handle deauth / wrong key gracefully
      const code = (error as any)?.code
      const status = (error as any)?.statusCode
      console.error('Failed to fetch Stripe Connect account data:', error)

      if (code === 'account_invalid' || status === 403) {
        connectAccountInvalid = true
        connectAccountId = ''
        // Best-effort: clear saved connectAccountId so UI will prompt reconnect
        try {
          await db.subAccount.update({
            where: { id: subaccountDetails.id },
            data: { connectAccountId: '' },
          })
        } catch {
          // ignore
        }
      }
    }
  }

  const funnels = await db.funnel.findMany({
    where: {
      subAccountId: subaccountId,
    },
    include: {
      FunnelPages: true,
    },
  })

  const funnelPerformanceMetrics = funnels.map((funnel) => ({
    ...funnel,
    totalFunnelVisits: funnel.FunnelPages.reduce(
      (total, page) => total + page.visits,
      0
    ),
  }))

  return (
    <BlurPage>
      <div className="relative h-full">
        {(!connectAccountId || connectAccountInvalid) && (
          <div className="absolute -top-10 -left-10 right-0 bottom-0 z-30 flex items-center justify-center backdrop-blur-md bg-background/50">
            <Card>
              <CardHeader>
                <CardTitle>Connect Your Stripe</CardTitle>
                <CardDescription>
                  {connectAccountInvalid
                    ? 'Your Stripe connection is no longer valid (access revoked or wrong key). Please reconnect to continue.'
                    : 'You need to connect your Stripe account to see metrics.'}
                </CardDescription>
                <Link
                  href={`/subaccount/${subaccountDetails.id}/launchpad`}
                  className="p-2 w-fit bg-secondary text-white rounded-md flex items-center gap-2"
                >
                  <ClipboardIcon />
                  Launch Pad
                </Link>
              </CardHeader>
            </Card>
          </div>
        )}
        <div className="flex flex-col gap-4 pb-6">
          {/* Row 1: 4 evenly-sized cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-stretch auto-rows-fr">
            <Card className="relative h-full bg-gradient-to-br from-muted/50 to-muted/20 border-border/50">
              <CardHeader>
                <CardDescription>Income</CardDescription>
                <CardTitle className="text-4xl">
                  {net ? `${currency} ${net.toFixed(2)}` : `$0.00`}
                </CardTitle>
                <small className="text-xs text-muted-foreground">
                  For the year {currentYear}
                </small>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Total revenue generated as reflected in your stripe dashboard.
              </CardContent>
              <DollarSign className="absolute right-4 top-4 text-muted-foreground" />
            </Card>
            <Card className="relative h-full bg-gradient-to-br from-muted/50 to-muted/20 border-border/50">
              <CardHeader>
                <CardDescription>Potential Income</CardDescription>
                <CardTitle className="text-4xl">
                  {potentialIncome
                    ? `${currency} ${potentialIncome.toFixed(2)}`
                    : `$0.00`}
                </CardTitle>
                <small className="text-xs text-muted-foreground">
                  For the year {currentYear}
                </small>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                This is how much you can close.
              </CardContent>
              <Contact2 className="absolute right-4 top-4 text-muted-foreground" />
            </Card>
            <PipelineValue subaccountId={subaccountId} className="h-full" />

            <Card className="h-full bg-gradient-to-br from-muted/50 to-muted/20 border-border/50">
              <CardHeader>
                <CardDescription>Conversions</CardDescription>
                <CircleProgress
                  value={closingRate}
                  description={
                    <>
                      {sessions && (
                        <div className="flex flex-col">
                          Total Carts Opened
                          <div className="flex gap-2">
                            <ShoppingCart className="text-rose-700" />
                            {sessions.length}
                          </div>
                        </div>
                      )}
                      {totalClosedSessions && (
                        <div className="flex flex-col">
                          Won Carts
                          <div className="flex gap-2">
                            <ShoppingCart className="text-emerald-700" />
                            {totalClosedSessions.length}
                          </div>
                        </div>
                      )}
                    </>
                  }
                />
              </CardHeader>
            </Card>
          </div>

          {/* Row 2: 1/3 split */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 flex-grow items-stretch">
            <Card className="col-span-1 flex flex-col h-full bg-gradient-to-br from-muted/30 to-transparent border-border/50">
              <CardHeader>
                <CardDescription>Funnel Performance</CardDescription>
              </CardHeader>
              <CardContent className=" text-sm text-muted-foreground flex flex-col gap-12 justify-between ">
                <SubaccountFunnelChart data={funnelPerformanceMetrics} />
                <div className="flex flex-col">
                  Total page visits across all funnels. Hover over to get more
                  details on funnel page performance.
                </div>
              </CardContent>
              <Contact2 className="absolute right-4 top-4 text-muted-foreground" />
            </Card>

            
            <Card className="col-span-3 h-full bg-gradient-to-br from-muted/20 to-transparent border-border/50">
              <CardHeader>
                <CardTitle>Checkout Activity</CardTitle>
              </CardHeader>
              <AreaChart
                className="text-sm stroke-primary"
                data={sessions || []}
                index="created"
                categories={['amount_total']}
                colors={['primary']}
                yAxisWidth={30}
                showAnimation={true}
              />
            </Card>
          </div>
          
          <div className="grid grid-cols-1 gap-4 flex-grow">
            <Card className="p-4 flex-1 h-[450px] overflow-scroll relative bg-gradient-to-br from-muted/20 to-transparent border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Transition History
                  <BadgeDelta
                    className="rounded-xl bg-transparent"
                    deltaType="moderateIncrease"
                    isIncreasePositive={true}
                    size="xs"
                  >
                    +12.3%
                  </BadgeDelta>
                </CardTitle>
                <Table>
                  <TableHeader className="!sticky !top-0">
                    <TableRow>
                      <TableHead className="w-[300px]">Email</TableHead>
                      <TableHead className="w-[200px]">Status</TableHead>
                      <TableHead>Created Date</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="font-medium truncate">
                    {totalClosedSessions && totalClosedSessions.length > 0 ? (
                      totalClosedSessions.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell>
                            {session.customer_details?.email || '-'}
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-success text-success-foreground">
                              Paid
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(session.created).toUTCString()}
                          </TableCell>

                          <TableCell className="text-right">
                            <small>{currency}</small>{' '}
                            <span className="text-emerald-500">
                              {session.amount_total}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center text-muted-foreground"
                        >
                          No Data
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    </BlurPage>
  )
}

export default SubaccountPageId
