import { ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { Button } from './ui/button'

interface UnauthorizedProps {
  message?: string
  showBackButton?: boolean
}

export default function Unauthorized({ 
  message = "You don't have permission to access this resource.",
  showBackButton = true 
}: UnauthorizedProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-6">
            <ShieldAlert className="h-16 w-16 text-destructive" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Access Denied</h1>
          <p className="text-muted-foreground text-lg">
            {message}
          </p>
        </div>

        {/* Additional Info */}
        <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
          <p>
            If you believe this is an error, please contact your agency administrator
            or our support team for assistance.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {showBackButton && (
            <Button variant="outline" asChild>
              <Link href="/">Go to Home</Link>
            </Button>
          )}
          <Button asChild>
            <Link href="/site/pricing">View Pricing</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
