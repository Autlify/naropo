'use client'
import Loading from '@/components/global/loading'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'
import { EditorBtns } from '@/lib/constants'
import { getStripe } from '@/lib/stripe/stripe-client'
import { EditorElement, useEditor } from '@/providers/editor/editor-provider'
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from '@stripe/react-stripe-js'
import clsx from 'clsx'
import { Trash } from 'lucide-react'
import React, { useEffect, useMemo, useState } from 'react'

type Props = {
  element: EditorElement
}

const Checkout = (props: Props) => {
  const { dispatch, state, subaccountId, funnelId } = useEditor()
  const [clientSecret, setClientSecret] = useState('')
  const [connectAccountId, setConnectAccountId] = useState('')
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [fetchNonce, setFetchNonce] = useState(0)
  const options = useMemo(() => ({ clientSecret }), [clientSecret])
  const styles = props.element.styles

  useEffect(() => {
    if (!funnelId) return
    const getClientSecret = async () => {
      setCheckoutError(null)
      try {
        const body = JSON.stringify({ funnelId, subaccountId })
        const response = await fetch('/api/features/crm/funnels/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          cache: 'no-store',
        })

        const responseJson = await response.json().catch(() => null)
        if (!response.ok) {
          const message =
            (responseJson && (responseJson.error || responseJson.message)) ||
            `Request failed (${response.status})`
          throw new Error(message)
        }

        if (!responseJson || !responseJson.clientSecret || !responseJson.connectAccountId) {
          throw new Error('Missing checkout session details')
        }
        setConnectAccountId(String(responseJson.connectAccountId))
        setClientSecret(String(responseJson.clientSecret))
      } catch (error) {
        const message = error instanceof Error ? error.message : 'An error occurred'
        setCheckoutError(message)
        toast({
          open: true,
          className: 'z-[100000]',
          variant: 'destructive',
          title: 'Oops!',
          description: message,
        })
      }
    }

    getClientSecret()
  }, [funnelId, subaccountId, fetchNonce])

  const handleDragStart = (e: React.DragEvent, type: EditorBtns) => {
    if (type === null) return
    e.dataTransfer.setData('componentType', type)
  }

  const handleOnClickBody = (e: React.MouseEvent) => {
    e.stopPropagation()
    dispatch({
      type: 'CHANGE_CLICKED_ELEMENT',
      payload: {
        elementDetails: props.element,
      },
    })
  }

  const handleDeleteElement = () => {
    dispatch({
      type: 'DELETE_ELEMENT',
      payload: { elementDetails: props.element },
    })
  }

  return (
    <div
      style={styles}
      draggable
      onDragStart={(e) => handleDragStart(e, 'paymentForm')}
      onClick={handleOnClickBody}
      className={clsx(
        'p-[2px] w-full m-[5px] relative text-[16px] transition-all flex items-center justify-center',
        {
          '!border-blue-500':
            state.editor.selectedElement.id === props.element.id,

          '!border-solid': state.editor.selectedElement.id === props.element.id,
          'border-dashed border-[1px] border-slate-300': !state.editor.liveMode,
        }
      )}
    >
      {state.editor.selectedElement.id === props.element.id &&
        !state.editor.liveMode && (
          <Badge className="absolute -top-[23px] -left-[1px] rounded-none rounded-t-lg ">
            {state.editor.selectedElement.name}
          </Badge>
        )}

      <div className="border-none transition-all w-full">
        <div className="flex flex-col gap-4 w-full">
          {options.clientSecret && connectAccountId && (
            <div className="text-white">
              <EmbeddedCheckoutProvider
                stripe={getStripe(connectAccountId)}
                options={options}
              >
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            </div>
          )}

          {!options.clientSecret && !checkoutError && (
            <div className="flex items-center justify-center w-full h-40">
              <Loading />
            </div>
          )}

          {checkoutError && (
            <div className="flex flex-col items-center justify-center w-full h-40 gap-2 text-center">
              <p className="text-sm text-destructive">Checkout failed to load.</p>
              <p className="text-xs text-muted-foreground max-w-[520px]">{checkoutError}</p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  // Trigger re-fetch of clientSecret.
                  setClientSecret('')
                  setCheckoutError(null)
                  setFetchNonce((n) => n + 1)
                }}
              >
                Retry
              </Button>
            </div>
          )}
        </div>
      </div>

      {state.editor.selectedElement.id === props.element.id &&
        !state.editor.liveMode && (
          <div className="absolute bg-primary px-2.5 py-1 text-xs font-bold  -top-[25px] -right-[1px] rounded-none rounded-t-lg !text-white">
            <Trash
              className="cursor-pointer"
              size={16}
              onClick={handleDeleteElement}
            />
          </div>
        )}
    </div>
  )
}

export default Checkout
