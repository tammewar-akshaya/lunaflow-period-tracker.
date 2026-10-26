import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Calendar, BarChart2, BookOpen, Settings } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'

export const BottomNav: React.FC = () => {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  const { t } = useTranslation()

  if (!isAuthenticated) return null

  const items = [
    { to: '/dashboard', label: t('nav.home'), icon: Home },
    { to: '/calendar', label: t('nav.calendar'), icon: Calendar },
    { to: '/insights', label: t('nav.insights'), icon: BarChart2 },
    { to: '/journal', label: t('nav.journal'), icon: BookOpen },
    { to: '/settings', label: t('nav.settings'), icon: Settings }
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-bottom-nav px-2 py-1.5 transition-all">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {items.map((item) => {
          const active = location.pathname === item.to
          const Icon = item.icon
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
                active
                  ? 'text-[#573B50] dark:text-[#E8A1B0] font-bold scale-105'
                  : 'text-[#6B6470] dark:text-[#C8C1CD] hover:text-[#573B50]'
              }`}
            >
              <div className={`p-1 rounded-xl transition-colors ${active ? 'bg-[#F6DCE3] dark:bg-[#302A38]' : ''}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
