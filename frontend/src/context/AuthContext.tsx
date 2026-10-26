import React, { createContext, useContext, useState, useEffect } from 'react'
import { User, UserPreferences } from '../types'
import { api } from '../services/api'
import i18n from '../i18n'

interface AuthContextType {
  user: User | null
  preferences: UserPreferences | null
  isAuthenticated: boolean
  isLoading: boolean
  isLocked: boolean
  theme: 'light' | 'dark'
  accent: 'blush' | 'lavender' | 'sage'
  language: 'en' | 'hi' | 'te'
  discreetMode: boolean
  login: (token: string, user: User) => void
  logout: () => void
  refreshUser: () => Promise<void>
  updatePreferencesState: (newPrefs: Partial<UserPreferences>) => void
  unlockApp: () => void
  lockApp: () => void
  setTheme: (theme: 'light' | 'dark') => void
  setAccent: (accent: 'blush' | 'lavender' | 'sage') => void
  setLanguage: (lang: 'en' | 'hi' | 'te') => void
  toggleDiscreetMode: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isLocked, setIsLocked] = useState<boolean>(false)

  // Visual preferences
  const [theme, setThemeState] = useState<'light' | 'dark'>((localStorage.getItem('lunaflow_theme') as any) || 'light')
  const [accent, setAccentState] = useState<'blush' | 'lavender' | 'sage'>((localStorage.getItem('lunaflow_accent') as any) || 'blush')
  const [language, setLanguageState] = useState<'en' | 'hi' | 'te'>((localStorage.getItem('lunaflow_lang') as any) || 'en')
  const [discreetMode, setDiscreetModeState] = useState<boolean>(localStorage.getItem('lunaflow_discreet') === 'true')

  // Apply theme & accent to DOM
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    root.setAttribute('data-accent', accent)
    localStorage.setItem('lunaflow_theme', theme)
    localStorage.setItem('lunaflow_accent', accent)
  }, [theme, accent])

  // Apply language
  useEffect(() => {
    i18n.changeLanguage(language)
    localStorage.setItem('lunaflow_lang', language)
  }, [language])

  // Apply discreet mode title
  useEffect(() => {
    if (discreetMode) {
      document.title = 'LF Rhythm'
    } else {
      document.title = 'LunaFlow — Your Cycle, Your Rhythm'
    }
    localStorage.setItem('lunaflow_discreet', String(discreetMode))
  }, [discreetMode])

  // Initial user load
  const loadUser = async () => {
    const token = localStorage.getItem('lunaflow_token')
    if (!token) {
      setIsLoading(false)
      return
    }

    try {
      const data = await api.getMe()
      setUser(data.user)
      if (data.user.preferences) {
        setPreferences(data.user.preferences)
        if (data.user.preferences.theme_preference) {
          setThemeState(data.user.preferences.theme_preference)
        }
        if (data.user.preferences.accent_theme) {
          setAccentState(data.user.preferences.accent_theme)
        }
        if (data.user.preferences.language) {
          setLanguageState(data.user.preferences.language)
        }
        if (typeof data.user.preferences.discreet_mode === 'boolean') {
          setDiscreetModeState(data.user.preferences.discreet_mode)
        }
        // If app lock is enabled, initially lock
        if (data.user.preferences.app_lock_enabled) {
          setIsLocked(true)
        }
      }
    } catch {
      localStorage.removeItem('lunaflow_token')
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadUser()

    const handleAuthError = () => {
      setUser(null)
      setPreferences(null)
    }
    window.addEventListener('lunaflow_auth_error', handleAuthError)
    return () => window.removeEventListener('lunaflow_auth_error', handleAuthError)
  }, [])

  const login = (token: string, loggedUser: User) => {
    localStorage.setItem('lunaflow_token', token)
    setUser(loggedUser)
    if (loggedUser.preferences) {
      setPreferences(loggedUser.preferences)
      if (loggedUser.preferences.theme_preference) setThemeState(loggedUser.preferences.theme_preference)
      if (loggedUser.preferences.accent_theme) setAccentState(loggedUser.preferences.accent_theme)
      if (loggedUser.preferences.language) setLanguageState(loggedUser.preferences.language)
      if (typeof loggedUser.preferences.discreet_mode === 'boolean') setDiscreetModeState(loggedUser.preferences.discreet_mode)
      if (loggedUser.preferences.app_lock_enabled) setIsLocked(true)
    }
  }

  const logout = () => {
    api.logout().catch(() => {})
    localStorage.removeItem('lunaflow_token')
    setUser(null)
    setPreferences(null)
    setIsLocked(false)
  }

  const refreshUser = async () => {
    try {
      const data = await api.getMe()
      setUser(data.user)
      if (data.user.preferences) {
        setPreferences(data.user.preferences)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const updatePreferencesState = (newPrefs: Partial<UserPreferences>) => {
    setPreferences((prev) => (prev ? { ...prev, ...newPrefs } : (newPrefs as UserPreferences)))
  }

  const unlockApp = () => setIsLocked(false)
  const lockApp = () => setIsLocked(true)

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme)
    if (user) {
      api.updateProfile({ theme_preference: newTheme }).catch(() => {})
    }
  }

  const setAccent = (newAccent: 'blush' | 'lavender' | 'sage') => {
    setAccentState(newAccent)
    if (user) {
      api.updateProfile({ accent_theme: newAccent }).catch(() => {})
    }
  }

  const setLanguage = (newLang: 'en' | 'hi' | 'te') => {
    setLanguageState(newLang)
    if (user) {
      api.updateProfile({ language: newLang }).catch(() => {})
    }
  }

  const toggleDiscreetMode = () => {
    const nextVal = !discreetMode
    setDiscreetModeState(nextVal)
    if (user) {
      api.updateProfile({ discreet_mode: nextVal }).catch(() => {})
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        preferences,
        isAuthenticated: !!user,
        isLoading,
        isLocked,
        theme,
        accent,
        language,
        discreetMode,
        login,
        logout,
        refreshUser,
        updatePreferencesState,
        unlockApp,
        lockApp,
        setTheme,
        setAccent,
        setLanguage,
        toggleDiscreetMode
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
