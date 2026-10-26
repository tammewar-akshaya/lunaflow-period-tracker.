import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar,
  Heart,
  Droplet,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
  Activity,
  Smile,
  AlertCircle,
  Plus
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'
import { CycleMetrics, DailyCheckin } from '../types'
import { LogPeriodModal } from '../components/LogPeriodModal'
import { CheckinModal } from '../components/CheckinModal'
import { useTranslation } from 'react-i18next'

export const DashboardPage: React.FC = () => {
  const { user } = useAuth()
  const { t } = useTranslation()

  const [metrics, setMetrics] = useState<CycleMetrics | null>(null)
  const [todayCheckin, setTodayCheckin] = useState<DailyCheckin | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modals
  const [isLogPeriodOpen, setIsLogPeriodOpen] = useState(false)
  const [isCheckinOpen, setIsCheckinOpen] = useState(false)

  const todayStr = new Date().toISOString().slice(0, 10)

  const loadDashboardData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [predRes, checkinRes] = await Promise.all([
        api.getPredictions(),
        api.getCheckin(todayStr)
      ])
      setMetrics(predRes.metrics)
      setTodayCheckin(checkinRes.checkin)
    } catch (err: any) {
      setError(err.message || 'Could not load dashboard data.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  const phaseColors: Record<string, { bg: string; text: string; icon: string }> = {
    Menstrual: { bg: 'bg-[#F6DCE3] dark:bg-[#452735]', text: 'text-[#C46D82] dark:text-[#F6DCE3]', icon: '🌸' },
    Follicular: { bg: 'bg-[#E8E1F7] dark:bg-[#322A42]', text: 'text-[#866ACF] dark:text-[#E8E1F7]', icon: '🌱' },
    Ovulation: { bg: 'bg-[#C9D8C0] dark:bg-[#253A20]', text: 'text-[#3E5D32] dark:text-[#C9D8C0]', icon: '✨' },
    Luteal: { bg: 'bg-[#FFF0DB] dark:bg-[#3D3025]', text: 'text-[#B2702E] dark:text-[#FFF0DB]', icon: '🍂' }
  }

  const currentPhaseStyle = metrics?.current_phase ? phaseColors[metrics.current_phase] || phaseColors.Menstrual : phaseColors.Menstrual

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-10">
      {/* Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-4xl font-serif font-bold text-[#573B50] dark:text-white">
            Hello, {user?.display_name || 'Friend'} 🌷
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6470] dark:text-[#C8C1CD] mt-1">
            Take a moment for yourself today. Here is your body rhythm overview.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsLogPeriodOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-[#E8A1B0] hover:bg-[#d88f9f] text-[#573B50] font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-1.5"
          >
            <Droplet className="w-4 h-4" />
            <span>Log Period</span>
          </button>
          <button
            type="button"
            onClick={() => setIsCheckinOpen(true)}
            className="px-4 py-2.5 rounded-2xl card-soft text-[#573B50] dark:text-white font-semibold text-xs sm:text-sm hover:bg-black/5 dark:hover:bg-white/5 transition-all flex items-center gap-1.5"
          >
            <Heart className="w-4 h-4 text-[#C46D82]" />
            <span>Record Symptoms</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Irregularity Notice if cycle variance is high */}
      {metrics?.irregularity_notice && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-center gap-3 text-xs text-amber-800 dark:text-amber-200">
          <span className="text-lg">🌿</span>
          <div>
            <strong>Gentle Rhythm Note:</strong> {metrics.irregularity_notice}
          </div>
        </div>
      )}

      {/* Primary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Card A: Current Cycle Phase */}
        <div className="card-soft p-6 sm:p-7 border shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-[#6B6470] dark:text-[#C8C1CD] uppercase tracking-wider">
                Current Cycle
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${currentPhaseStyle.bg} ${currentPhaseStyle.text}`}>
                <span>{currentPhaseStyle.icon}</span>
                <span>{metrics?.current_phase || 'Menstrual'} Phase</span>
              </span>
            </div>

            <div className="mb-4">
              <div className="text-3xl sm:text-4xl font-serif font-extrabold text-[#573B50] dark:text-white">
                Cycle Day {metrics?.current_cycle_day || 1}
              </div>
              <p className="text-xs text-[#6B6470] dark:text-[#C8C1CD] mt-1">
                {metrics?.last_period
                  ? `Last period started on ${metrics.last_period.start_date}`
                  : 'No period recorded yet'}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-black/5 dark:border-white/10 flex items-center justify-between text-xs">
            <span className="text-[#6B6470] dark:text-[#C8C1CD]">Recorded Cycles:</span>
            <strong className="text-[#573B50] dark:text-white font-bold">{metrics?.total_periods_logged || 0}</strong>
          </div>
        </div>

        {/* Card B: Next Period Prediction */}
        <div className="card-soft p-6 sm:p-7 border shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-[#6B6470] dark:text-[#C8C1CD] uppercase tracking-wider">
                Next Period Estimate
              </span>
              <Sparkles className="w-4 h-4 text-[#E8A1B0]" />
            </div>

            {metrics?.next_predicted_start ? (
              <div className="mb-4">
                <div className="text-2xl sm:text-3xl font-serif font-bold text-[#C46D82] dark:text-[#E8A1B0]">
                  {new Date(metrics.next_predicted_start + 'T00:00:00').toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
                <p className="text-xs text-[#6B6470] dark:text-[#C8C1CD] mt-1.5 leading-relaxed">
                  Estimated based on your average {metrics.average_cycle_length}-day cycle length.
                </p>
              </div>
            ) : (
              <div className="mb-4">
                <div className="text-xl font-serif font-bold text-[#573B50] dark:text-white">
                  More data needed
                </div>
                <p className="text-xs text-[#6B6470] dark:text-[#C8C1CD] mt-1.5 leading-relaxed">
                  Log your first period to receive automatic cycle predictions.
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-black/5 dark:border-white/10 text-[11px] text-[#6B6470] dark:text-[#C8C1CD]">
            Predictions are estimates and never replace medical guidance.
          </div>
        </div>

        {/* Card C: Today's Check-in Summary */}
        <div className="card-soft p-6 sm:p-7 border shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-[#6B6470] dark:text-[#C8C1CD] uppercase tracking-wider">
                Today's Check-in
              </span>
              <Heart className="w-4 h-4 text-[#C46D82]" />
            </div>

            {todayCheckin ? (
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm">Mood:</span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-[#E8E1F7] dark:bg-[#302A38] text-xs font-bold capitalize text-[#573B50] dark:text-white">
                    {todayCheckin.mood || 'Not recorded'}
                  </span>
                </div>
                <div className="text-xs text-[#6B6470] dark:text-[#C8C1CD]">
                  Symptoms:{' '}
                  {todayCheckin.symptoms && todayCheckin.symptoms.length > 0
                    ? todayCheckin.symptoms.map(s => s.replace('_', ' ')).join(', ')
                    : 'None logged'}
                </div>
                <div className="flex gap-4 text-xs pt-1 text-[#6B6470] dark:text-[#C8C1CD]">
                  <span>Water: <strong>{todayCheckin.water_glasses || 0} gls</strong></span>
                  <span>Sleep: <strong>{todayCheckin.sleep_hours || 0} hrs</strong></span>
                  <span>Energy: <strong>{todayCheckin.energy_level || 3}/5</strong></span>
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <p className="text-xs text-[#6B6470] dark:text-[#C8C1CD] leading-relaxed">
                  You haven't logged your physical wellness or mood today yet.
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsCheckinOpen(true)}
            className="w-full py-2 rounded-xl border border-black/10 dark:border-white/10 text-xs font-bold hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-center"
          >
            {todayCheckin ? 'Update Today\'s Log' : '+ Check in Today'}
          </button>
        </div>
      </div>

      {/* Phase Care Tip & Self-Care Recommendation */}
      <div className="card-soft p-6 sm:p-8 border shadow-sm mb-8 bg-gradient-to-r from-[#FFF9F4] via-[#FDF4EC] to-[#F6DCE3]/30 dark:from-[#26212C] dark:to-[#352B3A]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#E8A1B0]/20 flex items-center justify-center text-2xl shrink-0">
              🌿
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#C46D82] dark:text-[#E8A1B0] block">
                {metrics?.current_phase || 'Wellness'} Phase Care Suggestion
              </span>
              <p className="text-sm font-medium text-[#573B50] dark:text-[#F7F3F6] mt-1 max-w-2xl leading-relaxed">
                {metrics?.phase_tips || 'Listen to your body rhythm. Prioritize balanced nutrition, calm breaths, and restorative rest.'}
              </p>
            </div>
          </div>

          <Link
            to="/calendar"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-[#302A38] text-xs font-bold text-[#573B50] dark:text-white shadow-sm hover:scale-[1.02] transition-transform shrink-0"
          >
            <span>Open Calendar</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Quick Actions & Navigation Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <Link
          to="/calendar"
          className="card-soft p-5 border text-center hover:-translate-y-1 transition-all group"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#F6DCE3] dark:bg-[#302A38] text-[#573B50] dark:text-[#E8A1B0] flex items-center justify-center mx-auto mb-2.5 group-hover:scale-110 transition-transform">
            <Calendar className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-[#573B50] dark:text-white block">Interactive Calendar</span>
          <span className="text-[10px] text-[#6B6470] dark:text-[#C8C1CD]">View monthly flow</span>
        </Link>

        <Link
          to="/insights"
          className="card-soft p-5 border text-center hover:-translate-y-1 transition-all group"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#E8E1F7] dark:bg-[#302A38] text-[#573B50] dark:text-[#B29FE8] flex items-center justify-center mx-auto mb-2.5 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-[#573B50] dark:text-white block">History & Insights</span>
          <span className="text-[10px] text-[#6B6470] dark:text-[#C8C1CD]">Averages & charts</span>
        </Link>

        <Link
          to="/journal"
          className="card-soft p-5 border text-center hover:-translate-y-1 transition-all group"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#C9D8C0] dark:bg-[#302A38] text-[#2F4228] dark:text-[#C9D8C0] flex items-center justify-center mx-auto mb-2.5 group-hover:scale-110 transition-transform">
            <Heart className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-[#573B50] dark:text-white block">Private Journal</span>
          <span className="text-[10px] text-[#6B6470] dark:text-[#C8C1CD]">Personal notes</span>
        </Link>

        <Link
          to="/settings"
          className="card-soft p-5 border text-center hover:-translate-y-1 transition-all group"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#FFF0DB] dark:bg-[#302A38] text-[#B2702E] dark:text-[#FFF0DB] flex items-center justify-center mx-auto mb-2.5 group-hover:scale-110 transition-transform">
            <Clock className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-[#573B50] dark:text-white block">Settings & Privacy</span>
          <span className="text-[10px] text-[#6B6470] dark:text-[#C8C1CD]">Export & PIN lock</span>
        </Link>
      </div>

      {/* Modals */}
      <LogPeriodModal
        isOpen={isLogPeriodOpen}
        onClose={() => setIsLogPeriodOpen(false)}
        onSaved={loadDashboardData}
      />

      <CheckinModal
        isOpen={isCheckinOpen}
        onClose={() => setIsCheckinOpen(false)}
        onSaved={loadDashboardData}
        initialDate={todayStr}
        existingCheckin={todayCheckin}
      />
    </div>
  )
}
