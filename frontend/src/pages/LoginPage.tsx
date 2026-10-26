import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { ArrowRight, Lock, Mail, AlertCircle } from 'lucide-react'

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const res = await api.login({ email, password })
      login(res.access_token, res.user)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md card-soft p-8 sm:p-10 border shadow-xl">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[#F6DCE3] dark:bg-[#302A38] text-[#573B50] dark:text-[#E8A1B0] flex items-center justify-center mx-auto mb-3 text-xl font-bold">
            🌙
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#573B50] dark:text-white">
            Welcome back
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6470] dark:text-[#C8C1CD] mt-1">
            Sign in to access your personal cycle records
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

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-[#573B50] dark:text-[#F7F3F6]">
                Password
              </label>
              <Link to="/forgot-password" className="text-xs font-semibold text-[#C46D82] dark:text-[#E8A1B0] hover:underline">
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#6B6470] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#26212C] text-sm focus:outline-none focus:ring-2 focus:ring-[#E8A1B0]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-[#E8A1B0] hover:bg-[#d88f9f] text-[#573B50] font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            <span>{isLoading ? 'Signing in...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-xs text-[#6B6470] dark:text-[#C8C1CD] mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-[#573B50] dark:text-white underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}
