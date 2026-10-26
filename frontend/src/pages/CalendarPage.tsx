import React, { useState, useEffect } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  Heart,
  Droplet,
  Trash2,
  Edit2,
  Sparkles,
  Info
} from 'lucide-react'
import { api } from '../services/api'
import { CalendarMonthData, FlowIntensity, Period } from '../types'
import { LogPeriodModal } from '../components/LogPeriodModal'
import { CheckinModal } from '../components/CheckinModal'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'

export const CalendarPage: React.FC = () => {
  const { preferences } = useAuth()
  const { t } = useTranslation()

  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1) // 1-12
  const [calendarData, setCalendarData] = useState<CalendarMonthData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Selected date state
  const [selectedDate, setSelectedDate] = useState<string>(today.toISOString().slice(0, 10))

  // Modal controls
  const [isLogPeriodOpen, setIsLogPeriodOpen] = useState(false)
  const [isCheckinOpen, setIsCheckinOpen] = useState(false)
  const [editingPeriod, setEditingPeriod] = useState<Period | null>(null)

  // Quick Undo delete banner
  const [undoPeriod, setUndoPeriod] = useState<Period | null>(null)

  const monthParam = `${currentYear}-${String(currentMonth).padStart(2, '0')}`

  const fetchCalendar = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await api.getCalendarMonth(monthParam)
      setCalendarData(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load calendar data.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCalendar()
  }, [monthParam])

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const handleToday = () => {
    const now = new Date()
    setCurrentYear(now.getFullYear())
    setCurrentMonth(now.getMonth() + 1)
    setSelectedDate(now.toISOString().slice(0, 10))
  }

  // Month title
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  const monthTitle = `${monthNames[currentMonth - 1]} ${currentYear}`

  // Build calendar matrix
  const daysInMonth = calendarData?.num_days || 31
  const firstDayWeekday = calendarData?.first_day_weekday ?? 0 // 0=Mon, 6=Sun

  // Generate leading empty cells for weekday alignment (Monday start)
  const leadingBlanks = Array.from({ length: firstDayWeekday }, (_, i) => i)

  // Month days
  const daysList = Array.from({ length: daysInMonth }, (_, i) => {
    const dayNum = i + 1
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
    return { dayNum, dateStr }
  })

  // Selected date info
  const selectedPeriodInfo = calendarData?.period_days[selectedDate]
  const selectedCheckinInfo = calendarData?.checkins[selectedDate]
  const isSelectedPredicted = calendarData?.predicted_days[selectedDate]
  const isSelectedFertile = calendarData?.fertile_days[selectedDate]

  const handleEditSelectedPeriod = async () => {
    if (selectedPeriodInfo?.period_id) {
      try {
        const res = await api.getPeriod(selectedPeriodInfo.period_id)
        setEditingPeriod(res.period)
        setIsLogPeriodOpen(true)
      } catch (e) {
        console.error(e)
      }
    }
  }

  const handleDeleteSelectedPeriod = async () => {
    if (selectedPeriodInfo?.period_id) {
      try {
        const res = await api.deletePeriod(selectedPeriodInfo.period_id)
        setUndoPeriod(res.deleted_period)
        fetchCalendar()
      } catch (e) {
        console.error(e)
      }
    }
  }

  const handleUndoDelete = async () => {
    if (undoPeriod) {
      try {
        await api.createPeriod({
          start_date: undoPeriod.start_date,
          end_date: undoPeriod.end_date,
          flow_intensity: undoPeriod.flow_intensity,
          notes: undoPeriod.notes
        })
        setUndoPeriod(null)
        fetchCalendar()
      } catch (e) {
        console.error(e)
      }
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-10">
      {/* Top Header & Month Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#573B50] dark:text-white flex items-center gap-2.5">
            <CalendarIcon className="w-7 h-7 text-[#E8A1B0]" />
            <span>Cycle Calendar</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6470] dark:text-[#C8C1CD] mt-0.5">
            Record period dates, symptoms, and review cycle predictions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { setEditingPeriod(null); setIsLogPeriodOpen(true); }}
            className="px-4 py-2 rounded-xl bg-[#E8A1B0] hover:bg-[#d88f9f] text-[#573B50] font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Log Period</span>
          </button>
          <button
            type="button"
            onClick={() => setIsCheckinOpen(true)}
            className="px-4 py-2 rounded-xl card-soft text-[#573B50] dark:text-white font-semibold text-xs sm:text-sm hover:bg-black/5 dark:hover:bg-white/5 transition-all flex items-center gap-1.5"
          >
            <Heart className="w-4 h-4 text-[#C46D82]" />
            <span>Check-in</span>
          </button>
        </div>
      </div>

      {/* Undo Banner if period deleted */}
      {undoPeriod && (
        <div className="mb-6 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-center justify-between text-xs text-amber-800 dark:text-amber-200 animate-in fade-in">
          <span>Period record deleted ({undoPeriod.start_date}).</span>
          <button
            type="button"
            onClick={handleUndoDelete}
            className="font-bold underline text-[#573B50] dark:text-white hover:opacity-80"
          >
            Undo Delete
          </button>
        </div>
      )}

      {/* Main Calendar Card & Selected Date Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Monthly Calendar View (2 Cols on Desktop) */}
        <div className="lg:col-span-2 card-soft p-5 sm:p-8 border shadow-sm">
          {/* Calendar Navigation Bar */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-black/5 dark:border-white/10">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-[#573B50] dark:text-white transition-colors"
                aria-label="Previous Month"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#573B50] dark:text-white min-w-[180px]">
                {monthTitle}
              </h2>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-[#573B50] dark:text-white transition-colors"
                aria-label="Next Month"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleToday}
              className="px-3.5 py-1.5 rounded-xl border border-black/10 dark:border-white/10 text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              Today
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <span key={day} className="text-[11px] sm:text-xs font-bold text-[#6B6470] dark:text-[#C8C1CD] uppercase tracking-wider">
                {day}
              </span>
            ))}
          </div>

          {/* Calendar Days Matrix */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {leadingBlanks.map((b) => (
              <div key={`blank-${b}`} className="min-h-[50px] sm:min-h-[70px] opacity-0 pointer-events-none" />
            ))}

            {daysList.map(({ dayNum, dateStr }) => {
              const isToday = dateStr === today.toISOString().slice(0, 10)
              const isSelected = dateStr === selectedDate
              const periodInfo = calendarData?.period_days[dateStr]
              const predInfo = calendarData?.predicted_days[dateStr]
              const fertInfo = calendarData?.fertile_days[dateStr]
              const checkinInfo = calendarData?.checkins[dateStr]

              let cellStyle = 'bg-white dark:bg-[#26212C] border-black/5 dark:border-white/5'

              if (periodInfo) {
                cellStyle = 'period-day-active'
              } else if (predInfo) {
                cellStyle = 'period-predicted-day'
              } else if (fertInfo?.is_ovulation) {
                cellStyle = 'ovulation-day'
              } else if (fertInfo) {
                cellStyle = 'fertile-window-day'
              }

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => setSelectedDate(dateStr)}
                  className={`min-h-[50px] sm:min-h-[70px] p-1.5 sm:p-2 rounded-2xl border flex flex-col justify-between items-center transition-all relative ${cellStyle} ${
                    isSelected ? 'ring-2 ring-[#573B50] dark:ring-white scale-[1.03] shadow-md z-10' : 'hover:border-[#E8A1B0]'
                  }`}
                >
                  <div className="w-full flex items-center justify-between">
                    <span
                      className={`text-xs sm:text-sm font-bold ${
                        isToday
                          ? 'w-6 h-6 rounded-full bg-[#573B50] text-white flex items-center justify-center text-[11px]'
                          : ''
                      }`}
                    >
                      {dayNum}
                    </span>

                    {/* Flow drop indicator */}
                    {periodInfo && (
                      <span className="text-[10px]">
                        {periodInfo.flow_intensity === 'heavy' ? '🩸' : '💧'}
                      </span>
                    )}
                  </div>

                  {/* Indicators for Symptoms & Notes */}
                  <div className="flex items-center gap-1 mt-auto">
                    {checkinInfo?.symptoms && checkinInfo.symptoms.length > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C46D82]" title="Logged Symptoms" />
                    )}
                    {checkinInfo?.mood && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#866ACF]" title="Logged Mood" />
                    )}
                    {predInfo && (
                      <span className="text-[9px] font-semibold opacity-75">est</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Calendar Legend */}
          <div className="mt-8 pt-6 border-t border-black/5 dark:border-white/10 flex flex-wrap items-center gap-4 text-xs text-[#6B6470] dark:text-[#C8C1CD]">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-lg bg-[#E8A1B0] inline-block shadow-sm" />
              <span>Period Flow</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-lg border-2 border-dashed border-[#E8A1B0] bg-[#F6DCE3]/30 inline-block" />
              <span>Predicted Period</span>
            </div>
            {preferences?.fertile_window_enabled && (
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-lg bg-[#C9D8C0] inline-block shadow-sm" />
                <span>Fertile / Ovulation</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#C46D82] inline-block" />
              <span>Logged Symptoms</span>
            </div>
          </div>
        </div>

        {/* Selected Date Details Panel (Right Col) */}
        <div className="card-soft p-6 sm:p-7 border shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-black/5 dark:border-white/10">
              <div>
                <span className="text-xs font-semibold text-[#6B6470] dark:text-[#C8C1CD] uppercase tracking-wider block">
                  Selected Date
                </span>
                <h3 className="text-xl font-serif font-bold text-[#573B50] dark:text-white mt-0.5">
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </h3>
              </div>

              {selectedDate === today.toISOString().slice(0, 10) && (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#F6DCE3] text-[#573B50]">
                  Today
                </span>
              )}
            </div>

            {/* Period Status for this Date */}
            <div className="mb-6 p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#573B50] dark:text-white flex items-center gap-1.5">
                  <Droplet className="w-4 h-4 text-[#E8A1B0]" />
                  <span>Period Flow</span>
                </span>
                {selectedPeriodInfo && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#E8A1B0] text-[#573B50]">
                    {selectedPeriodInfo.flow_intensity}
                  </span>
                )}
              </div>

              {selectedPeriodInfo ? (
                <div>
                  <p className="text-xs text-[#6B6470] dark:text-[#C8C1CD]">
                    Bleeding logged for this date.
                    {selectedPeriodInfo.notes && (
                      <span className="block mt-1 italic">"{selectedPeriodInfo.notes}"</span>
                    )}
                  </p>
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-black/5 dark:border-white/5">
                    <button
                      type="button"
                      onClick={handleEditSelectedPeriod}
                      className="text-xs font-bold text-[#573B50] dark:text-[#E8A1B0] flex items-center gap-1 hover:underline"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit Period
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteSelectedPeriod}
                      className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 hover:underline"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                </div>
              ) : isSelectedPredicted ? (
                <p className="text-xs text-[#6B6470] dark:text-[#C8C1CD]">
                  Predicted period day based on your past rhythm.
                </p>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#6B6470] dark:text-[#C8C1CD]">No flow recorded</span>
                  <button
                    type="button"
                    onClick={() => { setEditingPeriod(null); setIsLogPeriodOpen(true); }}
                    className="text-xs font-bold text-[#573B50] dark:text-[#E8A1B0] hover:underline"
                  >
                    + Log Period
                  </button>
                </div>
              )}
            </div>

            {/* Check-in Details for this Date */}
            <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#573B50] dark:text-white flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-[#C46D82]" />
                  <span>Symptoms & Mood</span>
                </span>
                {selectedCheckinInfo?.mood && (
                  <span className="text-xs font-bold capitalize text-[#573B50] dark:text-white">
                    {selectedCheckinInfo.mood}
                  </span>
                )}
              </div>

              {selectedCheckinInfo ? (
                <div className="space-y-3">
                  {selectedCheckinInfo.symptoms && selectedCheckinInfo.symptoms.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedCheckinInfo.symptoms.map((s) => (
                        <span
                          key={s}
                          className="px-2 py-0.5 rounded-lg bg-white dark:bg-[#302A38] text-[11px] font-semibold border border-black/5 capitalize"
                        >
                          {s.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    {selectedCheckinInfo.energy_level && (
                      <span className="text-[#6B6470] dark:text-[#C8C1CD]">
                        Energy: <strong>{selectedCheckinInfo.energy_level}/5</strong>
                      </span>
                    )}
                    {selectedCheckinInfo.water_glasses && (
                      <span className="text-[#6B6470] dark:text-[#C8C1CD]">
                        Water: <strong>{selectedCheckinInfo.water_glasses} glasses</strong>
                      </span>
                    )}
                    {selectedCheckinInfo.sleep_hours && (
                      <span className="text-[#6B6470] dark:text-[#C8C1CD]">
                        Sleep: <strong>{selectedCheckinInfo.sleep_hours} hrs</strong>
                      </span>
                    )}
                  </div>

                  {selectedCheckinInfo.notes && (
                    <p className="text-xs italic text-[#6B6470] dark:text-[#C8C1CD] pt-1">
                      "{selectedCheckinInfo.notes}"
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsCheckinOpen(true)}
                    className="text-xs font-bold text-[#573B50] dark:text-[#E8A1B0] hover:underline block pt-1"
                  >
                    Edit Check-in →
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#6B6470] dark:text-[#C8C1CD]">No check-in recorded</span>
                  <button
                    type="button"
                    onClick={() => setIsCheckinOpen(true)}
                    className="text-xs font-bold text-[#573B50] dark:text-[#E8A1B0] hover:underline"
                  >
                    + Check in
                  </button>
                </div>
              )}
            </div>

            {/* Fertile / Ovulation window badge if enabled */}
            {isSelectedFertile && (
              <div className="p-3 rounded-xl bg-[#C9D8C0]/40 text-[#2F4228] dark:text-[#C9D8C0] text-xs font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>
                  {isSelectedFertile.is_ovulation ? 'Estimated Ovulation Day' : 'Estimated Fertile Window'} (Estimate only)
                </span>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-black/5 dark:border-white/10">
            <p className="text-[11px] text-[#6B6470] dark:text-[#C8C1CD] flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>Predictions are calculated dynamically from your stored cycles.</span>
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <LogPeriodModal
        isOpen={isLogPeriodOpen}
        onClose={() => setIsLogPeriodOpen(false)}
        onSaved={fetchCalendar}
        initialDate={selectedDate}
        existingPeriod={editingPeriod}
      />

      <CheckinModal
        isOpen={isCheckinOpen}
        onClose={() => setIsCheckinOpen(false)}
        onSaved={fetchCalendar}
        initialDate={selectedDate}
        existingCheckin={selectedCheckinInfo}
      />
    </div>
  )
}
