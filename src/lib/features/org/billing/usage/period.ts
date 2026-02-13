import type { UsagePeriod } from '@/generated/prisma/client'

export type UsageWindow = { periodStart: Date; periodEnd: Date }

function startOfDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

function addDays(d: Date, days: number): Date {
  const out = new Date(d)
  out.setUTCDate(out.getUTCDate() + days)
  return out
}

export function getUsageWindow(period: UsagePeriod, now: Date = new Date()): UsageWindow {
  const n = new Date(now)
  switch (period) {
    case 'DAILY': {
      const periodStart = startOfDay(n)
      const periodEnd = addDays(periodStart, 1)
      return { periodStart, periodEnd }
    }
    case 'WEEKLY': {
      // Monday-based week in UTC
      const day = n.getUTCDay() // 0=Sun..6=Sat
      const mondayOffset = (day + 6) % 7
      const periodStart = addDays(startOfDay(n), -mondayOffset)
      const periodEnd = addDays(periodStart, 7)
      return { periodStart, periodEnd }
    }
    case 'YEARLY': {
      const periodStart = new Date(Date.UTC(n.getUTCFullYear(), 0, 1))
      const periodEnd = new Date(Date.UTC(n.getUTCFullYear() + 1, 0, 1))
      return { periodStart, periodEnd }
    }
    case 'MONTHLY':
    default: {
      const periodStart = new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), 1))
      const periodEnd = new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth() + 1, 1))
      return { periodStart, periodEnd }
    }
  }
}

/**
 * Returns a usage window for the selected period, shifted back by `periodsBack`.
 * Example: periodsBack=1 => previous period, periodsBack=2 => two periods ago.
 */
export function getUsageWindowWithOffset(
  period: UsagePeriod,
  periodsBack: number,
  now: Date = new Date()
): UsageWindow {
  const back = Math.max(0, Math.floor(Number(periodsBack) || 0))
  if (back === 0) return getUsageWindow(period, now)

  // Compute the current window and then shift deterministically in UTC.
  const cur = getUsageWindow(period, now)

  switch (period) {
    case 'DAILY': {
      const periodStart = addDays(cur.periodStart, -back)
      const periodEnd = addDays(cur.periodEnd, -back)
      return { periodStart, periodEnd }
    }
    case 'WEEKLY': {
      const shiftDays = back * 7
      const periodStart = addDays(cur.periodStart, -shiftDays)
      const periodEnd = addDays(cur.periodEnd, -shiftDays)
      return { periodStart, periodEnd }
    }
    case 'YEARLY': {
      const start = new Date(Date.UTC(cur.periodStart.getUTCFullYear() - back, 0, 1))
      const end = new Date(Date.UTC(cur.periodEnd.getUTCFullYear() - back, 0, 1))
      return { periodStart: start, periodEnd: end }
    }
    case 'MONTHLY':
    default: {
      const y = cur.periodStart.getUTCFullYear()
      const m = cur.periodStart.getUTCMonth()
      const periodStart = new Date(Date.UTC(y, m - back, 1))
      const periodEnd = new Date(Date.UTC(y, m - back + 1, 1))
      return { periodStart, periodEnd }
    }
  }
}
