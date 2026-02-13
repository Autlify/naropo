'use client'
import React, { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import Stripe from 'stripe'
import Image from 'next/image'
import { ImageIcon } from 'lucide-react'
import {
  saveActivityLogsNotification,
  updateFunnelProducts,
} from '@/lib/queries'
import { Funnel } from '@/generated/prisma/client'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface FunnelProductsTableProps {
  defaultData: Funnel
  products: Stripe.Product[]
}

const FunnelProductsTable: React.FC<FunnelProductsTableProps> = ({
  products,
  defaultData,
}) => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [liveProducts, setLiveProducts] = useState<
    { priceId: string; recurring: boolean }[]
  >(() => {
    try {
      const raw = JSON.parse(defaultData?.liveProducts || '[]') as any[]
      return (Array.isArray(raw) ? raw : []).map((p) => ({
        priceId: (p?.priceId ?? p?.productId) as string,
        recurring: !!p?.recurring,
      }))
    } catch {
      return []
    }
  })

  const handleSaveProducts = async () => {
    setIsLoading(true)
    const response = await updateFunnelProducts(
      JSON.stringify(liveProducts),
      defaultData.id
    )
    await saveActivityLogsNotification({
      agencyId: undefined,
      description: `Update funnel products | ${response.name}`,
      subaccountId: defaultData.subAccountId,
    })
    setIsLoading(false)
    router.refresh()
  }

  const handleAddProduct = async (product: Stripe.Product) => {
    const defaultPrice = product.default_price as Stripe.Price | null
    const priceId = defaultPrice?.id
    if (!priceId) return

    const exists = liveProducts.find((p) => p.priceId === priceId)
    exists
      ? setLiveProducts(liveProducts.filter((p) => p.priceId !== priceId))
      : setLiveProducts([...liveProducts, { priceId, recurring: !!defaultPrice.recurring }])
  }
  return (
    <>
      <Table className="bg-card border-[1px] border rounded-md">
        <TableHeader className="rounded-md">
          <TableRow>
            <TableHead>Live</TableHead>
            <TableHead>Image</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Interval</TableHead>
            <TableHead className="text-right">Price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="font-medium truncate">
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell>
                <Input
                  defaultChecked={
                    !!liveProducts.find(
                      (prod) => prod.priceId === (product.default_price as any)?.id
                    )
                  }
                  onChange={() => handleAddProduct(product)}
                  type="checkbox"
                  className="w-4 h-4"
                />
              </TableCell>
              <TableCell>
                {product.images?.[0] ? (
                  <Image
                    alt="Product image"
                    height={60}
                    width={60}
                    src={product.images[0]}
                    className="rounded-md border bg-muted/20 object-cover"
                  />
                ) : (
                  <div className="flex h-[60px] w-[60px] items-center justify-center rounded-md border bg-muted/20">
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
              </TableCell>
              <TableCell>{product.name}</TableCell>
              <TableCell>
                {(product.default_price as Stripe.Price | null)?.recurring ? 'Recurring' : 'One Time'}
              </TableCell>
              <TableCell className="text-right">
                ${((product.default_price as Stripe.Price | null)?.unit_amount ?? 0) / 100}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Button
        disabled={isLoading}
        onClick={handleSaveProducts}
        className="mt-4"
      >
        Save Products
      </Button>
    </>
  )
}

export default FunnelProductsTable
