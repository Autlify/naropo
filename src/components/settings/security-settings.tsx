'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Fingerprint,
  Plus,
  Trash2,
  Smartphone,
  Laptop,
  Key,
  Shield,
  Loader2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  LogOut,
  Monitor,
  UserX,
  Download,
  Ban,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { startRegistration } from '@simplewebauthn/browser'
import type { PublicKeyCredentialCreationOptionsJSON } from '@simplewebauthn/types'

// ============================================================================
// TYPES
// ============================================================================

interface Passkey {
  id: string
  name: string
  deviceName: string | null
  authenticatorType: string | null
  createdAt: string
  lastUsedAt: string | null
}

interface DeletionCheck {
  canDelete: boolean
  isPrimaryAdmin: boolean
  ownedAgencies: Array<{ id: string; name: string }>
  memberships: number
  hasActiveSubscription: boolean
}

interface SecuritySettingsProps {
  userId: string
  userEmail?: string
  className?: string
}

// ============================================================================
// HELPERS
// ============================================================================

function getDeviceIcon(authenticatorType: string | null) {
  switch (authenticatorType) {
    case 'platform':
      return <Laptop className="h-5 w-5" />
    case 'cross-platform':
      return <Key className="h-5 w-5" />
    default:
      return <Smartphone className="h-5 w-5" />
  }
}

