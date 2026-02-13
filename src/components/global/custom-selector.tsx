'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui-2/dialog'
import GlassSurface from '@/components/ui/glass-surface'

export type RuleOp = 'and' | 'or' | null

export type ValidationRule<TCtx> = {
  id: string
  title: string
  description?: string
  andOr?: RuleOp
  check: (args: { value: string; ctx: TCtx }) => boolean
}

export type SelectorOption<TCtx> = {
  label: string
  value: string
  description?: string
  disabled?: boolean
  rules?: Array<ValidationRule<TCtx>>
}

type Props<TCtx> = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  subheading?: string
  ctx: TCtx
  options: Array<SelectorOption<TCtx>>

  value: string | null
  onChange: (value: string) => void

  confirmLabel?: string
  cancelLabel?: string
  onConfirm: (value: string) => void
  className?: string
}

function evaluateRules <TCtx>(
  rules: Array<ValidationRule<TCtx>> | undefined,
  value: string,
  ctx: TCtx
) {
  if (!rules?.length) return { ok: true, results: [] as Array<{ rule: ValidationRule<TCtx>; ok: boolean }> }

  let acc: boolean | null = null
  const results = rules.map((rule, idx) => {
    const ok = !!rule.check({ value, ctx })
    const op: RuleOp = idx === 0 ? null : (rule.andOr ?? 'and')

    if (acc === null) acc = ok
    else acc = op === 'or' ? (acc || ok) : (acc && ok)

    return { rule, ok }
  })

  return { ok: !!acc, results }
}

export function SelectorPromptDialog<TCtx>({
  open,
  onOpenChange,
  title,
  subheading,
  ctx,
  options,
  value,
  onChange,
  confirmLabel = 'Continue',
  cancelLabel = 'Cancel',
  onConfirm,
  className,
}: Props<TCtx>) {
  const selected = options.find((o) => o.value === value) ?? null
  const selectedEval = selected && value
    ? evaluateRules(selected.rules, value, ctx)
    : { ok: false, results: [] as Array<{ rule: ValidationRule<TCtx>; ok: boolean }> }

  const canConfirm =
    !!selected &&
    !!value &&
    !selected.disabled &&
    selectedEval.ok

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'max-w-[820px] overflow-hidden rounded-2xl border border-border/60 bg-background/70 p-0 shadow-2xl',
          className
        )}
      >
        {/* premium-ish glass overlay */}
        <GlassSurface className="pointer-events-none absolute inset-0 opacity-60" />

        <div className="relative grid grid-cols-1 gap-0 md:grid-cols-[320px_1fr]">
          <div className="border-b border-border/60 p-6 md:border-b-0 md:border-r">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold tracking-tight">{title}</DialogTitle>
              {subheading ? (
                <DialogDescription className="mt-1 text-sm leading-relaxed">
                  {subheading}
                </DialogDescription>
              ) : null}
            </DialogHeader>

            <div className="mt-5 space-y-2">
              {options.map((opt) => {
                const isSelected = opt.value === value
                const evalRes = evaluateRules(opt.rules, opt.value, ctx)
                const disabled = !!opt.disabled || !evalRes.ok

                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChange(opt.value)}
                    disabled={opt.disabled}
                    className={cn(
                      'w-full rounded-xl border px-4 py-3 text-left transition',
                      'bg-background/40 hover:bg-accent/40',
                      isSelected && 'border-primary/50 bg-primary/10',
                      opt.disabled && 'cursor-not-allowed opacity-50'
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium">{opt.label}</div>
                        {opt.description ? (
                          <div className="mt-0.5 text-xs text-muted-foreground">{opt.description}</div>
                        ) : null}
                      </div>

                      {/* status pill */}
                      <div
                        className={cn(
                          'rounded-full px-2 py-1 text-[11px] font-medium',
                          disabled ? 'bg-destructive/10 text-destructive' : 'bg-emerald-500/10 text-emerald-600'
                        )}
                      >
                        {disabled ? 'Blocked' : 'OK'}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="p-6">
            <div className="text-sm font-semibold tracking-tight">Details</div>
            <div className="mt-1 text-sm text-muted-foreground">
              {selected ? (
                <>
                  <div className="font-medium text-foreground">{selected.label}</div>
                  {selected.description ? <div className="mt-1">{selected.description}</div> : null}
                </>
              ) : (
                'Select an option to continue.'
              )}
            </div>

            {selected?.rules?.length ? (
              <div className="mt-5 rounded-xl border border-border/60 bg-background/40 p-4">
                <div className="text-xs font-semibold text-muted-foreground">Validation</div>
                <div className="mt-3 space-y-2">
                  {selectedEval.results.map(({ rule, ok }) => (
                    <div key={rule.id} className="flex items-start gap-3">
                      <div
                        className={cn(
                          'mt-0.5 h-5 w-5 shrink-0 rounded-full border text-center text-[12px] leading-5',
                          ok ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600' : 'border-destructive/40 bg-destructive/10 text-destructive'
                        )}
                      >
                        {ok ? '✓' : '!'}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{rule.title}</div>
                        {rule.description ? (
                          <div className="mt-0.5 text-xs text-muted-foreground">{rule.description}</div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <DialogFooter className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-border/70 bg-background/50 px-3 py-2 text-sm hover:bg-accent/40"
                onClick={() => onOpenChange(false)}
              >
                {cancelLabel}
              </button>

              <button
                type="button"
                className={cn(
                  'rounded-lg px-3 py-2 text-sm font-medium',
                  canConfirm
                    ? 'bg-primary text-primary-foreground hover:opacity-90'
                    : 'cursor-not-allowed bg-muted text-muted-foreground'
                )}
                disabled={!canConfirm}
                onClick={() => value && onConfirm(value)}
              >
                {confirmLabel}
              </button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
