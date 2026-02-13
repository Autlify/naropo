/**
 * Session Events Hook (SSE)
 * 
 * Listens for real-time session updates via Server-Sent Events.
 * Updates local session memory when permissions/entitlements change.
 * 
 * Events handled:
 * - session:hash_changed - Permission/entitlement hashes changed
 * - session:invalidated - Session was invalidated (force re-login)
 * - quota:threshold - Quota threshold reached
 * 
 * @example
 * ```tsx
 * 'use client'
 * 
 * import { useSessionEvents } from '@/lib/client/events/use-session-events'
 * 
 * function SessionProvider({ children }) {
 *   const { isConnected, lastEvent } = useSessionEvents({
 *     onHashChanged: async (hashes) => {
 *       // Optionally refetch full session if hashes changed
 *       console.log('Session hashes changed:', hashes)
 *     },
 *     onInvalidated: () => {
 *       // Force re-login
 *       window.location.href = '/agency/sign-in'
 *     },
 *   })
 *   
 *   return children
 * }
 * ```
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSessionMemory } from '../stores/session-memory'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface SessionEventData {
  type: 'session:hash_changed' | 'session:invalidated' | 'quota:threshold'
  payload: Record<string, unknown>
  timestamp: number
}

export interface UseSessionEventsOptions {
  /**
   * Enable SSE connection
   * @default true
   */
  enabled?: boolean
  
  /**
   * SSE endpoint URL
   * @default '/api/events/session'
   */
  endpoint?: string
  
  /**
   * Reconnect delay in ms
   * @default 3000
   */
  reconnectDelay?: number
  
  /**
   * Max reconnect attempts
   * @default 5
   */
  maxReconnectAttempts?: number
  
  /**
   * Callback when hashes change
   */
  onHashChanged?: (hashes: { permissionHash: string; entitlementHash: string }) => void
  
  /**
   * Callback when session is invalidated
   */
  onInvalidated?: () => void
  
  /**
   * Callback when quota threshold is reached
   */
  onQuotaThreshold?: (data: { featureKey: string; usagePercent: number }) => void
}

export interface UseSessionEventsReturn {
  /**
   * Whether SSE is connected
   */
  isConnected: boolean
  
  /**
   * Last received event
   */
  lastEvent: SessionEventData | null
  
  /**
   * Connection error
   */
  error: string | null
  
  /**
   * Manually reconnect
   */
  reconnect: () => void
  
  /**
   * Disconnect SSE
   */
  disconnect: () => void
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useSessionEvents(
  options: UseSessionEventsOptions = {}
): UseSessionEventsReturn {
  const {
    enabled = true,
    endpoint = '/api/events/session',
    reconnectDelay = 3000,
    maxReconnectAttempts = 5,
    onHashChanged,
    onInvalidated,
    onQuotaThreshold,
  } = options

  const updateHashes = useSessionMemory((s) => s.updateHashes)
  const clearSession = useSessionMemory((s) => s.clearSession)
  
  const [isConnected, setIsConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState<SessionEventData | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    
    setIsConnected(false)
  }, [])

  const connect = useCallback(() => {
    if (typeof window === 'undefined' || !enabled) return
    
    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }
    
    try {
      const eventSource = new EventSource(endpoint)
      eventSourceRef.current = eventSource
      
      eventSource.onopen = () => {
        setIsConnected(true)
        setError(null)
        reconnectAttemptsRef.current = 0
      }
      
      eventSource.onerror = () => {
        setIsConnected(false)
        
        // Attempt reconnect
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++
          reconnectTimeoutRef.current = setTimeout(connect, reconnectDelay)
        } else {
          setError('Max reconnect attempts reached')
        }
      }
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as SessionEventData
          setLastEvent(data)
          
          switch (data.type) {
            case 'session:hash_changed': {
              const { permissionHash, entitlementHash } = data.payload as {
                permissionHash: string
                entitlementHash: string
              }
              
              const { permissionsChanged, entitlementsChanged } = updateHashes({
                permissionHash,
                entitlementHash,
              })
              
              if (permissionsChanged || entitlementsChanged) {
                onHashChanged?.({ permissionHash, entitlementHash })
              }
              break
            }
            
            case 'session:invalidated': {
              clearSession()
              onInvalidated?.()
              break
            }
            
            case 'quota:threshold': {
              const { featureKey, usagePercent } = data.payload as {
                featureKey: string
                usagePercent: number
              }
              onQuotaThreshold?.({ featureKey, usagePercent })
              break
            }
          }
        } catch (err) {
          console.error('[session-events] Failed to parse event:', err)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect')
    }
  }, [
    enabled,
    endpoint,
    maxReconnectAttempts,
    reconnectDelay,
    updateHashes,
    clearSession,
    onHashChanged,
    onInvalidated,
    onQuotaThreshold,
  ])

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0
    connect()
  }, [connect])

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    if (enabled) {
      connect()
    }
    
    return () => {
      disconnect()
    }
  }, [enabled, connect, disconnect])

  return {
    isConnected,
    lastEvent,
    error,
    reconnect,
    disconnect,
  }
}
