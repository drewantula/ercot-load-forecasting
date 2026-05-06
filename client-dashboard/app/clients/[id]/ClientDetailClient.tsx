'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { SALES_STAGES, PRIORITY_LEVELS, CORITY_SOLUTIONS } from '@/lib/constants'

type MeetingNote = {
  id: string
  meetingDate: Date
  rawNotes: string
  salesforceNotes: string | null
  summary: string | null
  createdAt: Date
}

type ActionItem = {
  id: string
  description: string
  dueDate: Date | null
  completed: boolean
  createdAt: Date
}

type Client = {
  id: string
  companyName: string
  contactName: string
  contactEmail: string | null
  contactPhone: string | null
  industry: string | null
  dealSize: number | null
  stage: string
  priority: string
  internalDueDate: Date | null
  notes: string | null
  solutions: string[]
  meetingNotes: MeetingNote[]
  actionItems: ActionItem[]
}

export default function ClientDetailClient({
  client: initialClient,
  stageColors,
  priorityColors,
}: {
  client: Client
  stageColors: Record<string, string>
  priorityColors: Record<string, string>
}) {
  const router = useRouter()
  const [client, setClient] = useState(initialClient)
  const [activeTab, setActiveTab] = useState<'notes' | 'actions' | 'edit'>('notes')
  const [showNoteForm, setShowNoteForm] = useState(false)

  // Note form state
  const [noteForm, setNoteForm] = useState({
    meetingDate: new Date().toISOString().split('T')[0],
    rawNotes: '',
    actionItems: '',
  })
  const [generatingSF, setGeneratingSF] = useState(false)
  const [generatedSFNotes, setGeneratedSFNotes] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [sfCopied, setSFCopied] = useState(false)

  // Edit form state
  const [editForm, setEditForm] = useState({
    stage: client.stage,
    priority: client.priority,
    internalDueDate: client.internalDueDate
      ? new Date(client.internalDueDate).toISOString().split('T')[0]
      : '',
    dealSize: client.dealSize?.toString() ?? '',
    notes: client.notes ?? '',
    solutions: [...client.solutions],
  })
  const [savingEdit, setSavingEdit] = useState(false)

  // Action item state
  const [newActionText, setNewActionText] = useState('')
  const [addingAction, setAddingAction] = useState(false)

  async function generateSFNotes() {
    if (!noteForm.rawNotes.trim()) return
    setGeneratingSF(true)
    setGeneratedSFNotes('')
    const res = await fetch('/api/generate-sf-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rawNotes: noteForm.rawNotes,
        companyName: client.companyName,
        stage: client.stage,
        solutions: client.solutions,
      }),
    })
    const data = await res.json()
    setGeneratedSFNotes(data.salesforceNotes ?? '')
    setGeneratingSF(false)
  }

  async function saveNote() {
    setSavingNote(true)
    const actionItems = noteForm.actionItems
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)

    const res = await fetch(`/api/clients/${client.id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        meetingDate: noteForm.meetingDate,
        rawNotes: noteForm.rawNotes,
        salesforceNotes: generatedSFNotes || null,
        actionItems,
      }),
    })

    if (res.ok) {
      setNoteForm({ meetingDate: new Date().toISOString().split('T')[0], rawNotes: '', actionItems: '' })
      setGeneratedSFNotes('')
      setShowNoteForm(false)
      router.refresh()
    }
    setSavingNote(false)
  }

  async function saveEdit() {
    setSavingEdit(true)
    const res = await fetch(`/api/clients/${client.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    if (res.ok) {
      const updated = await res.json()
      setClient((c) => ({ ...c, ...updated, solutions: JSON.parse(updated.solutions) }))
      setActiveTab('notes')
    }
    setSavingEdit(false)
  }

  async function toggleAction(item: ActionItem) {
    const res = await fetch(`/api/action-items/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !item.completed }),
    })
    if (res.ok) {
      setClient((c) => ({
        ...c,
        actionItems: c.actionItems.map((a) =>
          a.id === item.id ? { ...a, completed: !a.completed } : a
        ),
      }))
    }
  }

  async function addActionItem() {
    if (!newActionText.trim()) return
    setAddingAction(true)
    const res = await fetch(`/api/clients/${client.id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rawNotes: `[Manual action item added]`,
        actionItems: [newActionText.trim()],
      }),
    })
    if (res.ok) {
      setNewActionText('')
      router.refresh()
    }
    setAddingAction(false)
  }

  function toggleEditSolution(s: string) {
    setEditForm((f) => ({
      ...f,
      solutions: f.solutions.includes(s) ? f.solutions.filter((x) => x !== s) : [...f.solutions, s],
    }))
  }

  function copySFNotes(text: string) {
    navigator.clipboard.writeText(text)
    setSFCopied(true)
    setTimeout(() => setSFCopied(false), 2000)
  }

  const openActions = client.actionItems.filter((a) => !a.completed)
  const closedActions = client.actionItems.filter((a) => a.completed)

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/clients" className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to clients
        </Link>
        <div className="flex items-start justify-between mt-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{client.companyName}</h1>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
              <span>{client.contactName}</span>
              {client.contactEmail && <span>{client.contactEmail}</span>}
              {client.contactPhone && <span>{client.contactPhone}</span>}
              {client.industry && <span>{client.industry}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded text-xs font-medium ${stageColors[client.stage] ?? 'bg-gray-100 text-gray-600'}`}
            >
              {client.stage}
            </span>
            <span
              className={`px-2.5 py-1 rounded text-xs font-medium ${priorityColors[client.priority] ?? 'bg-gray-100 text-gray-600'}`}
            >
              {client.priority}
            </span>
            {client.dealSize && (
              <span className="text-sm font-medium text-gray-700">
                ${client.dealSize.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Solutions in scope */}
        {client.solutions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {client.solutions.map((s) => (
              <span key={s} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                {s}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-xl font-bold text-gray-900">{client.meetingNotes.length}</div>
          <div className="text-sm text-gray-500">Meeting Notes</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-xl font-bold text-gray-900">{openActions.length}</div>
          <div className="text-sm text-gray-500">Open Actions</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-xl font-bold text-gray-900">
            {client.internalDueDate
              ? new Date(client.internalDueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              : '—'}
          </div>
          <div className="text-sm text-gray-500">Internal Due Date</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {(['notes', 'actions', 'edit'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 text-sm rounded-md font-medium capitalize transition-colors ${
              activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'edit' ? 'Edit Details' : tab === 'notes' ? 'Meeting Notes' : 'Action Items'}
          </button>
        ))}
      </div>

      {/* Meeting Notes tab */}
      {activeTab === 'notes' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-900">Meeting Notes</h2>
            <button
              onClick={() => setShowNoteForm((v) => !v)}
              className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700"
            >
              + Add Note
            </button>
          </div>

          {/* Add note form */}
          {showNoteForm && (
            <div className="bg-white border border-blue-200 rounded-xl p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">New Meeting Note</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Date</label>
                  <input
                    type="date"
                    value={noteForm.meetingDate}
                    onChange={(e) => setNoteForm((f) => ({ ...f, meetingDate: e.target.value }))}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Raw Notes (paste Gong transcript or your notes)
                  </label>
                  <textarea
                    rows={8}
                    value={noteForm.rawNotes}
                    onChange={(e) => setNoteForm((f) => ({ ...f, rawNotes: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"
                    placeholder="Paste your Gong transcript or call notes here..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Action Items (one per line)
                  </label>
                  <textarea
                    rows={3}
                    value={noteForm.actionItems}
                    onChange={(e) => setNoteForm((f) => ({ ...f, actionItems: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Send demo recording&#10;Schedule follow-up call&#10;Share pricing deck"
                  />
                </div>

                {/* SF Note generation */}
                <div className="border-t border-gray-100 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-700">Salesforce Notes</label>
                    <button
                      type="button"
                      onClick={generateSFNotes}
                      disabled={!noteForm.rawNotes.trim() || generatingSF}
                      className="text-sm bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                    >
                      {generatingSF ? 'Generating...' : '✨ Generate from Notes'}
                    </button>
                  </div>
                  {generatedSFNotes && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 relative">
                      <button
                        onClick={() => copySFNotes(generatedSFNotes)}
                        className="absolute top-2 right-2 text-xs bg-white border border-purple-200 text-purple-700 px-2 py-1 rounded hover:bg-purple-50"
                      >
                        {sfCopied ? 'Copied!' : 'Copy'}
                      </button>
                      <pre className="text-sm text-gray-800 whitespace-pre-wrap pr-16">{generatedSFNotes}</pre>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowNoteForm(false)}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveNote}
                    disabled={!noteForm.rawNotes.trim() || savingNote}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {savingNote ? 'Saving...' : 'Save Note'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notes list */}
          {client.meetingNotes.length === 0 && !showNoteForm ? (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400">
              No meeting notes yet. Add your first note above.
            </div>
          ) : (
            <div className="space-y-4">
              {client.meetingNotes.map((note) => (
                <NoteCard key={note.id} note={note} onCopy={copySFNotes} copied={sfCopied} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action Items tab */}
      {activeTab === 'actions' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-900">Action Items</h2>
          </div>

          {/* Quick add */}
          <div className="flex gap-2 mb-6">
            <input
              value={newActionText}
              onChange={(e) => setNewActionText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addActionItem()}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add action item and press Enter..."
            />
            <button
              onClick={addActionItem}
              disabled={!newActionText.trim() || addingAction}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Add
            </button>
          </div>

          {openActions.length === 0 && closedActions.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400">
              No action items yet.
            </div>
          ) : (
            <div className="space-y-2">
              {openActions.map((item) => (
                <ActionItemRow key={item.id} item={item} onToggle={toggleAction} />
              ))}
              {closedActions.length > 0 && (
                <>
                  <div className="text-xs text-gray-400 uppercase tracking-wide pt-4 pb-1">Completed</div>
                  {closedActions.map((item) => (
                    <ActionItemRow key={item.id} item={item} onToggle={toggleAction} />
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Edit tab */}
      {activeTab === 'edit' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Sales Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
                <select
                  value={editForm.stage}
                  onChange={(e) => setEditForm((f) => ({ ...f, stage: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {SALES_STAGES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={editForm.priority}
                  onChange={(e) => setEditForm((f) => ({ ...f, priority: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {PRIORITY_LEVELS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Internal Due Date</label>
                <input
                  type="date"
                  value={editForm.internalDueDate}
                  onChange={(e) => setEditForm((f) => ({ ...f, internalDueDate: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deal Size ($)</label>
                <input
                  type="number"
                  value={editForm.dealSize}
                  onChange={(e) => setEditForm((f) => ({ ...f, dealSize: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Solutions in Scope</h2>
            <div className="grid grid-cols-2 gap-2">
              {CORITY_SOLUTIONS.map((s) => (
                <label key={s} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.solutions.includes(s)}
                    onChange={() => toggleEditSolution(s)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">{s}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Account Notes</h2>
            <textarea
              rows={4}
              value={editForm.notes}
              onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Background, context, key stakeholders..."
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={saveEdit}
              disabled={savingEdit}
              className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {savingEdit ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function NoteCard({
  note,
  onCopy,
  copied,
}: {
  note: MeetingNote
  onCopy: (text: string) => void
  copied: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const [showSF, setShowSF] = useState(false)

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-medium text-gray-900">
            {new Date(note.meetingDate).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>
          {note.salesforceNotes && (
            <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded mt-1 inline-block">
              SF Notes ready
            </span>
          )}
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          {expanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {!expanded && (
        <p className="mt-2 text-sm text-gray-500 line-clamp-2">{note.rawNotes}</p>
      )}

      {expanded && (
        <div className="mt-4 space-y-4">
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Raw Notes</div>
            <pre className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-4 font-sans">
              {note.rawNotes}
            </pre>
          </div>

          {note.salesforceNotes && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={() => setShowSF((v) => !v)}
                  className="text-xs font-medium text-purple-600 uppercase tracking-wide hover:text-purple-800"
                >
                  {showSF ? '▼' : '▶'} Salesforce Notes
                </button>
                {showSF && (
                  <button
                    onClick={() => onCopy(note.salesforceNotes!)}
                    className="text-xs text-purple-600 hover:text-purple-800 border border-purple-200 px-2 py-0.5 rounded"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                )}
              </div>
              {showSF && (
                <pre className="text-sm text-gray-700 whitespace-pre-wrap bg-purple-50 border border-purple-100 rounded-lg p-4 font-sans">
                  {note.salesforceNotes}
                </pre>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ActionItemRow({
  item,
  onToggle,
}: {
  item: ActionItem
  onToggle: (item: ActionItem) => void
}) {
  return (
    <div
      className={`flex items-center gap-3 bg-white border rounded-lg px-4 py-3 ${
        item.completed ? 'border-gray-100 opacity-60' : 'border-gray-200'
      }`}
    >
      <input
        type="checkbox"
        checked={item.completed}
        onChange={() => onToggle(item)}
        className="w-4 h-4 text-blue-600 border-gray-300 rounded cursor-pointer"
      />
      <span className={`text-sm flex-1 ${item.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
        {item.description}
      </span>
      {item.dueDate && (
        <span className="text-xs text-gray-400">
          {new Date(item.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      )}
    </div>
  )
}
