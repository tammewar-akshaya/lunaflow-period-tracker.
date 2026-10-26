import React, { useState, useEffect } from 'react'
import { X, Calendar, Droplets, Trash2, AlertTriangle, Check } from 'lucide-react'
import { FlowIntensity, Period } from '../types'
import { api } from '../services/api'

interface LogPeriodModalProps {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
  initialDate?: string
  existingPeriod?: Period | null
}

export const LogPeriodModal: React.FC<LogPeriodModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  initialDate,
  existingPeriod
}) => {
  const [startDate, setStartDate] = useState(initialDate || new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState<string>('')
  const [isOngoing, setIsOngoing] = useState(false)
  const [flowIntensity, setFlowIntensity] = useState<FlowIntensity>('medium')
  const [notes, setNotes] = useState('')
  const [warning, setWarning] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (existingPeriod) {
      setStartDate(existingPeriod.start_date)
      setEndDate(existingPeriod.end_date || '')
      setIsOngoing(!existingPeriod.end_date)
      setFlowIntensity(existingPeriod.flow_intensity || 'medium')
      setNotes(existingPeriod.notes || '')
    } else if (initialDate) {
      setStartDate(initialDate)
      setEndDate('')
      setIsOngoing(false)
      setNotes('')
    }
  }, [existingPeriod, initialDate, isOpen])

  if (!isOpen) return null

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setWarning(null)
    setIsSubmitting(true)

    try {
      const payload = {
        start_date: startDate,
        end_date: isOngoing ? null : (endDate || null),
        flow_intensity: flowIntensity,
        notes: notes.trim() || null
      }

      if (existingPeriod?.id) {
        await api.updatePeriod(existingPeriod.id, payload)
      } else {
        const res = await api.createPeriod(payload)
        if (res.warning) setWarning(res.warning)
      }

      onSaved()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to save period record.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!existingPeriod?.id) return
    setIsSubmitting(true)
    try {
      await api.deletePeriod(existingPeriod.id)
      onSaved()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to delete period record.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const flows: { key: FlowIntensity; label: string; desc: string; icon: string }[] = [
    { key: 'spotting', label: 'Spotting', desc: 'Very light droplets', icon: '💧' },
    { key: 'light', label: 'Light', desc: 'Minor flow', icon: '🩸' },
    { key: 'medium', label: 'Medium', desc: 'Typical flow', icon: '🩸🩸' },
    { key: 'heavy', label: 'Heavy', desc: 'Full heavy flow', icon: '🩸🩸🩸' }
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-md card-soft p-6 sm:p-8 border shadow-2xl relative my-8 animate-in fade-in duration-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-[#6B6470] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-[#F6DCE3] dark:bg-[#302A38] text-[#573B50] dark:text-[#E8A1B0] flex items-center justify-center">
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-serif font-bold text-xl text-[#573B50] dark:text-white">
              {existingPeriod ? 'Edit Period Entry' : 'Log Period Flow'}
            </h2>
            <p className="text-xs text-[#6B6470] dark:text-[#C8C1CD]">
              Saved securely to your personal cycle database
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {warning && (
          <div className="mb-4 p-3 rounded-xl bg-amber-50 text-amber-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{warning}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#573B50] dark:text-white mb-1">
                Start Date
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#26212C] text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#573B50] dark:text-white mb-1">
                End Date {isOngoing && '(Ongoing)'}
              </label>
              <input
                type="date"
                disabled={isOngoing}
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#26212C] text-xs font-semibold disabled:opacity-40"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-0.5">
            <input
              type="checkbox"
              id="ongoing"
              checked={isOngoing}
              onChange={(e) => {
                setIsOngoing(e.target.checked)
                if (e.target.checked) setEndDate('')
              }}
              className="rounded text-[#E8A1B0] focus:ring-[#E8A1B0]"
            />
            <label htmlFor="ongoing" className="text-xs text-[#6B6470] dark:text-[#C8C1CD]">
              Currently ongoing (no end date yet)
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#573B50] dark:text-white mb-2">
              Flow Intensity
            </label>
            <div className="grid grid-cols-2 gap-2">
              {flows.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFlowIntensity(f.key)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    flowIntensity === f.key
                      ? 'bg-[#F6DCE3] dark:bg-[#3A2D3C] border-[#E8A1B0] text-[#573B50] dark:text-white shadow-sm ring-1 ring-[#E8A1B0]'
                      : 'border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold">{f.label}</span>
                    <span className="text-xs">{f.icon}</span>
                  </div>
                  <span className="text-[10px] text-[#6B6470] dark:text-[#C8C1CD] block">{f.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#573B50] dark:text-white mb-1">
              Personal Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Started early morning with mild cramps..."
              className="w-full p-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#26212C] text-xs"
            />
          </div>

          <div className="pt-2 flex items-center justify-between gap-3">
            {existingPeriod && (
              <div>
                {showDeleteConfirm ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isSubmitting}
                      className="px-3 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs"
                    >
                      Confirm Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-2 py-2 text-xs text-[#6B6470]"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-2.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    title="Delete period record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-[#E8A1B0] hover:bg-[#d88f9f] text-[#573B50] font-bold text-xs shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isSubmitting ? 'Saving...' : 'Save Period'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
