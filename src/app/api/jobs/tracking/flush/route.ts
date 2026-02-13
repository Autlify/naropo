/**
 * Smart Flush Cron Job
 * 
 * POST /api/jobs/tracking/flush
 * 
 * Flushes buffered usage events from SQLite to PostgreSQL.
 * Call this via cron (e.g., every 4 hours) or on-demand.
 * 
 * Vercel/Netlify cron config:
 * ```json
 * {
 *   "crons": [{
 *     "path": "/api/jobs/tracking/flush",
 *     "schedule": "0 *\/4 * * *"
 *   }]
 * }
 * ```
 */

import { NextRequest, NextResponse } from 'next/server'
import { flushToPostgres, checkAndFlushThresholds, trackingBuffer } from '@/lib/core/tracking'

// Secret for cron authentication
const CRON_SECRET = process.env.CRON_SECRET

// ─────────────────────────────────────────────────────────────────────────────
// POST: Execute flush
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Verify cron secret (skip in development)
  if (process.env.NODE_ENV === 'production' && CRON_SECRET) {
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    const { searchParams } = req.nextUrl
    const trigger = searchParams.get('trigger') as 'TIME' | 'MANUAL' | 'STARTUP' | undefined

    // First check if any thresholds need immediate flush
    const thresholdResult = await checkAndFlushThresholds()
    
    // Then do time-based flush
    const timeResult = await flushToPostgres(trigger || 'TIME')

    return NextResponse.json({
      success: true,
      thresholdFlush: thresholdResult,
      timeFlush: timeResult,
    })
  } catch (error) {
    console.error('[flush-job] Error flushing:', error)
    return NextResponse.json(
      { error: 'Failed to flush' },
      { status: 500 }
    )
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET: Get buffer stats
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  // Verify cron secret in production
  if (process.env.NODE_ENV === 'production' && CRON_SECRET) {
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    const stats = trackingBuffer.getStats()
    const needingFlush = trackingBuffer.getFeaturesNeedingFlush()

    return NextResponse.json({
      stats,
      featuresNeedingFlush: needingFlush,
    })
  } catch (error) {
    console.error('[flush-job] Error getting stats:', error)
    return NextResponse.json(
      { error: 'Failed to get stats' },
      { status: 500 }
    )
  }
}
