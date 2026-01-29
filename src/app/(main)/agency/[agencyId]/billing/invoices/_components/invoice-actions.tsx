'use client'

import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, ExternalLink, Share2, FileSpreadsheet, MoreHorizontal, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface InvoiceActionsProps {
    invoiceNumber: string | null
    hostedInvoiceUrl: string | null
    invoicePdf: string | null
}

export function InvoiceActions({ invoiceNumber, hostedInvoiceUrl, invoicePdf }: InvoiceActionsProps) {
    const [copied, setCopied] = useState(false)

    const handleShare = async () => {
        if (!hostedInvoiceUrl) return

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Invoice ${invoiceNumber ?? ''}`,
                    url: hostedInvoiceUrl,
                })
                toast.success('Invoice shared successfully')
            } catch {
                // User cancelled or share failed
            }
        } else {
            // Fallback to clipboard
            await navigator.clipboard.writeText(hostedInvoiceUrl)
            setCopied(true)
            toast.success('Invoice link copied to clipboard')
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const handlePostToGL = () => {
        toast.info('Post to GL feature coming soon', {
            description: 'This will create accounting entries for the invoice.',
        })
    }

    if (!hostedInvoiceUrl && !invoicePdf) {
        return <span className="text-muted-foreground">—</span>
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                {hostedInvoiceUrl && (
                    <DropdownMenuItem asChild>
                        <a
                            href={hostedInvoiceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2"
                        >
                            <ExternalLink className="h-4 w-4" />
                            View Invoice
                        </a>
                    </DropdownMenuItem>
                )}
                {invoicePdf && (
                    <DropdownMenuItem asChild>
                        <a
                            href={invoicePdf}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2"
                        >
                            <Download className="h-4 w-4" />
                            Download PDF
                        </a>
                    </DropdownMenuItem>
                )}
                {hostedInvoiceUrl && (
                    <DropdownMenuItem onClick={handleShare} className="flex items-center gap-2">
                        {copied ? (
                            <>
                                <Check className="h-4 w-4 text-green-500" />
                                Copied!
                            </>
                        ) : (
                            <>
                                <Share2 className="h-4 w-4" />
                                Share
                            </>
                        )}
                    </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={handlePostToGL}
                    className="flex items-center gap-2 text-muted-foreground"
                >
                    <FileSpreadsheet className="h-4 w-4" />
                    Post to GL
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
