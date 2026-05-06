import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const notes = await prisma.meetingNote.findMany({
    where: { clientId: id },
    orderBy: { meetingDate: 'desc' },
  })
  return NextResponse.json(notes)
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const note = await prisma.meetingNote.create({
    data: {
      clientId: id,
      meetingDate: body.meetingDate ? new Date(body.meetingDate) : new Date(),
      rawNotes: body.rawNotes,
      salesforceNotes: body.salesforceNotes ?? null,
      summary: body.summary ?? null,
    },
  })

  // Also create action items if provided
  if (body.actionItems?.length) {
    await prisma.actionItem.createMany({
      data: body.actionItems.map((desc: string) => ({
        clientId: id,
        description: desc,
      })),
    })
  }

  await prisma.client.update({ where: { id }, data: { updatedAt: new Date() } })

  return NextResponse.json(note, { status: 201 })
}
