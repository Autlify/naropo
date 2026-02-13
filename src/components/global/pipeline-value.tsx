'use client'
import { getPipelines } from '@/lib/queries'
import { Prisma } from '@/generated/prisma/client'
import React, { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader } from '../ui/card'
import { Progress } from '../ui/progress'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '../ui/select'

type Props = {
  subaccountId: string
  className?: string
}

const PipelineValue = ({ subaccountId, className }: Props) => {
  const [pipelines, setPipelines] = useState<
    Awaited<ReturnType<typeof getPipelines>>
  >([])

  const [selectedPipelineId, setselectedPipelineId] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      const res = await getPipelines(subaccountId)
      setPipelines(res)
      setselectedPipelineId(res[0]?.id ?? '')
    }
    fetchData()
  }, [subaccountId])

  const pipelineMetrics = useMemo(() => {
    const pipeline = pipelines.find((p: any) => p.id === selectedPipelineId)
    const lanes = pipeline?.Lane ?? []
    if (!Array.isArray(lanes) || lanes.length === 0) {
      return { openValue: 0, closedValue: 0 }
    }

    let openValue = 0
    let closedValue = 0

    for (let i = 0; i < lanes.length; i++) {
      const lane = lanes[i]
      const laneTicketsTotal = (lane?.Tickets ?? []).reduce(
        (total: number, ticket: any) => total + Number(ticket?.value ?? 0),
        0
      )
      if (i === lanes.length - 1) {
        closedValue += laneTicketsTotal
      } else {
        openValue += laneTicketsTotal
      }
    }

    return { openValue, closedValue }
  }, [pipelines, selectedPipelineId])

  const totalValue = pipelineMetrics.openValue + pipelineMetrics.closedValue
  const pipelineRate = totalValue > 0 ? (pipelineMetrics.closedValue / totalValue) * 100 : 0

  return (
    <Card className={cn('relative w-full h-full', className)}>
      <CardHeader>
        <CardDescription>Pipeline Value</CardDescription>
        <small className="text-xs text-muted-foreground">
          Pipeline Progress
        </small>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">
              Closed ${pipelineMetrics.closedValue}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              Total ${totalValue}
            </p>
          </div>
        </div>
        <Progress
          color="green"
          value={Number.isFinite(pipelineRate) ? pipelineRate : 0}
          className="h-2"
        />
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        <p className="mb-2">
          Total value of all tickets in the given pipeline except the last lane.
          Your last lane is considered your closing lane in every pipeline.
        </p>
        <Select
          value={selectedPipelineId}
          onValueChange={setselectedPipelineId}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select a pipeline" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Pipelines</SelectLabel>
              {pipelines.map((pipeline: any) => (
                <SelectItem
                  value={pipeline.id}
                  key={pipeline.id}
                >
                  {pipeline.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  )
}

export default PipelineValue
