import React, { useState, useEffect } from 'react'
import { X, Heart, Smile, Battery, Moon, Droplet, Activity, Check, Plus } from 'lucide-react'
import { DailyCheckin, FlowIntensity } from '../types'
import { api } from '../services/api'

interface CheckinModalProps {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
  initialDate?: string
  existingCheckin?: DailyCheckin | null
}

export const CheckinModal: React.FC<CheckinModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  initialDate,
  existingCheckin
}) => {
  const [date, setDate] = useState(initialDate || new Date().toISOString().slice(0, 10))
  const [symptoms, setSymptoms] = useState<string[]>([])
  const [customSymptom, setCustomSymptom] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [mood, setMood] = useState<string | null>(null)
  const [flowIntensity, setFlowIntensity] = useState<FlowIntensity | null>(null)
  const [energyLevel, setEnergyLevel] = useState<number>(3)
  const [sleepQuality, setSleepQuality] = useState<string>('good')
  const [sleepHours, setSleepHours] = useState<number>(7.5)
  const [waterGlasses, setWaterGlasses] = useState<number>(6)
  const [exerciseMinutes, setExerciseMinutes] = useState<number>(20)
  const [exerciseType, setExerciseType] = useState<string>('walking')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (existingCheckin) {
      setDate(existingCheckin.date)
      setSymptoms(existingCheckin.symptoms || [])
      setMood(existingCheckin.mood || null)
      setFlowIntensity(existingCheckin.flow_intensity || null)
      setEnergyLevel(existingCheckin.energy_level || 3)
      setSleepQuality(existingCheckin.sleep_quality || 'good')
      setSleepHours(existingCheckin.sleep_hours || 7.5)
      setWaterGlasses(existingCheckin.water_glasses || 6)
      if (existingCheckin.exercise) {
        setExerciseMinutes(existingCheckin.exercise.minutes || 20)
        setExerciseType(existingCheckin.exercise.type || 'walking')
      }
      setNotes(existingCheckin.notes || '')
    } else if (initialDate) {
      setDate(initialDate)
      setSymptoms([])
      setMood(null)
      setFlowIntensity(null)
      setNotes('')
    }
  }, [existingCheckin, initialDate, isOpen])

  if (!isOpen) return null

  const availableSymptoms = [
    { id: 'cramps', label: 'Cramps', icon: '⚡' },
    { id: 'bloating', label: 'Bloating', icon: '🎈' },
    { id: 'headache', label: 'Headache', icon: '🤕' },
    { id: 'back_pain', label: 'Back Pain', icon: '🦴' },
    { id: 'fatigue', label: 'Fatigue', icon: '😴' },
    { id: 'acne', label: 'Acne', icon: '✨' },
    { id: 'breast_tenderness', label: 'Tenderness', icon: '🌸' },
    { id: 'nausea', label: 'Nausea', icon: '🤢' },
    { id: 'cravings', label: 'Cravings', icon: '🍫' }
  ]

  const moods = [
    { id: 'happy', label: 'Happy', emoji: '😊' },
    { id: 'calm', label: 'Calm', emoji: '🌿' },
    { id: 'energetic', label: 'Energetic', emoji: '⚡' },
    { id: 'anxious', label: 'Anxious', emoji: '💭' },
    { id: 'irritable', label: 'Irritable', emoji: '🌩️' },
    { id: 'sad', label: 'Sad', emoji: '🌧️' },
    { id: 'tired', label: 'Tired', emoji: '🥱' }
  ]

  const toggleSymptom = (sym: string) => {
    setSymptoms(prev => prev.includes(sym) ? prev.filter(s => s !== sym) : [...prev, sym])
  }

  const addCustomSymptom = () => {
    const trimmed = customSymptom.trim().toLowerCase().replace(/\s+/g, '_')
    if (trimmed && !symptoms.includes(trimmed)) {
      setSymptoms(prev => [...prev, trimmed])
      setCustomSymptom('')
      setShowCustomInput(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await api.saveCheckin({
        date,
        symptoms,
        mood,
        flow_intensity: flowIntensity,
        energy_level: energyLevel,
        sleep_quality: sleepQuality,
        sleep_hours: sleepHours,
        water_glasses: waterGlasses,
        exercise: { minutes: exerciseMinutes, type: exerciseType },
        notes: notes.trim() || null
      })
      onSaved()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to save daily check-in.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg card-soft p-6 sm:p-8 border shadow-2xl relative my-8 animate-in fade-in duration-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-[#6B6470] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-[#E8E1F7] dark:bg-[#382D42] text-[#573B50] dark:text-[#B29FE8] flex items-center justify-center">
            <Heart className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-serif font-bold text-xl text-[#573B50] dark:text-white">
              Daily Wellness Check-in
            </h2>
            <p className="text-xs text-[#6B6470] dark:text-[#C8C1CD]">
              Track how your body and mind feel today
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
          <div>
            <label className="block text-xs font-bold text-[#573B50] dark:text-white mb-1">
              Check-in Date
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#26212C] text-xs font-semibold"
            />
          </div>

          {/* Mood Chips */}
          <div>
            <label className="block text-xs font-bold text-[#573B50] dark:text-white mb-2 flex items-center gap-1.5">
              <Smile className="w-4 h-4 text-[#E8A1B0]" />
              <span>Current Mood</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {moods.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMood(mood === m.id ? null : m.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                    mood === m.id
                      ? 'bg-[#E8A1B0] text-[#573B50] border-[#E8A1B0] shadow-sm font-bold scale-105'
                      : 'border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <span>{m.emoji}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Symptoms Chips */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-[#573B50] dark:text-white flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-[#C46D82]" />
                <span>Physical Symptoms</span>
              </label>
              <button
                type="button"
                onClick={() => setShowCustomInput(!showCustomInput)}
                className="text-[11px] font-semibold text-[#573B50] dark:text-[#E8A1B0] hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add custom
              </button>
            </div>

            {showCustomInput && (
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="e.g. Migraine, hot flash"
                  value={customSymptom}
                  onChange={(e) => setCustomSymptom(e.target.value)}
                  className="flex-1 p-2 rounded-xl border text-xs bg-white dark:bg-[#26212C]"
                />
                <button
                  type="button"
                  onClick={addCustomSymptom}
                  className="px-3 py-1 rounded-xl bg-[#E8A1B0] text-[#573B50] text-xs font-bold"
                >
                  Add
                </button>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {availableSymptoms.map((s) => {
                const selected = symptoms.includes(s.id)
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleSymptom(s.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                      selected
                        ? 'bg-[#F6DCE3] dark:bg-[#3A2D3C] text-[#573B50] dark:text-white border-[#E8A1B0] shadow-sm'
                        : 'border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <span>{s.icon}</span>
                    <span>{s.label}</span>
                  </button>
                )
              })}
              {/* Render custom symptoms */}
              {symptoms.filter(sym => !availableSymptoms.find(a => a.id === sym)).map((custom) => (
                <button
                  key={custom}
                  type="button"
                  onClick={() => toggleSymptom(custom)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold border bg-[#F6DCE3] text-[#573B50] border-[#E8A1B0] flex items-center gap-1"
                >
                  <span>✨</span>
                  <span>{custom.replace('_', ' ')}</span>
                  <X className="w-3 h-3 ml-1" />
                </button>
              ))}
            </div>
          </div>

          {/* Energy Level (1-5) */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-[#573B50] dark:text-white flex items-center gap-1.5">
                <Battery className="w-4 h-4 text-emerald-500" />
                <span>Energy Level</span>
              </label>
              <span className="text-xs font-bold text-[#573B50] dark:text-white">
                {['Very Low', 'Low', 'Moderate', 'High', 'Vibrant'][energyLevel - 1]} ({energyLevel}/5)
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={energyLevel}
              onChange={(e) => setEnergyLevel(Number(e.target.value))}
              className="w-full accent-[#E8A1B0]"
            />
          </div>

          {/* Sleep & Water */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
              <label className="block text-xs font-bold mb-1 flex items-center gap-1">
                <Moon className="w-3.5 h-3.5 text-indigo-400" /> Sleep (hrs)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="24"
                value={sleepHours}
                onChange={(e) => setSleepHours(Number(e.target.value))}
                className="w-full p-2 rounded-xl border bg-white dark:bg-[#26212C] text-xs font-semibold"
              />
            </div>

            <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
              <label className="block text-xs font-bold mb-1 flex items-center gap-1">
                <Droplet className="w-3.5 h-3.5 text-sky-400" /> Water (glasses)
              </label>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setWaterGlasses(Math.max(0, waterGlasses - 1))}
                  className="w-7 h-7 rounded-lg bg-black/10 dark:bg-white/10 font-bold"
                >
                  -
                </button>
                <span className="font-bold text-sm">{waterGlasses}</span>
                <button
                  type="button"
                  onClick={() => setWaterGlasses(waterGlasses + 1)}
                  className="w-7 h-7 rounded-lg bg-black/10 dark:bg-white/10 font-bold"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Exercise Activity */}
          <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
            <label className="block text-xs font-bold mb-2 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-emerald-500" /> Exercise & Movement
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Type (e.g. Yoga, Walk)"
                value={exerciseType}
                onChange={(e) => setExerciseType(e.target.value)}
                className="p-2 rounded-xl border bg-white dark:bg-[#26212C] text-xs"
              />
              <input
                type="number"
                placeholder="Minutes"
                value={exerciseMinutes}
                onChange={(e) => setExerciseMinutes(Number(e.target.value))}
                className="p-2 rounded-xl border bg-white dark:bg-[#26212C] text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#573B50] dark:text-white mb-1">
              Daily Wellness Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How are you taking care of yourself today?"
              className="w-full p-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#26212C] text-xs"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
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
              <span>{isSubmitting ? 'Saving...' : 'Save Check-in'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
