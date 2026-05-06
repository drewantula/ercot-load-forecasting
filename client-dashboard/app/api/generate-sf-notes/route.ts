import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(request: NextRequest) {
  const { rawNotes, companyName, stage, solutions } = await request.json()

  if (!rawNotes) {
    return NextResponse.json({ error: 'rawNotes is required' }, { status: 400 })
  }

  const solutionsText = solutions?.length ? `Solutions in scope: ${solutions.join(', ')}` : ''

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are a Salesforce CRM note writer for a solutions consultant at Cority, an EHS software company.

Convert the following raw meeting/call notes into clean, professional Salesforce activity notes.

Context:
- Company: ${companyName}
- Sales Stage: ${stage}
- ${solutionsText}

Format the output with these sections:
**Meeting Summary** (2-3 sentences)
**Key Discussion Points** (bullet points)
**Client Needs & Pain Points** (bullet points)
**Next Steps** (numbered, with owner if mentioned)

Raw notes:
${rawNotes}

Write professional, concise Salesforce notes based on these raw notes. Focus on facts, decisions, and action items.`,
      },
    ],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  return NextResponse.json({ salesforceNotes: text })
}
