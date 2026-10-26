import React, { useState, useEffect } from 'react'
import { BookOpen, Plus, Trash2, Edit2, Calendar, Smile, AlertCircle, Check } from 'lucide-react'
import { api } from '../services/api'
import { JournalEntry } from '../types'

export const JournalPage: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // New / edit entry form state
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [content, setContent] = useState('')
  const [mood, setMood] = useState<string>('calm')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadEntries = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await api.getJournalEntries()
      setEntries(res.entries || [])
    } catch (err: any) {
      setError(err.message || 'Could not load journal entries.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadEntries()
  }, [])

  const handleOpenNew = () => {
    setEditingId(null)
    setContent('')
    setMood('calm')
    setDate(new Date().toISOString().slice(0, 10))
    setIsFormOpen(true)
  }

  const handleEdit = (entry: JournalEntry) => {
    setEditingId(entry.id)
    setContent(entry.content)
    setMood(entry.mood || 'calm')
    setDate(entry.date)
    setIsFormOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this journal note?')) return
    try {
      await api.deleteJournalEntry(id)
      setEntries(prev => prev.filter(e => e.id !== id))
    } catch (err: any) {
      alert(err.message || 'Failed to delete entry.')
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setIsSubmitting(true)
    try {
      if (editingId) {
        const res = await api.updateJournalEntry(editingId, { content, mood, date })
        setEntries(prev => prev.map(e => e.id === editingId ? res.entry : e))
      } else {
        const res = await api.createJournalEntry({ content, mood, date })
        setEntries(prev => [res.entry, ...prev])
      }
      setIsFormOpen(false)
      setContent('')
    } catch (err: any) {
      alert(err.message || 'Failed to save journal note.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const moodsList = [
    { id: 'happy', label: 'Happy', emoji: '😊' },
    { id: 'calm', label: 'Calm', emoji: '🌿' },
    { id: 'energetic', label: 'Energetic', emoji: '⚡' },
    { id: 'reflective', label: 'Reflective', emoji: '🌙' },
    { id: 'anxious', label: 'Anxious', emoji: '💭' },
    { id: 'tired', label: 'Tired', emoji: '🥱' }
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6 sm:py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#573B50] dark:text-white flex items-center gap-2.5">
            <BookOpen className="w-7 h-7 text-[#C9D8C0]" />
            <span>Private Wellness Journal</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6470] dark:text-[#C8C1CD] mt-0.5">
            A quiet sanctuary for your personal thoughts, emotions, and rhythm reflections
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNew}
          className="px-4 py-2.5 rounded-2xl bg-[#E8A1B0] hover:bg-[#d88f9f] text-[#573B50] font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Write Note</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Editor Modal / Card */}
      {isFormOpen && (
        <div className="card-soft p-6 sm:p-8 border shadow-lg mb-8 animate-in fade-in">
          <h2 className="text-lg font-serif font-bold text-[#573B50] dark:text-white mb-4">
            {editingId ? 'Edit Journal Entry' : 'New Journal Note'}
          </h2>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#573B50] dark:text-white mb-1">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border bg-white dark:bg-[#26212C] text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#573B50] dark:text-white mb-1">
                  Feeling / Mood
                </label>
                <select
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  className="w-full p-2.5 rounded-xl border bg-white dark:bg-[#26212C] text-xs font-semibold capitalize"
                >
                  {moodsList.map(m => (
                    <option key={m.id} value={m.id}>{m.emoji} {m.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#573B50] dark:text-white mb-1">
                Reflections
              </label>
              <textarea
                rows={5}
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What feels present in your body or mind today? How did you nurture your energy?"
                className="w-full p-3 rounded-2xl border bg-white dark:bg-[#26212C] text-sm leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 rounded-xl border text-xs font-semibold hover:bg-black/5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 rounded-xl bg-[#E8A1B0] hover:bg-[#d88f9f] text-[#573B50] font-bold text-xs shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isSubmitting ? 'Saving...' : 'Save Note'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Entries List */}
      <div className="space-y-4">
        {entries.length > 0 ? (
          entries.map((item) => (
            <div key={item.id} className="card-soft p-6 border shadow-sm relative group">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-black/5 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-full bg-[#E8E1F7] dark:bg-[#302A38] text-[#573B50] dark:text-white flex items-center justify-center text-sm font-bold">
                    {moodsList.find(m => m.id === item.mood)?.emoji || '🌙'}
                  </span>
                  <div>
                    <span className="text-xs font-bold text-[#573B50] dark:text-white block">
                      {new Date(item.date + 'T00:00:00').toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                    {item.mood && (
                      <span className="text-[11px] font-semibold text-[#6B6470] dark:text-[#C8C1CD] capitalize">
                        Felt {item.mood}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => handleEdit(item)}
                    className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-[#6B6470] dark:text-[#C8C1CD]"
                    title="Edit entry"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-500"
                    title="Delete entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-sm text-[#34313A] dark:text-[#F7F3F6] whitespace-pre-wrap leading-relaxed">
                {item.content}
              </p>
            </div>
          ))
        ) : (
          <div className="py-16 text-center card-soft p-8 border">
            <BookOpen className="w-10 h-10 text-[#C9D8C0] mx-auto mb-3" />
            <h3 className="font-serif font-bold text-base text-[#573B50] dark:text-white mb-1">
              Your journal is empty
            </h3>
            <p className="text-xs text-[#6B6470] dark:text-[#C8C1CD] mb-4">
              Write your first private reflection to keep track of thoughts and energy across your cycle.
            </p>
            <button
              type="button"
              onClick={handleOpenNew}
              className="px-4 py-2 rounded-xl bg-[#E8A1B0] hover:bg-[#d88f9f] text-[#573B50] font-bold text-xs"
            >
              Write First Entry
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
