'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSessionMemory } from '../stores/session-memory'

export interface PermissionVersionSyncScope {
  scope: 'AGENCY' | 'SUBACCOUNT'
  agencyId: string
  subAccountId?: string | null
}

export interface UsePermissionVersionSyncOptions {
  enabled?: boolean
  intervalMs?: number
  autoRefresh?: boolean
  scope?: PermissionVersionSyncScope
  onChanged?: (data: { permissionHash: string; permissionVersion: number; scopeKey: string }) => void
}

export interface UsePermissionVersionSyncReturn {
  isChecking: boolean
  lastCheckedAt: number | null
  error: string | null
  checkNow: () => Promise<void>
}

export function usePermissionVersionSync(
  options: UsePermissionVersionSyncOptions = {}
): UsePermissionVersionSyncReturn {
  const {
    enabled = true,
    intervalMs = 120_000,
    autoRefresh = true,
    scope,
    onChanged,
  } = options

  const router = useRouter()
  const sessionContext = useSessionMemory((s) => s.context)
  const localPermissionHash = useSessionMemory((s) => s.permissionHash)
  const context = useMemo(() => {
    if (scope) {
      return {
        scope: scope.scope,
        agencyId: scope.agencyId,
        subAccountId: scope.subAccountId ?? null,
      }
    }
    return sessionContext
  }, [scope?.scope, scope?.agencyId, scope?.subAccountId, sessionContext])

  const [isChecking, setIsChecking] = useState(false)
  const [lastCheckedAt, setLastCheckedAt] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const etagRef = useRef<string | null>(null)
  const lastHandledChangeRef = useRef<string | null>(null)

  const checkNow = useCallback(async () => {
    if (!enabled || !context) return

    setIsChecking(true)
    try {
      const params = new URLSearchParams()
      if (context.scope === 'AGENCY') {
        params.set('agencyId', context.agencyId)
      } else if (context.subAccountId) {
        params.set('subAccountId', context.subAccountId)
      } else {
        params.set('agencyId', context.agencyId)
      }

      const headers: Record<string, string> = {}
      if (etagRef.current) headers['If-None-Match'] = etagRef.current

      const res = await fetch(`/api/features/core/iam/permissions/version?${params.toString()}`, {
        method: 'GET',
        headers,
        cache: 'no-store',
      })

      const nextEtag = res.headers.get('etag')
      if (nextEtag) etagRef.current = nextEtag

      if (res.status === 304) {
        setError(null)
        setLastCheckedAt(Date.now())
        return
      }

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        setError(body?.message ?? `Permission version check failed (${res.status})`)
        setLastCheckedAt(Date.now())
        return
      }

      const data = await res.json()
      const permissionHash = data?.permissionHash as string | undefined
      const permissionVersion = data?.permissionVersion as number | undefined
      const scopeKey = data?.scopeKey as string | undefined
      const changedFlag = !!data?.changed

      if (!permissionHash || typeof permissionVersion !== 'number' || !scopeKey) {
        setError('Permission version response missing required fields')
        setLastCheckedAt(Date.now())
        return
      }

      const changedByHash = !!localPermissionHash && localPermissionHash !== permissionHash
      const changed = changedFlag || changedByHash

      if (changed) {
        const changeKey = `${scopeKey}:${permissionVersion}:${permissionHash}`
        if (lastHandledChangeRef.current !== changeKey) {
          lastHandledChangeRef.current = changeKey
          onChanged?.({ permissionHash, permissionVersion, scopeKey })
          if (autoRefresh) router.refresh()
        }
      }

      setError(null)
      setLastCheckedAt(Date.now())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Permission version check failed')
      setLastCheckedAt(Date.now())
    } finally {
      setIsChecking(false)
    }
  }, [autoRefresh, context, enabled, localPermissionHash, onChanged, router])

  useEffect(() => {
    if (!enabled || !context) return

    void checkNow()
    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
      void checkNow()
    }, intervalMs)

    return () => clearInterval(timer)
  }, [checkNow, context, enabled, intervalMs])

  return {
    isChecking,
    lastCheckedAt,
    error,
    checkNow,
  }
}
