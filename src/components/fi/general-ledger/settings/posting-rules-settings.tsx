'use client'

/**
 * Posting Rules Table Component
 * Displays and manages posting rules with category filtering
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Copy, 
  Play,
  ArrowRightLeft,
  Scale,
  RefreshCw,
  Percent,
  PiggyBank,
  Zap,
  Wrench,
  GripVertical,
} from 'lucide-react'
import { updatePostingRule, deletePostingRule } from '@/lib/features/fi/general-ledger/actions/posting-rules'
import type { PostingRuleCategory } from '@/lib/schemas/fi/general-ledger/posting-rules'
import type { PostingRule, PostingRulesTableProps } from '@/types/finance'


interface Account {
  id: string
  code: string
  name: string
} 

const CATEGORY_ICONS: Record<PostingRuleCategory, React.ReactNode> = {
  FOREX: <ArrowRightLeft className="h-3.5 w-3.5" />,
  ROUNDING: <Scale className="h-3.5 w-3.5" />,
  DISCREPANCY: <RefreshCw className="h-3.5 w-3.5" />,
  TAX: <Percent className="h-3.5 w-3.5" />,
  CLEARING: <PiggyBank className="h-3.5 w-3.5" />,
  ALLOCATION: <Zap className="h-3.5 w-3.5" />,
  CUSTOM: <Wrench className="h-3.5 w-3.5" />,
}

const CATEGORY_COLORS: Record<PostingRuleCategory, string> = {
  FOREX: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  ROUNDING: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  DISCREPANCY: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  TAX: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  CLEARING: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  ALLOCATION: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300',
  CUSTOM: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
}

const PostingRulesSettings = ({ 
  rules, 
  accounts, 
  canEdit, 
  agencyId 
}: PostingRulesTableProps) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleToggleActive = async (rule: PostingRule) => {
    if (!canEdit) return

    startTransition(async () => {
      const result = await updatePostingRule({
        id: rule.id,
        isActive: !rule.isActive,
      })

      if (result.success) {
        toast.success(`Rule ${rule.isActive ? 'disabled' : 'enabled'}`)
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to update rule')
      }
    })
  }

  const handleToggleAutoPost = async (rule: PostingRule) => {
    if (!canEdit) return

    startTransition(async () => {
      const result = await updatePostingRule({
        id: rule.id,
        autoPost: !rule.autoPost,
      })

      if (result.success) {
        toast.success(`Auto-post ${rule.autoPost ? 'disabled' : 'enabled'}`)
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to update rule')
      }
    })
  }

  const handleDelete = async () => {
    if (!deleteId || !canEdit) return

    startTransition(async () => {
      const result = await deletePostingRule(deleteId)

      if (result.success) {
        toast.success('Rule deleted')
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to delete rule')
      }
      setDeleteId(null)
    })
  }

  const getAccountDisplay = (accountId: string, account?: { code: string; name: string }) => {
    if (account) {
      return `${account.code} - ${account.name}`
    }
    const found = accounts.find(a => a?.id === accountId)
    return found ? `${found.code} - ${found.name}` : accountId
  }

  if (rules.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No posting rules configured yet.</p>
        {canEdit && (
          <p className="text-sm mt-2">
            Create a new rule or use a template to get started.
          </p>
        )}
      </div>
    )
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">#</TableHead>
            <TableHead>Rule</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Debit Account</TableHead>
            <TableHead>Credit Account</TableHead>
            <TableHead className="text-center">Active</TableHead>
            <TableHead className="text-center">Auto-Post</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rules.map((rule, index) => (
            <TableRow key={rule.id} className={isPending ? 'opacity-50' : ''}>
              <TableCell className="font-mono text-muted-foreground">
                {rule.priority}
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{rule.name}</div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {rule.code}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge 
                  variant="secondary" 
                  className={`flex items-center gap-1 w-fit ${CATEGORY_COLORS[rule.category]}`}
                >
                  {CATEGORY_ICONS[rule.category]}
                  {rule.category}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="text-sm">{rule.sourceModule}</span>
              </TableCell>
              <TableCell>
                <span className="text-sm font-mono">
                  {getAccountDisplay(rule.debitAccountId, rule.DebitAccount)}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-sm font-mono">
                  {getAccountDisplay(rule.creditAccountId, rule.CreditAccount)}
                </span>
              </TableCell>
              <TableCell className="text-center">
                <Switch
                  checked={rule.isActive}
                  onCheckedChange={() => handleToggleActive(rule)}
                  disabled={!canEdit || isPending}
                />
              </TableCell>
              <TableCell className="text-center">
                <Switch
                  checked={rule.autoPost}
                  onCheckedChange={() => handleToggleAutoPost(rule)}
                  disabled={!canEdit || isPending}
                />
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={isPending}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={() => router.push(
                        `/agency/${agencyId}/fi/general-ledger/settings/posting-rules/${rule.id}`
                      )}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => router.push(
                        `/agency/${agencyId}/fi/general-ledger/settings/posting-rules/new?clone=${rule.id}`
                      )}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Play className="mr-2 h-4 w-4" />
                      Test Rule
                    </DropdownMenuItem>
                    {canEdit && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteId(rule.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Posting Rule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this posting rule? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export { PostingRulesSettings }