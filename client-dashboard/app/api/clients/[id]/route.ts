import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      meetingNotes: { orderBy: { meetingDate: 'desc' } },
      actionItems: { orderBy: { createdAt: 'desc' } },
    },
  })
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(client)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const client = await prisma.client.update({
    where: { id },
    data: {
      ...(body.companyName !== undefined && { companyName: body.companyName }),
      ...(body.contactName !== undefined && { contactName: body.contactName }),
      ...(body.contactEmail !== undefined && { contactEmail: body.contactEmail }),
      ...(body.contactPhone !== undefined && { contactPhone: body.contactPhone }),
      ...(body.industry !== undefined && { industry: body.industry }),
      ...(body.dealSize !== undefined && { dealSize: body.dealSize ? parseFloat(body.dealSize) : null }),
      ...(body.stage !== undefined && { stage: body.stage }),
      ...(body.priority !== undefined && { priority: body.priority }),
      ...(body.internalDueDate !== undefined && {
        internalDueDate: body.internalDueDate ? new Date(body.internalDueDate) : null,
      }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.solutions !== undefined && { solutions: JSON.stringify(body.solutions) }),
    },
  })
  return NextResponse.json(client)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.client.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
