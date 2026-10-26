import React, { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts'
import {
  TrendingUp,
  Download,
  Calendar,
  Sparkles,
  FileText,
  AlertCircle,
  Clock,
  Droplet
} from 'lucide-react'
import { api } from '../services/api'
import { CycleMetrics, Period } from '../types'
import { Link } from 'react-router-dom'

export const InsightsPage: React.FC = () => {
  const [metrics, setMetrics] = useState<CycleMetrics | null>(null)
  const [patterns, setPatterns] = useState<string[]>([])
  const [periods, setPeriods] = useState<Period[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExportingPDF, setIsExportingPDF] = useState(false)
  const [pdfFromDate, setPdfFromDate] = useState('')
  const [pdfToDate, setPdfToDate] = useState('')
  const [error, setError] = useState<string | null>(null)

  const loadInsights = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [insightsRes, periodsRes] = await Promise.all([
        api.getInsights(),
        api.getPeriods()
      ])
      setMetrics(insightsRes.metrics)
      setPatterns(insightsRes.patterns || [])
      setPeriods(periodsRes.periods || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load insights.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadInsights()
  }, [])

  const handleDownloadPDF = async () => {
    setIsExportingPDF(true)
    try {
      await api.downloadDoctorPDF(pdfFromDate || undefined, pdfToDate || undefined)
    } catch (err: any) {
      alert(err.message || 'Could not generate PDF report.')
    } finally {
      setIsExportingPDF(false)
    }
  }

  // Prepare chart data for cycle lengths
  const sortedPeriods = [...periods].sort((a, b) => a.start_date.localeCompare(b.start_date))
  const chartData = []

  for (let i = 0; i < sortedPeriods.length - 1; i++) {
    const p1 = sortedPeriods[i]
    const p2 = sortedPeriods[i + 1]
    const d1 = new Date(p1.start_date)
    const d2 = new Date(p2.start_date)
    const diffDays = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays >= 15 && diffDays <= 60) {
      chartData.push({
        cycle: `Cycle ${i + 1}`,
        length: diffDays,
        date: p1.start_date
      })
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#573B50] dark:text-white flex items-center gap-2.5">
            <TrendingUp className="w-7 h-7 text-[#866ACF]" />
            <span>Cycle Insights & History</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6470] dark:text-[#C8C1CD] mt-0.5">
            Longitudinal trends, statistics, and pattern observations from your own records
          </p>
        </div>

        {/* Doctor Report PDF Export Modal / Trigger */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={isExportingPDF || periods.length === 0}
            className="px-4 py-2.5 rounded-2xl bg-[#573B50] hover:bg-[#432d3d] text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 disabled:opacity-40"
          >
            <Download className="w-4 h-4 text-[#E8A1B0]" />
            <span>{isExportingPDF ? 'Generating PDF...' : 'Download Doctor Report (PDF)'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary Averages Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="card-soft p-5 border">
          <span className="text-xs font-semibold text-[#6B6470] dark:text-[#C8C1CD] block">Average Cycle</span>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-[#573B50] dark:text-white mt-1">
            {metrics?.average_cycle_length || 28} <span className="text-xs font-sans font-normal">days</span>
          </div>
          <span className="text-[10px] text-[#6B6470] dark:text-[#C8C1CD]">Based on recorded history</span>
        </div>

        <div className="card-soft p-5 border">
          <span className="text-xs font-semibold text-[#6B6470] dark:text-[#C8C1CD] block">Average Duration</span>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-[#573B50] dark:text-white mt-1">
            {metrics?.average_period_duration || 5} <span className="text-xs font-sans font-normal">days</span>
          </div>
          <span className="text-[10px] text-[#6B6470] dark:text-[#C8C1CD]">Period bleeding duration</span>
        </div>

        <div className="card-soft p-5 border">
          <span className="text-xs font-semibold text-[#6B6470] dark:text-[#C8C1CD] block">Cycles Logged</span>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-[#573B50] dark:text-white mt-1">
            {periods.length} <span className="text-xs font-sans font-normal">periods</span>
          </div>
          <span className="text-[10px] text-[#6B6470] dark:text-[#C8C1CD]">Stored in database</span>
        </div>

        <div className="card-soft p-5 border">
          <span className="text-xs font-semibold text-[#6B6470] dark:text-[#C8C1CD] block">Cycle Variation</span>
          <div className="text-xl sm:text-2xl font-serif font-bold text-[#573B50] dark:text-white mt-1">
            {metrics?.cycle_variation_high ? 'Variable' : 'Consistent'}
          </div>
          <span className="text-[10px] text-[#6B6470] dark:text-[#C8C1CD]">Rhythm regularity</span>
        </div>
      </div>

      {/* Cycle Length Trend Chart */}
      <div className="card-soft p-6 sm:p-8 border shadow-sm mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-serif font-bold text-[#573B50] dark:text-white">
              Cycle Length Trends
            </h2>
            <p className="text-xs text-[#6B6470] dark:text-[#C8C1CD]">
              Days between consecutive period start dates
            </p>
          </div>
          <span className="text-xs font-bold text-[#C46D82] dark:text-[#E8A1B0]">
            Avg: {metrics?.average_cycle_length || 28}d
          </span>
        </div>

        {chartData.length > 0 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="cycle" stroke="#6B6470" fontSize={11} />
                <YAxis domain={['auto', 'auto']} stroke="#6B6470" fontSize={11} unit="d" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '14px',
                    border: '1px solid #E8A1B0',
                    fontSize: '12px'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="length"
                  name="Cycle Length (days)"
                  stroke="#E8A1B0"
                  strokeWidth={3}
                  dot={{ fill: '#573B50', r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-[#6B6470] dark:text-[#C8C1CD]">
            <Calendar className="w-10 h-10 text-[#E8A1B0]/50 mx-auto mb-2" />
            <p className="font-semibold text-sm text-[#573B50] dark:text-white mb-1">
              At least 2 recorded cycles are needed to render trend lines
            </p>
            <p>Once you record additional periods on the calendar, cycle lengths will graph here.</p>
          </div>
        )}
      </div>

      {/* Pattern Observations Card */}
      <div className="card-soft p-6 sm:p-8 border shadow-sm mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-[#866ACF]" />
          <h2 className="text-lg font-serif font-bold text-[#573B50] dark:text-white">
            Observed Rhythm Patterns
          </h2>
        </div>

        {patterns.length > 0 ? (
          <div className="space-y-3">
            {patterns.map((p, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 text-xs text-[#573B50] dark:text-white flex items-start gap-2.5"
              >
                <span className="text-base">🌸</span>
                <span className="leading-relaxed">{p}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#6B6470] dark:text-[#C8C1CD] leading-relaxed">
            As you log symptoms and moods across multiple cycles, LunaFlow will gently reflect recurring patterns (e.g. cramps appearing 1–2 days before flow). LunaFlow never diagnoses or assumes patterns without real data.
          </p>
        )}
      </div>

      {/* Complete Historical Period Table */}
      <div className="card-soft p-6 sm:p-8 border shadow-sm">
        <h2 className="text-lg font-serif font-bold text-[#573B50] dark:text-white mb-4">
          Recorded Periods Log
        </h2>

        {periods.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-black/10 dark:border-white/10 text-[#6B6470] dark:text-[#C8C1CD] font-bold">
                  <th className="pb-3">Start Date</th>
                  <th className="pb-3">End Date</th>
                  <th className="pb-3">Duration</th>
                  <th className="pb-3">Flow</th>
                  <th className="pb-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {periods.map((p) => {
                  const dur = p.end_date
                    ? Math.round((new Date(p.end_date).getTime() - new Date(p.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1
                    : 'Ongoing'
                  return (
                    <tr key={p.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                      <td className="py-3 font-semibold text-[#573B50] dark:text-white">
                        {p.start_date}
                      </td>
                      <td className="py-3 text-[#6B6470] dark:text-[#C8C1CD]">
                        {p.end_date || '—'}
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full bg-[#F6DCE3] dark:bg-[#302A38] text-[11px] font-bold text-[#573B50] dark:text-white">
                          {typeof dur === 'number' ? `${dur} days` : dur}
                        </span>
                      </td>
                      <td className="py-3 capitalize text-[#6B6470] dark:text-[#C8C1CD]">
                        {p.flow_intensity || 'medium'}
                      </td>
                      <td className="py-3 text-[#6B6470] dark:text-[#C8C1CD] italic">
                        {p.notes || '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-[#6B6470] dark:text-[#C8C1CD]">
            No periods recorded yet.{' '}
            <Link to="/calendar" className="text-[#573B50] dark:text-white font-bold underline">
              Open Calendar to record your first period
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
