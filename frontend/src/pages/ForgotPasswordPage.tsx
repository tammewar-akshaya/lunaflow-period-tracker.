import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { Mail, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react'

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [devToken, setDevToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setStatus(null)
    setIsLoading(true)

    try {
      const res = await api.forgotPassword(email)
      setStatus(res.message || 'Password reset link sent to your email.')
      if (res.dev_reset_token) {
        setDevToken(res.dev_reset_token)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to request reset.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md card-soft p-8 sm:p-10 border shadow-xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-serif font-bold text-[#573B50] dark:text-white mb-2">
            Reset password
          </h1>
          <p className="text-xs text-[#6B6470] dark:text-[#C8C1CD]">
            Enter your email to receive password reset instructions
          </p>
        </div>

        {status && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-800 dark:text-emerald-300">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{status}</span>
            </div>
            {devToken && (
              <div className="mt-2 pt-2 border-t border-emerald-200 dark:border-emerald-900/40">
                <p className="font-mono text-[11px] mb-2">Dev token: {devToken}</p>
                <Link
                  to={`/reset-password?token=${devToken}&email=${encodeURIComponent(email)}`}
                  className="font-bold underline text-[#573B50] dark:text-white"
                >
                  Proceed to Reset Form →
                </Link>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#26212C] text-sm focus:outline-none focus:ring-2 focus:ring-[#E8A1B0]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-[#E8A1B0] hover:bg-[#d88f9f] text-[#573B50] font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{isLoading ? 'Sending...' : 'Send Reset Link'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-xs text-[#6B6470] dark:text-[#C8C1CD] mt-6">
          Remember your password?{' '}
          <Link to="/login" className="font-bold text-[#573B50] dark:text-white underline">
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}
