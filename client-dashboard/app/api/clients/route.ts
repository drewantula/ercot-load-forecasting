import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const clients = await prisma.client.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: { select: { meetingNotes: true, actionItems: true } },
      actionItems: { where: { completed: false }, select: { dueDate: true } },
    },
  })
  return NextResponse.json(clients)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const client = await prisma.client.create({
    data: {
      companyName: body.companyName,
      contactName: body.contactName,
      contactEmail: body.contactEmail ?? null,
      contactPhone: body.contactPhone ?? null,
      industry: body.industry ?? null,
      dealSize: body.dealSize ? parseFloat(body.dealSize) : null,
      stage: body.stage ?? 'Discovery',
      priority: body.priority ?? 'Medium',
      internalDueDate: body.internalDueDate ? new Date(body.internalDueDate) : null,
      notes: body.notes ?? null,
      solutions: JSON.stringify(body.solutions ?? []),
    },
  })
  return NextResponse.json(client, { status: 201 })
}
