import CircleProgress from '@/components/global/circle-progress'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { db } from '@/lib/db'
import { stripe } from '@/lib/stripe'
import { AreaChart } from '@tremor/react'
import {
  ClipboardIcon,
  Contact2,
  DollarSign,
  Goal,
  ShoppingCart,
} from 'lucide-react'
import Link from 'next/link'
import React from 'react'

const Page = async ({
  params,
}: {
  params: Promise<{ agencyId: string }>
  searchParams: Promise<{ code: string }>
}) => {
  const { agencyId } = await params
  
  let currency = 'USD'
  let sessions
  let totalClosedSessions
  let totalPendingSessions
  let net = 0
  let potentialIncome = 0
  let closingRate = 0
  const currentYear = new Date().getFullYear()
  const startDate = new Date(`${currentYear}-01-01T00:00:00Z`).getTime() / 1000
  const endDate = new Date(`${currentYear}-12-31T23:59:59Z`).getTime() / 1000

  const agencyDetails = await db.agency.findUnique({
    where: {
      id: agencyId,
    },
  })

  if (!agencyDetails) return

  const subaccounts = await db.subAccount.findMany({
    where: {
      agencyId: agencyId,
    },
  })

  let connectAccountId = agencyDetails.connectAccountId
  let connectAccountInvalid = false

  if (connectAccountId) {
    try {
      const response = await stripe.accounts.retrieve({
        stripeAccount: connectAccountId,
      })

      currency = response.default_currency?.toUpperCase() || 'USD'
      const checkoutSessions = await stripe.checkout.sessions.list(
        {
          created: { gte: startDate, lte: endDate },
          limit: 100,
        },
        { stripeAccount: connectAccountId }
      )
      sessions = checkoutSessions.data
      totalClosedSessions = checkoutSessions.data
        .filter((session) => session.status === 'complete')
        .map((session) => ({
          ...session,
          created: new Date(session.created).toLocaleDateString(),
          amount_total: session.amount_total ? session.amount_total / 100 : 0,
        }))

      totalPendingSessions = checkoutSessions.data
        .filter((session) => session.status === 'open')
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

      // Common cases:
      // - account_invalid (wrong platform key / access revoked)
      // - oauth invalid_grant / deauthorized flows
      if (code === 'account_invalid' || status === 403) {
        connectAccountInvalid = true
        connectAccountId = ''
        // Best-effort: clear saved connectAccountId so UI will prompt reconnect
        try {
          await db.agency.update({
            where: { id: agencyDetails.id },
            data: { connectAccountId: '' },
          })
        } catch {
          // ignore
        }
      }
    }
  }

  return (
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
                href={`/agency/${agencyDetails.id}/launchpad`}
                className="p-2 w-fit bg-secondary text-white rounded-md flex items-center gap-2"
              >
                <ClipboardIcon />
                Launch Pad
              </Link>
            </CardHeader>
          </Card>
        </div>
      )}
      <h1 className="text-4xl font-bold">Dashboard</h1>
      <Separator className=" my-6" />
      <div className="flex flex-col gap-4 pb-6">
        <div className="flex gap-4 flex-col xl:!flex-row">
          <Card className="flex-1 relative bg-gradient-to-br from-muted/50 to-muted/20 border-border/50">
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
          <Card className="flex-1 relative bg-gradient-to-br from-muted/50 to-muted/20 border-border/50">
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
            <DollarSign className="absolute right-4 top-4 text-muted-foreground" />
          </Card>
          <Card className="flex-1 relative bg-gradient-to-br from-muted/50 to-muted/20 border-border/50">
            <CardHeader>
              <CardDescription>Active Clients</CardDescription>
              <CardTitle className="text-4xl">{subaccounts.length}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Reflects the number of sub accounts you own and manage.
            </CardContent>
            <Contact2 className="absolute right-4 top-4 text-muted-foreground" />
          </Card>
          <Card className="flex-1 relative bg-gradient-to-br from-muted/50 to-muted/20 border-border/50">
            <CardHeader>
              <CardTitle>Agency Goal</CardTitle>
              <CardDescription className="mt-2">
                Reflects the number of sub accounts you want to own and
                manage.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <div className="flex flex-col w-full">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">
                    Current: {subaccounts.length}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    Goal: {agencyDetails.goal}
                  </span>
                </div>
                <Progress
                  value={(subaccounts.length / agencyDetails.goal) * 100}
                />
              </div>
            </CardFooter>
            <Goal className="absolute right-4 top-4 text-muted-foreground" />
          </Card>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 flex-grow">
          <Card className="col-span-3 bg-gradient-to-br from-muted/20 to-transparent border-border/50">
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <AreaChart
              className="text-sm stroke-primary"
              data={[
                ...(totalClosedSessions || []),
                ...(totalPendingSessions || []),
              ]}
              index="created"
              categories={['amount_total']}
              colors={['primary']}
              yAxisWidth={30}
              showAnimation={true}
            /> 
          </Card>
          <Card className="col-span-1 flex flex-col bg-gradient-to-br from-muted/30 to-transparent border-border/50">
            <CardHeader>
              <CardTitle>Conversions</CardTitle>
            </CardHeader>
            <CardContent>
              <CircleProgress
                value={closingRate}
                description={
                  <>
                    {sessions && (
                      <div className="flex flex-col">
                        Abandoned
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Page
