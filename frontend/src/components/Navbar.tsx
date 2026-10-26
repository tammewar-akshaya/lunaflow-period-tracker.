import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Moon, Sun, Eye, EyeOff, Globe, Sparkles, LogOut, Lock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, theme, setTheme, accent, setAccent, language, setLanguage, discreetMode, toggleDiscreetMode, lockApp } = useAuth()
  const location = useLocation()
  const { t } = useTranslation()
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const [themeMenuOpen, setThemeMenuOpen] = useState(false)

  const navLinks = [
    { to: '/dashboard', label: t('nav.home') },
    { to: '/calendar', label: t('nav.calendar') },
    { to: '/insights', label: t('nav.insights') },
    { to: '/journal', label: t('nav.journal') },
    { to: '/settings', label: t('nav.settings') }
  ]

  return (
    <header className="sticky top-0 z-40 w-full glass-nav px-4 sm:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#E8A1B0] to-[#F6DCE3] dark:from-[#7A4254] dark:to-[#573B50] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <span className="text-lg">🌙</span>
          </div>
          <div>
            <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#573B50] dark:text-[#F7F3F6]">
              {discreetMode ? t('app.discreetName') : t('app.name')}
            </span>
            {!discreetMode && (
              <span className="hidden sm:inline-block ml-2 text-xs font-medium text-[#6B6470] dark:text-[#C8C1CD]">
                {t('app.tagline')}
              </span>
            )}
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        {isAuthenticated && (
          <nav className="hidden md:flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-2xl border border-black/5 dark:border-white/5">
            {navLinks.map((link) => {
              const active = location.pathname === link.to
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                    active
                      ? 'bg-white dark:bg-[#302A38] text-[#573B50] dark:text-white shadow-sm'
                      : 'text-[#6B6470] dark:text-[#C8C1CD] hover:text-[#573B50] dark:hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Discreet Mode Toggle */}
          <button
            type="button"
            onClick={toggleDiscreetMode}
            title={discreetMode ? 'Disable Discreet Mode' : 'Enable Discreet Mode (neutral title/styling)'}
            className={`p-2 rounded-xl transition-all ${
              discreetMode
                ? 'bg-[#E8A1B0]/30 text-[#573B50] dark:text-white'
                : 'hover:bg-black/5 dark:hover:bg-white/5 text-[#6B6470] dark:text-[#C8C1CD]'
            }`}
          >
            {discreetMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

          {/* Theme & Accent Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setThemeMenuOpen(!themeMenuOpen)}
              title="Theme and Accents"
              className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-[#6B6470] dark:text-[#C8C1CD] transition-colors"
            >
              {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {themeMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 card-soft p-3 shadow-xl z-50 text-xs">
                <div className="font-bold text-[#573B50] dark:text-white mb-2">Display Theme</div>
                <div className="grid grid-cols-2 gap-1.5 mb-3">
                  <button
                    onClick={() => { setTheme('light'); setThemeMenuOpen(false); }}
                    className={`py-1.5 px-2 rounded-lg font-medium border flex items-center justify-center gap-1 ${
                      theme === 'light' ? 'bg-[#F6DCE3] border-[#E8A1B0] text-[#573B50]' : 'border-transparent'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" /> Light
                  </button>
                  <button
                    onClick={() => { setTheme('dark'); setThemeMenuOpen(false); }}
                    className={`py-1.5 px-2 rounded-lg font-medium border flex items-center justify-center gap-1 ${
                      theme === 'dark' ? 'bg-[#302A38] border-white/20 text-white' : 'border-transparent'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" /> Dark
                  </button>
                </div>

                <div className="font-bold text-[#573B50] dark:text-white mb-1.5">Accent Color</div>
                <div className="flex gap-2">
                  {(['blush', 'lavender', 'sage'] as const).map((acc) => (
                    <button
                      key={acc}
                      onClick={() => { setAccent(acc); setThemeMenuOpen(false); }}
                      className={`flex-1 py-1 rounded-lg capitalize text-center text-[11px] font-semibold transition-all ${
                        accent === acc ? 'ring-2 ring-offset-1 ring-[#573B50] dark:ring-white font-bold' : 'opacity-70'
                      }`}
                      style={{
                        backgroundColor: acc === 'blush' ? '#F6DCE3' : acc === 'lavender' ? '#E8E1F7' : '#C9D8C0',
                        color: '#573B50'
                      }}
                    >
                      {acc}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Language Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-[#6B6470] dark:text-[#C8C1CD] transition-colors flex items-center gap-1 text-xs font-semibold"
            >
              <Globe className="w-4 h-4" />
              <span className="uppercase">{language}</span>
            </button>

            {langMenuOpen && (
              <div className="absolute right-0 mt-2 w-32 card-soft p-1.5 shadow-xl z-50 text-xs">
                {[
                  { code: 'en', label: 'English' },
                  { code: 'hi', label: 'हिन्दी' },
                  { code: 'te', label: 'తెలుగు' }
                ].map((item) => (
                  <button
                    key={item.code}
                    onClick={() => { setLanguage(item.code as any); setLangMenuOpen(false); }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      language === item.code ? 'bg-[#F6DCE3] dark:bg-[#302A38] text-[#573B50] dark:text-white font-bold' : 'hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User actions */}
          {isAuthenticated ? (
            <div className="flex items-center gap-1.5 pl-2 border-l border-black/10 dark:border-white/10">
              {user?.preferences?.has_pin && (
                <button
                  type="button"
                  onClick={lockApp}
                  title="Lock LunaFlow now"
                  className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-[#6B6470] dark:text-[#C8C1CD]"
                >
                  <Lock className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={logout}
                title="Log out"
                className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-rose-500 hover:text-rose-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-1.5 text-sm font-semibold text-[#573B50] dark:text-white hover:opacity-80 transition-opacity"
              >
                {t('nav.login')}
              </Link>
              <Link
                to="/register"
                className="px-4 py-1.5 text-sm font-bold bg-[#E8A1B0] hover:bg-[#d88f9f] text-[#573B50] rounded-xl shadow-sm transition-all"
              >
                {t('nav.register')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
