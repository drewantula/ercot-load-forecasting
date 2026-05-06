import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const item = await prisma.actionItem.update({
    where: { id },
    data: {
      ...(body.completed !== undefined && { completed: body.completed }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.dueDate !== undefined && { dueDate: body.dueDate ? new Date(body.dueDate) : null }),
    },
  })
  return NextResponse.json(item)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.actionItem.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
