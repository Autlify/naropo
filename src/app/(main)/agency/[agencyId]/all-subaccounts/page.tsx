import { AlertDescription } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import Image from 'next/image'
import Link from 'next/link'

import React from 'react'
import DeleteButton from './_components/delete-button'
import CreateSubaccountButton from './_components/create-subaccount-btn'
import { auth } from '@/auth'
import { db } from '@/lib/db'

type Props = {
  params: Promise<{ agencyId: string }>
}

const AllSubaccountsPage = async ({ params }: Props) => {
  const { agencyId } = await params
  const session = await auth()
  const userId = session?.user?.id
  const userName = session?.user?.name ?? ''
  if (!userId) return

  const membership = await db.agencyMembership.findFirst({
    where: { userId, agencyId, isActive: true },
    select: { id: true },
  })
  if (!membership) return <div>No access to this agency</div>

  const subaccounts = await db.subAccount.findMany({
    where: { agencyId },
    select: {
      id: true,
      name: true,
      subAccountLogo: true,
      city: true,
      country: true,
    },
  })

  return (
    <AlertDialog>
      <div className="flex flex-col">
        <CreateSubaccountButton
          user={{ id: userId, name: userName }}
          agencyDetails={{ id: agencyId }}
          id={agencyId}
          className="w-[200px] self-end mb-8"
        />
        <Command className="rounded-lg bg-transparent">
          <CommandInput placeholder="Search Account..." />
          <CommandList>
            <CommandEmpty>No Results Found.</CommandEmpty>
            <CommandGroup heading="Sub Accounts">
              {!!subaccounts.length ? (
                subaccounts.map((subaccount) => (
                  <CommandItem
                    key={subaccount.id}
                    className="h-32 !bg-gradient-to-br from-muted/30 to-transparent my-4 text-primary border border-border/50 p-4 rounded-lg hover:!bg-muted/30 cursor-pointer transition-all"
                  >
                    <Link
                      href={`/subaccount/${subaccount.id}`}
                      className="flex gap-4 w-full h-full"
                    >
                      <div className="relative w-32">
                        <Image
                          src={subaccount.subAccountLogo}
                          alt="subaccount logo"
                          fill
                          className="rounded-md object-contain bg-muted/50 p-4"
                        />
                      </div>
                      <div className="flex flex-col justify-between">
                        <div className="flex flex-col">
                          {subaccount.name}
                          <span className="text-muted-foreground text-xs">
                            {subaccount.city}, {subaccount.country}
                          </span>
                        </div>
                      </div>
                    </Link>
                    <AlertDialogTrigger asChild>
                      <Button
                        size={'sm'}
                        variant={'destructive'}
                        className="w-20 !text-white"
                      >
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-left">
                          Are your absolutely sure
                        </AlertDialogTitle>
                        <AlertDescription className="text-left">
                          This action cannot be undon. This will delete the
                          subaccount and all data related to the subaccount.
                        </AlertDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex items-center">
                        <AlertDialogCancel className="mb-2">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive hover:bg-destructive">
                          <DeleteButton subaccountId={subaccount.id} />
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </CommandItem>
                ))
              ) : (
                <div className="text-muted-foreground text-center p-4">
                  No Sub accounts
                </div>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </div>
    </AlertDialog>
  )
}

export default AllSubaccountsPage
