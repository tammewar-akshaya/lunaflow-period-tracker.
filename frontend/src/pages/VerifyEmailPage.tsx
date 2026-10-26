import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { CheckCircle2, Mail, RefreshCw, AlertCircle, ArrowRight } from 'lucide-react'

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, refreshUser } = useAuth()

  const [token, setToken] = useState(searchParams.get('token') || '')
  const [email, setEmail] = useState(searchParams.get('email') || user?.email || '')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)
  const [resendStatus, setResendStatus] = useState<string | null>(null)

  const verifyToken = async (tokenToUse: string, emailToUse: string) => {
    if (!tokenToUse || !emailToUse) return
    setStatus('loading')
    setMessage(null)

    try {
      const res = await api.verifyEmail(tokenToUse, emailToUse)
      setStatus('success')
      setMessage(res.message || 'Email verified successfully!')
      await refreshUser()
      setTimeout(() => navigate('/dashboard'), 2000)
    } catch (err: any) {
      setStatus('error')
      setMessage(err.message || 'Verification failed. The link may have expired.')
    }
  }

  useEffect(() => {
    const qToken = searchParams.get('token')
    const qEmail = searchParams.get('email')
    if (qToken && qEmail) {
      verifyToken(qToken, qEmail)
    }
  }, [searchParams])

  const handleResend = async () => {
    if (!email) return
    setResendStatus('Resending verification email...')
    try {
      const res = await api.resendVerification(email)
      setResendStatus(res.message || 'Verification link sent!')
      if (res.dev_verification_token) {
        setToken(res.dev_verification_token)
      }
    } catch (err: any) {
      setResendStatus(err.message || 'Could not resend email.')
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md card-soft p-8 sm:p-10 border shadow-xl text-center">
        <div className="w-16 h-16 rounded-full bg-[#F6DCE3] dark:bg-[#302A38] text-[#573B50] dark:text-[#E8A1B0] flex items-center justify-center mx-auto mb-5">
          <Mail className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-serif font-bold text-[#573B50] dark:text-white mb-2">
          Verify your email
        </h1>
        <p className="text-xs sm:text-sm text-[#6B6470] dark:text-[#C8C1CD] mb-6">
          We sent a verification link to <br />
          <strong className="text-[#573B50] dark:text-white">{email || 'your email'}</strong>
        </p>

        {status === 'success' && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-center gap-2 mb-6">
            <CheckCircle2 className="w-5 h-5" />
            <span>{message} Redirecting to your dashboard...</span>
          </div>
        )}

        {status === 'error' && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 text-xs flex items-center justify-center gap-2 mb-6">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        <div className="space-y-3 mb-6">
          <div>
            <input
              type="text"
              placeholder="Paste verification token here"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full text-center px-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#26212C] text-xs font-mono"
            />
          </div>

          <button
            type="button"
            disabled={!token || status === 'loading'}
            onClick={() => verifyToken(token, email)}
            className="w-full py-2.5 rounded-xl bg-[#E8A1B0] hover:bg-[#d88f9f] text-[#573B50] font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{status === 'loading' ? 'Verifying...' : 'Confirm Verification'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="pt-4 border-t border-black/5 dark:border-white/10 flex flex-col gap-3">
          <button
            type="button"
            onClick={handleResend}
            className="text-xs font-semibold text-[#573B50] dark:text-[#E8A1B0] hover:underline flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Resend verification email</span>
          </button>
          {resendStatus && (
            <p className="text-[11px] text-[#6B6470] dark:text-[#C8C1CD]">{resendStatus}</p>
          )}

          <Link
            to="/dashboard"
            className="text-xs text-[#6B6470] dark:text-[#C8C1CD] hover:underline pt-2"
          >
            Skip for now & go to Dashboard →
          </Link>
        </div>
      </div>
    </div>
  )
}
