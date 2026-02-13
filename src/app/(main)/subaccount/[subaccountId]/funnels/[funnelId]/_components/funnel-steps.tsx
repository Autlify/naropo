'use client'
import CreateFunnelPage from '@/components/forms/funnel-page'
import CustomModal from '@/components/global/custom-modal'
import { TemplatePickerModal } from '@/components/global/template-picker-modal'
import { AlertDialog } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from '@/components/ui/use-toast'
import { upsertFunnelPage, saveActivityLogsNotification } from '@/lib/queries'
import { getTemplateElements, getBlankPageElements, StarterKit, getTemplateById } from '@/lib/features/crm/funnels/templates'
import { FunnelsForSubAccount } from '@/lib/types'
import { useModal } from '@/providers/modal-provider'
import { FunnelPage } from '@/generated/prisma/client'
import { Check, ExternalLink, LucideEdit } from 'lucide-react'
import React, { useState } from 'react'
import { v4 } from 'uuid'

import {
  DragDropContext,
  DragStart,
  DropResult,
  Droppable,
} from 'react-beautiful-dnd'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import FunnelPagePlaceholder from '@/components/icons/funnel-page-placeholder'

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import FunnelStepCard from './funnel-step-card'

type Props = {
  funnel: FunnelsForSubAccount
  subaccountId: string
  pages: FunnelPage[]
  funnelId: string
}

