import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { STAGE_COLORS, PRIORITY_COLORS } from '@/lib/constants'
import ClientDetailClient from './ClientDetailClient'

export const dynamic = 'force-dynamic'

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      meetingNotes: { orderBy: { meetingDate: 'desc' } },
      actionItems: { orderBy: { createdAt: 'desc' } },
    },
  })

  if (!client) notFound()

  const solutions: string[] = JSON.parse(client.solutions)

  return (
    <ClientDetailClient
      client={{ ...client, solutions }}
      stageColors={STAGE_COLORS}
      priorityColors={PRIORITY_COLORS}
    />
  )
}
