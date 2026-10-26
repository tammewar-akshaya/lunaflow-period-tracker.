import React, { useState } from 'react'
import { Lock, Delete, LogOut } from 'lucide-react'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'

export const AppLockModal: React.FC = () => {
  const { unlockApp, logout, discreetMode } = useAuth()
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)

  const handleDigit = (digit: string) => {
    if (pin.length < 6) {
      const nextPin = pin + digit
      setPin(nextPin)
      setError(null)
      if (nextPin.length >= 4) {
        // Auto-check PIN
        verifyPin(nextPin)
      }
    }
  }

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1))
    setError(null)
  }

  const verifyPin = async (pinToCheck: string) => {
    setIsVerifying(true)
    setError(null)
    try {
      const res = await api.verifyPin(pinToCheck)
      if (res.success) {
        unlockApp()
      } else {
        setError('Incorrect PIN. Please try again.')
        setPin('')
      }
    } catch {
      setError('Incorrect PIN.')
      setPin('')
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#FFF9F4]/90 dark:bg-[#1C1820]/95 backdrop-blur-xl p-4">
      <div className="w-full max-w-sm card-soft p-8 text-center border shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-[#F6DCE3] dark:bg-[#3A2D3C] text-[#573B50] dark:text-[#E8A1B0] flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-serif font-bold text-[#573B50] dark:text-white mb-1">
          {discreetMode ? 'Enter Security PIN' : 'LunaFlow is Locked'}
        </h2>
        <p className="text-sm text-[#6B6470] dark:text-[#C8C1CD] mb-6">
          Enter your 4-digit PIN to continue
        </p>

        {/* PIN Indicators */}
        <div className="flex justify-center gap-4 mb-6">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full border-2 transition-all ${
                idx < pin.length
                  ? 'bg-[#E8A1B0] border-[#E8A1B0] scale-110'
                  : 'border-[#6B6470]/30'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-xs text-rose-500 font-semibold mb-4 animate-shake">
            {error}
          </p>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto mb-6">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((key, i) => {
            if (key === '') return <div key={i} />
            if (key === 'del') {
              return (
                <button
                  key={i}
                  type="button"
                  onClick={handleDelete}
                  className="h-14 rounded-2xl flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all text-[#6B6470] dark:text-white"
                  aria-label="Delete last digit"
                >
                  <Delete className="w-6 h-6" />
                </button>
              )
            }
            return (
              <button
                key={i}
                type="button"
                disabled={isVerifying}
                onClick={() => handleDigit(key)}
                className="h-14 rounded-2xl bg-white/70 dark:bg-[#302A38] border border-black/5 dark:border-white/10 font-bold text-xl hover:bg-[#F6DCE3]/50 dark:hover:bg-[#43394E] active:scale-95 transition-all shadow-sm"
              >
                {key}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#6B6470] hover:text-[#573B50] dark:hover:text-white transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" /> Log out of account
        </button>
      </div>
    </div>
  )
}