const FunnelSteps = ({ funnel, funnelId, pages, subaccountId }: Props) => {
  const [clickedPage, setClickedPage] = useState<FunnelPage | undefined>(
    pages[0]
  )
  const { setOpen } = useModal()
  const router = useRouter()
  const [pagesState, setPagesState] = useState(pages)
  const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  
  const handleCreateBlankPage = () => {
    setOpen(
      <CustomModal
        title="Create a Funnel Page"
        subheading="Funnel Pages allow you to create step by step processes for customers to follow"
      >
        <CreateFunnelPage
          subaccountId={subaccountId}
          funnelId={funnelId}
          order={pagesState.length}
        />
      </CustomModal>
    )
  }

  const handleCreateFromTemplate = async (templateId: string) => {
    setIsCreating(true)
    try {
      const elements = getTemplateElements(templateId)
      if (!elements) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Template not found',
        })
        return
      }

      const template = getTemplateById(templateId)
      const pageName = template?.name || 'New Page'
      const pageId = v4()
      
      const response = await upsertFunnelPage(
        subaccountId,
        {
          id: pageId,
          name: pageName,
          pathName: pagesState.length === 0 ? '' : pageName.toLowerCase().replace(/\s+/g, '-'),
          order: pagesState.length,
          content: JSON.stringify(elements),
        },
        funnelId
      )

      if (response) {
        await saveActivityLogsNotification({
          agencyId: undefined,
          description: `Created a funnel page from template | ${pageName}`,
          subaccountId: subaccountId,
        })

        setPagesState([...pagesState, response])
        setClickedPage(response)
        router.refresh()
        
        toast({
          title: 'Success',
          description: 'Funnel page created from template',
        })
      }
    } catch (error) {
      console.error(error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create page from template',
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleCreateFromStarterKit = async (kit: StarterKit) => {
    setIsCreating(true)
    try {
      const newPages: FunnelPage[] = []
      
      for (let i = 0; i < kit.pages.length; i++) {
        const pageConfig = kit.pages[i]
        const elements = getTemplateElements(pageConfig.templateId)
        
        if (!elements) continue
        
        const pageId = v4()
        const response = await upsertFunnelPage(
          subaccountId,
          {
            id: pageId,
            name: pageConfig.name,
            pathName: i === 0 && pagesState.length === 0 ? '' : pageConfig.pathName,
            order: pagesState.length + i,
            content: JSON.stringify(elements),
          },
          funnelId
        )
        
        if (response) {
          newPages.push(response)
        }
      }

      if (newPages.length > 0) {
        await saveActivityLogsNotification({
          agencyId: undefined,
          description: `Created ${newPages.length} funnel pages from ${kit.name}`,
          subaccountId: subaccountId,
        })

        setPagesState([...pagesState, ...newPages])
        setClickedPage(newPages[0])
        router.refresh()
        
        toast({
          title: 'Success',
          description: `Created ${newPages.length} pages from ${kit.name}`,
        })
      }
    } catch (error) {
      console.error(error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create pages from starter kit',
      })
    } finally {
      setIsCreating(false)
    }
  }

  const onDragStart = (event: DragStart) => {
    //current chosen page
    const { draggableId } = event
    const value = pagesState.find((page) => page.id === draggableId)
  }

  const onDragEnd = (dropResult: DropResult) => {
    const { destination, source } = dropResult

    //no destination or same position
    if (
      !destination ||
      (destination.droppableId === source.droppableId &&
        destination.index === source.index)
    ) {
      return
    }
    //change state
    const newPageOrder = [...pagesState]
      .toSpliced(source.index, 1)
      .toSpliced(destination.index, 0, pagesState[source.index])
      .map((page, idx) => {
        return { ...page, order: idx }
      })

    setPagesState(newPageOrder)
    newPageOrder.forEach(async (page, index) => {
      try {
        await upsertFunnelPage(
          subaccountId,
          {
            id: page.id,
            order: index,
            name: page.name,
          },
          funnelId
        )
      } catch (error) {
        console.log(error)
        toast({
          variant: 'destructive',
          title: 'Failed',
          description: 'Could not save page order',
        })
        return
      }
    })

    toast({
      title: 'Success',
      description: 'Saved page order',
    })
  }

  return (
    <AlertDialog>
      <div className="flex border-[1px] lg:!flex-row flex-col ">
        <aside className="flex-[0.3] bg-background p-6  flex flex-col justify-between ">
          <ScrollArea className="h-full ">
            <div className="flex gap-4 items-center">
              <Check />
              Funnel Steps
            </div>
            {pagesState.length ? (
              <DragDropContext
                onDragEnd={onDragEnd}
                onDragStart={onDragStart}
              >
                <Droppable
                  droppableId="funnels"
                  direction="vertical"
                  key="funnels"
                  isDropDisabled={false}
                  isCombineEnabled={false}
                  ignoreContainerClipping={false}
                >
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                    >
                      {pagesState.map((page, idx) => (
                        <div
                          className="relative"
                          key={page.id}
                          onClick={() => setClickedPage(page)}
                        >
                          <FunnelStepCard
                            funnelPage={page}
                            index={idx}
                            key={page.id}
                            activePage={page.id === clickedPage?.id}
                          />
                        </div>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            ) : (
              <div className="text-center text-muted-foreground py-6">
                No Pages
              </div>
            )}
          </ScrollArea>
          <Button
            className="mt-4 w-full"
            disabled={isCreating}
            onClick={() => setIsTemplatePickerOpen(true)}
          >
            {isCreating ? 'Creating...' : 'Create New Steps'}
          </Button>
        </aside>
        <aside className="flex-[0.7] bg-muted p-4 ">
          {!!pagesState.length ? (
            <Card className="h-full flex justify-between flex-col">
              <CardHeader>
                <p className="text-sm text-muted-foreground">Page name</p>
                <CardTitle>{clickedPage?.name}</CardTitle>
                <CardDescription className="flex flex-col gap-4">
                  <div className="border-2 rounded-lg sm:w-80 w-full  overflow-clip">
                    <Link
                      href={`/subaccount/${subaccountId}/funnels/${funnelId}/editor/${clickedPage?.id}`}
                      className="relative group"
                    >
                      <div className="cursor-pointer group-hover:opacity-30 w-full">
                        <FunnelPagePlaceholder />
                      </div>
                      <LucideEdit
                        size={50}
                        className="!text-muted-foreground absolute top-1/2 left-1/2 opacity-0 transofrm -translate-x-1/2 -translate-y-1/2 group-hover:opacity-100 transition-all duration-100"
                      />
                    </Link>

                    <Link
                      target="_blank"
                      href={`${process.env.NEXT_PUBLIC_SCHEME}${funnel.subDomainName}.${process.env.NEXT_PUBLIC_DOMAIN}/${clickedPage?.pathName}`}
                      className="group flex items-center justify-start p-2 gap-2 hover:text-primary transition-colors duration-200"
                    >
                      <ExternalLink size={15} />
                      <div className="w-64 overflow-hidden overflow-ellipsis ">
                        {process.env.NEXT_PUBLIC_SCHEME}
                        {funnel.subDomainName}.{process.env.NEXT_PUBLIC_DOMAIN}/
                        {clickedPage?.pathName}
                      </div>
                    </Link>
                  </div>

                  <CreateFunnelPage
                    subaccountId={subaccountId}
                    defaultData={clickedPage}
                    funnelId={funnelId}
                    order={clickedPage?.order || 0}
                  />
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="h-[600px] flex items-center justify-center text-muted-foreground">
              Create a page to view page settings.
            </div>
          )}
        </aside>
      </div>
      <TemplatePickerModal
        isOpen={isTemplatePickerOpen}
        onClose={() => setIsTemplatePickerOpen(false)}
        onSelectBlank={handleCreateBlankPage}
        onSelectTemplate={handleCreateFromTemplate}
        onSelectStarterKit={handleCreateFromStarterKit}
      />
    </AlertDialog>
  )
}

export default FunnelSteps
