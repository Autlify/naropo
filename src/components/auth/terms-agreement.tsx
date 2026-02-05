'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

interface TermsAgreementProps {
  agreed: boolean
  onChange: (agreed: boolean) => void
  variant?: 'signin' | 'signup'
}

export function TermsAgreement({ agreed, onChange, variant = 'signup' }: TermsAgreementProps) {
  const actionText = variant === 'signin' ? 'continuing' : 'signing up'

  const linkClassName =
    'text-foreground/80 underline underline-offset-2 hover:text-foreground transition-colors'

  const termsContent = (
    <>
      By {actionText}, you agree to our{' '}
      <Link
        href="/legal/terms-of-service"
        target="_blank"
        rel="noopener noreferrer"
        className={linkClassName}
      >
        Terms of Service
      </Link>
      ,{' '}
      <Link
        href="/legal/privacy-policy"
        target="_blank"
        rel="noopener noreferrer"
        className={linkClassName}
      >
        Privacy Policy
      </Link>
      , and{' '}
      <Link
        href="/legal/data-processing-agreement"
        target="_blank"
        rel="noopener noreferrer"
        className={linkClassName}
      >
        Data Processing Agreement
      </Link>
      .
    </>
  )

  if (variant === 'signup') {
    return (
      <div className="flex items-start gap-3">
        <Checkbox
          id="terms"
          checked={agreed}
          onCheckedChange={(checked) => onChange(checked === true)}
          className="mt-0.5 shrink-0"
        />
        <Label
          htmlFor="terms"
          className="text-xs leading-relaxed text-muted-foreground cursor-pointer font-normal"
        >
          {termsContent}
        </Label>
      </div>
    )
  }

  return (
    <p className="text-center text-xs leading-relaxed text-muted-foreground">
      {termsContent}
    </p>
  )
}