function formatDate(dateString: string | null) {
  if (!dateString) return 'Never'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatRelativeTime(dateString: string | null) {
  if (!dateString) return 'Never used'
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  return formatDate(dateString)
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SecuritySettings({ userId, userEmail, className }: SecuritySettingsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  // State
  const [passkeys, setPasskeys] = useState<Passkey[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Add passkey dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [passkeyName, setPasskeyName] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  
  // Delete passkey
  const [deletingId, setDeletingId] = useState<string | null>(null)
  
  // Account deletion
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletionCheck, setDeletionCheck] = useState<DeletionCheck | null>(null)
  const [isCheckingDeletion, setIsCheckingDeletion] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  // ============================================================================
  // FETCH PASSKEYS
  // ============================================================================
  
  useEffect(() => {
    fetchPasskeys()
  }, [userId])
  
  async function fetchPasskeys() {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/auth/passkey/list?userId=${userId}`)
      if (!response.ok) throw new Error('Failed to fetch passkeys')
      const data = await response.json()
      setPasskeys(data.passkeys || [])
    } catch (err) {
      setError('Failed to load passkeys')
    } finally {
      setIsLoading(false)
    }
  }

  // ============================================================================
  // ADD PASSKEY
  // ============================================================================
  
  async function handleAddPasskey() {
    if (!passkeyName.trim()) {
      setError('Please enter a name for your passkey')
      return
    }

    setIsAdding(true)
    setError('')

    try {
      // 1. Get registration options
      const optionsRes = await fetch('/api/auth/passkey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'register',
          email: userId, // We use userId to fetch user by ID
          userName: passkeyName,
        }),
      })

      if (!optionsRes.ok) {
        const data = await optionsRes.json()
        throw new Error(data.error || 'Failed to start passkey registration')
      }

      const { options, token } = await optionsRes.json()

      // 2. Create credential using WebAuthn
      const credential = await startRegistration(options)

      // 3. Confirm registration
      const confirmRes = await fetch('/api/auth/passkey/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'register',
          token,
          credential,
          passkeyName: passkeyName.trim(),
        }),
      })

      if (!confirmRes.ok) {
        const data = await confirmRes.json()
        throw new Error(data.error || 'Failed to register passkey')
      }

      setSuccess('Passkey added successfully!')
      setAddDialogOpen(false)
      setPasskeyName('')
      fetchPasskeys()
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setError('Passkey registration was cancelled')
      } else {
        setError(err.message || 'Failed to add passkey')
      }
    } finally {
      setIsAdding(false)
    }
  }

  // ============================================================================
  // DELETE PASSKEY
  // ============================================================================
  
  async function handleDeletePasskey(passkeyId: string) {
    setDeletingId(passkeyId)
    setError('')

    try {
      const response = await fetch(`/api/auth/passkey/${passkeyId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete passkey')
      }

      setSuccess('Passkey removed successfully!')
      fetchPasskeys()
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to delete passkey')
    } finally {
      setDeletingId(null)
    }
  }

  // ============================================================================
  // SIGN OUT
  // ============================================================================
  
  async function handleSignOut() {
    await signOut({ callbackUrl: '/agency/sign-in' })
  }

  // ============================================================================
  // ACCOUNT DELETION
  // ============================================================================
  
  async function checkDeletionEligibility() {
    setIsCheckingDeletion(true)
    setError('')
    
    try {
      const response = await fetch('/api/user')
      if (!response.ok) throw new Error('Failed to check deletion eligibility')
      const data = await response.json()
      setDeletionCheck(data.deletion)
    } catch (err: any) {
      setError(err.message || 'Failed to check deletion eligibility')
    } finally {
      setIsCheckingDeletion(false)
    }
  }
  
  async function handleDeleteAccount() {
    if (deleteConfirmText !== 'DELETE') return
    
    setIsDeleting(true)
    setError('')
    
    try {
      const response = await fetch('/api/user', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmText: deleteConfirmText }),
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete account')
      }
      
      // Sign out and redirect
      await signOut({ callbackUrl: '/agency/sign-in?deleted=true' })
    } catch (err: any) {
      setError(err.message || 'Failed to delete account')
      setIsDeleting(false)
    }
  }
  
  function handleOpenDeleteDialog() {
    setDeleteDialogOpen(true)
    setDeleteConfirmText('')
    checkDeletionEligibility()
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Security</CardTitle>
              <CardDescription>Manage your passkeys and security settings</CardDescription>
            </div>
          </div>
          
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Passkey
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a new passkey</DialogTitle>
                <DialogDescription>
                  Give your passkey a name to help you identify it later
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Label htmlFor="passkey-name">Passkey name</Label>
                <Input
                  id="passkey-name"
                  placeholder="e.g., MacBook Pro, iPhone 15"
                  value={passkeyName}
                  onChange={(e) => setPasskeyName(e.target.value)}
                  className="mt-2"
                  disabled={isAdding}
                />
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setAddDialogOpen(false)}
                  disabled={isAdding}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddPasskey} disabled={isAdding || !passkeyName.trim()}>
                  {isAdding ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <Fingerprint className="h-4 w-4 mr-2" />
                      Add Passkey
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Alerts */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="border-success/30 bg-success/10">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <AlertDescription className="text-success-foreground">{success}</AlertDescription>
          </Alert>
        )}

        {/* Passkeys Section */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Fingerprint className="h-4 w-4" />
            Passkeys
            <Badge variant="secondary" className="ml-auto">
              {passkeys.length} registered
            </Badge>
          </h4>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : passkeys.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Fingerprint className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No passkeys registered</p>
              <p className="text-sm">Add a passkey for passwordless sign-in</p>
            </div>
          ) : (
            <div className="space-y-2">
              {passkeys.map((passkey) => (
                <div
                  key={passkey.id}
                  className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-muted">
                    {getDeviceIcon(passkey.authenticatorType)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{passkey.name}</span>
                      {passkey.authenticatorType === 'platform' && (
                        <Badge variant="outline" className="text-xs">Built-in</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Added {formatDate(passkey.createdAt)}
                      </span>
                      <span>•</span>
                      <span>Last used {formatRelativeTime(passkey.lastUsedAt)}</span>
                    </div>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        disabled={deletingId === passkey.id}
                      >
                        {deletingId === passkey.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove passkey?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove &quot;{passkey.name}&quot; from your account. 
                          You won&apos;t be able to use it to sign in anymore.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeletePasskey(passkey.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Remove Passkey
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4 rounded-lg bg-muted/50 border">
          <h5 className="font-medium text-sm mb-1">What are passkeys?</h5>
          <p className="text-sm text-muted-foreground">
            Passkeys are a secure alternative to passwords. They use your device&apos;s 
            biometrics (Face ID, Touch ID) or security key for passwordless sign-in.
          </p>
        </div>

        <Separator />

        {/* Session Management */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Current Session
          </h4>
          
          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="font-medium text-sm">Active session</p>
                  <p className="text-xs text-muted-foreground">
                    Signed in as {userEmail || 'this account'}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        <Separator />

        {/* Danger Zone - Account Deletion */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            Danger Zone
          </h4>
          
          <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Delete Account</p>
                <p className="text-xs text-muted-foreground">
                  Permanently delete your account and all associated data
                </p>
              </div>
              
              <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={handleOpenDeleteDialog}
                  >
                    <UserX className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                      <AlertTriangle className="h-5 w-5" />
                      Delete Your Account
                    </DialogTitle>
                    <DialogDescription>
                      This action is permanent and cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    {isCheckingDeletion ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : deletionCheck ? (
                      <>
                        {!deletionCheck.canDelete ? (
                          <Alert variant="destructive">
                            <Ban className="h-4 w-4" />
                            <AlertDescription>
                              <strong>Cannot delete account:</strong>
                              {deletionCheck.isPrimaryAdmin && (
                                <p className="mt-1">
                                  You are the primary admin of {deletionCheck.ownedAgencies.length} 
                                  {deletionCheck.ownedAgencies.length === 1 ? ' agency' : ' agencies'}. 
                                  You must transfer ownership before deleting your account.
                                </p>
                              )}
                            </AlertDescription>
                          </Alert>
                        ) : (
                          <>
                            <Alert>
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription className="space-y-2">
                                <p><strong>The following will be deleted:</strong></p>
                                <ul className="list-disc list-inside text-sm space-y-1">
                                  <li>Your account and profile data</li>
                                  <li>{passkeys.length} registered passkey(s)</li>
                                  <li>{deletionCheck.memberships} agency membership(s)</li>
                                  {deletionCheck.hasActiveSubscription && (
                                    <li className="text-destructive">Your active subscription will be cancelled</li>
                                  )}
                                </ul>
                              </AlertDescription>
                            </Alert>
                            
                            <div className="space-y-2">
                              <Label htmlFor="delete-confirm" className="text-sm">
                                Type <strong>DELETE</strong> to confirm
                              </Label>
                              <Input
                                id="delete-confirm"
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                                placeholder="DELETE"
                                className="font-mono"
                                disabled={isDeleting}
                              />
                            </div>
                          </>
                        )}
                      </>
                    ) : null}
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setDeleteDialogOpen(false)}
                      disabled={isDeleting}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      disabled={
                        !deletionCheck?.canDelete || 
                        deleteConfirmText !== 'DELETE' || 
                        isDeleting
                      }
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Permanently
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
