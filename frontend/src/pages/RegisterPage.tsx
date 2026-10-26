import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { ArrowRight, User as UserIcon, Mail, Lock, AlertCircle, Sparkles } from 'lucide-react'

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [typicalCycleLength, setTypicalCycleLength] = useState(28)
  const [typicalPeriodDuration, setTypicalPeriodDuration] = useState(5)
  const [cycleRegularity, setCycleRegularity] = useState<'regular' | 'irregular' | 'unknown'>('regular')
  const [privacyAgreed, setPrivacyAgreed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (!privacyAgreed) {
      setError('Please agree to the Privacy Policy to proceed.')
      return
    }

    setIsLoading(true)

    try {
      const res = await api.register({
        display_name: displayName,
        email,
        password,
        confirm_password: confirmPassword,
        privacy_policy_agreed: privacyAgreed,
        typical_cycle_length: typicalCycleLength,
        typical_period_duration: typicalPeriodDuration,
        cycle_regularity: cycleRegularity
      })

      login(res.access_token, res.user)

      // Direct to verification prompt with dev token convenience
      navigate(`/verify-email?email=${encodeURIComponent(email)}`)
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg card-soft p-8 sm:p-10 border shadow-xl">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#F6DCE3] dark:bg-[#302A38] text-[#573B50] dark:text-[#E8A1B0] flex items-center justify-center mx-auto mb-3 text-xl font-bold">
            🌸
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#573B50] dark:text-white">
            Begin your LunaFlow journey
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6470] dark:text-[#C8C1CD] mt-1">
            Private, secure, and personalized to your rhythm
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#573B50] dark:text-[#F7F3F6] mb-1.5">
              Preferred Name
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-[#6B6470] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Maya"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#26212C] text-sm focus:outline-none focus:ring-2 focus:ring-[#E8A1B0]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#573B50] dark:text-[#F7F3F6] mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#6B6470] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="maya@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#26212C] text-sm focus:outline-none focus:ring-2 focus:ring-[#E8A1B0]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#573B50] dark:text-[#F7F3F6] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#6B6470] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 chars"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#26212C] text-sm focus:outline-none focus:ring-2 focus:ring-[#E8A1B0]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#573B50] dark:text-[#F7F3F6] mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#6B6470] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#26212C] text-sm focus:outline-none focus:ring-2 focus:ring-[#E8A1B0]"
                />
              </div>
            </div>
          </div>

          {/* Optional Onboarding Toggle */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowOnboarding(!showOnboarding)}
              className="text-xs font-semibold text-[#573B50] dark:text-[#E8A1B0] flex items-center gap-1.5 hover:underline"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{showOnboarding ? 'Hide cycle baseline setup' : 'Set cycle baseline (optional)'}</span>
            </button>

            {showOnboarding && (
              <div className="mt-3 p-4 rounded-2xl bg-black/5 dark:bg-white/5 space-y-3 border border-black/5 dark:border-white/5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Typical cycle (days)</label>
                    <input
                      type="number"
                      min="15"
                      max="60"
                      value={typicalCycleLength}
                      onChange={(e) => setTypicalCycleLength(Number(e.target.value))}
                      className="w-full p-2 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-[#26212C]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Period duration (days)</label>
                    <input
                      type="number"
                      min="1"
                      max="14"
                      value={typicalPeriodDuration}
                      onChange={(e) => setTypicalPeriodDuration(Number(e.target.value))}
                      className="w-full p-2 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-[#26212C]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Cycle regularity</label>
                  <select
                    value={cycleRegularity}
                    onChange={(e: any) => setCycleRegularity(e.target.value)}
                    className="w-full p-2 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-[#26212C]"
                  >
                    <option value="regular">Regular (mostly predictable)</option>
                    <option value="irregular">Irregular (dates vary often)</option>
                    <option value="unknown">I'm not sure yet</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 flex items-start gap-2.5">
            <input
              type="checkbox"
              id="privacy"
              required
              checked={privacyAgreed}
              onChange={(e) => setPrivacyAgreed(e.target.checked)}
              className="mt-0.5 rounded border-black/20 text-[#E8A1B0] focus:ring-[#E8A1B0]"
            />
            <label htmlFor="privacy" className="text-xs text-[#6B6470] dark:text-[#C8C1CD]">
              I agree to the{' '}
              <Link to="/privacy" target="_blank" className="underline font-semibold text-[#573B50] dark:text-white">
                Privacy Policy
              </Link>
              . LunaFlow does not sell personal health data.
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-[#E8A1B0] hover:bg-[#d88f9f] text-[#573B50] font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
          >
            <span>{isLoading ? 'Creating account...' : 'Create LunaFlow Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-xs text-[#6B6470] dark:text-[#C8C1CD] mt-6">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-[#573B50] dark:text-white underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
