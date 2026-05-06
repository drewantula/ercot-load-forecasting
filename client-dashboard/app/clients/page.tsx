import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { STAGE_COLORS, PRIORITY_COLORS, SALES_STAGES } from '@/lib/constants'

export const dynamic = 'force-dynamic'

function formatDueDate(date: Date | null): string {
  if (!date) return '—'
  const d = new Date(date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return `${Math.abs(diff)}d overdue`
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function isDueSoon(date: Date | null): boolean {
  if (!date) return false
  const diff = Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  return diff <= 3
}

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: { select: { meetingNotes: true, actionItems: true } },
      actionItems: { where: { completed: false }, orderBy: { dueDate: 'asc' } },
    },
  })

  const stageCounts = SALES_STAGES.reduce((acc, s) => {
    acc[s] = clients.filter((c) => c.stage === s).length
    return acc
  }, {} as Record<string, number>)

  const activeClients = clients.filter((c) => c.stage !== 'Closed Won' && c.stage !== 'Closed Lost')

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Client Pipeline</h1>
          <p className="text-gray-500 mt-1">{activeClients.length} active opportunities</p>
        </div>
        <Link
          href="/clients/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
        >
          + New Client
        </Link>
      </div>

      {/* Stage summary bar */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {['Discovery', 'Business Case', 'Proposal / SOW', 'Negotiation'].map((stage) => (
          <div key={stage} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-gray-900">{stageCounts[stage] ?? 0}</div>
            <div className="text-sm text-gray-500 mt-1">{stage}</div>
          </div>
        ))}
      </div>

      {/* Client table */}
      {clients.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <div className="text-4xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No clients yet</h3>
          <p className="text-gray-500 mb-6">Add your first client to get started.</p>
          <Link href="/clients/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Add Client
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-6 py-3 font-medium text-gray-500">Company</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Stage</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Priority</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Solutions</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Due Date</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Next Action</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Notes</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => {
                const solutions: string[] = JSON.parse(client.solutions)
                const nextAction = client.actionItems[0]
                const dueDateLabel = formatDueDate(client.internalDueDate)
                const overdue = isDueSoon(client.internalDueDate)

                return (
                  <tr key={client.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/clients/${client.id}`} className="font-medium text-blue-600 hover:underline">
                        {client.companyName}
                      </Link>
                      <div className="text-xs text-gray-400 mt-0.5">{client.contactName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STAGE_COLORS[client.stage] ?? 'bg-gray-100 text-gray-600'}`}
                      >
                        {client.stage}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${PRIORITY_COLORS[client.priority] ?? 'bg-gray-100 text-gray-600'}`}
                      >
                        {client.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {solutions.slice(0, 2).map((s) => (
                          <span key={s} className="bg-blue-50 text-blue-700 text-xs px-1.5 py-0.5 rounded">
                            {s.split(' ')[0]}
                          </span>
                        ))}
                        {solutions.length > 2 && (
                          <span className="text-xs text-gray-400">+{solutions.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs ${overdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                        {dueDateLabel}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-[200px]">
                      {nextAction ? (
                        <span className="text-xs text-gray-600 truncate block">{nextAction.description}</span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-400">
                      {client._count.meetingNotes} notes
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
