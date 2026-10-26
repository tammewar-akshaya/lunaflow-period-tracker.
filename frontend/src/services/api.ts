import { CalendarMonthData, CycleMetrics, DailyCheckin, JournalEntry, Period, User, UserPreferences } from '../types'

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('lunaflow_token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {})
  }

  const response = await fetch(url, { ...options, headers })

  if (response.status === 401) {
    // If unauthorized, clear invalid token and notify
    if (!endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
      localStorage.removeItem('lunaflow_token')
      window.dispatchEvent(new Event('lunaflow_auth_error'))
    }
  }

  if (!response.ok) {
    let errorMsg = 'An unexpected error occurred'
    try {
      const errJson = await response.json()
      errorMsg = errJson.error || errJson.message || errorMsg
    } catch {
      errorMsg = response.statusText || errorMsg
    }
    throw new Error(errorMsg)
  }

  return response.json()
}

export const api = {
  // Auth
  register: (data: Record<string, any>) => request<{ message: string; access_token: string; user: User; dev_verification_token?: string }>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) => request<{ message: string; access_token: string; user: User }>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request<{ user: User }>('/auth/me'),
  logout: () => request<{ message: string }>('/auth/logout', { method: 'POST' }),
  verifyEmail: (token: string, email: string) => request<{ message: string; user: User }>('/auth/verify-email', { method: 'POST', body: JSON.stringify({ token, email }) }),
  resendVerification: (email: string) => request<{ message: string; dev_verification_token?: string }>('/auth/resend-verification', { method: 'POST', body: JSON.stringify({ email }) }),
  forgotPassword: (email: string) => request<{ message: string; dev_reset_token?: string }>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (data: Record<string, string>) => request<{ message: string }>('/auth/reset-password', { method: 'POST', body: JSON.stringify(data) }),
  changePassword: (data: Record<string, string>) => request<{ message: string }>('/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),
  verifyPin: (pin: string) => request<{ success: boolean; message?: string }>('/auth/verify-pin', { method: 'POST', body: JSON.stringify({ pin }) }),

  // Periods
  getPeriods: () => request<{ periods: Period[] }>('/periods'),
  createPeriod: (data: Partial<Period>) => request<{ message: string; warning?: string; period: Period }>('/periods', { method: 'POST', body: JSON.stringify(data) }),
  getPeriod: (id: number) => request<{ period: Period }>(`/periods/${id}`),
  updatePeriod: (id: number, data: Partial<Period>) => request<{ message: string; period: Period }>(`/periods/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deletePeriod: (id: number) => request<{ message: string; deleted_period: Period }>(`/periods/${id}`, { method: 'DELETE' }),

  // Calendar & Cycle
  getCalendarMonth: (month?: string) => request<CalendarMonthData>(`/calendar${month ? `?month=${month}` : ''}`),
  getPredictions: () => request<{ metrics: CycleMetrics }>('/cycle/predictions'),
  getInsights: () => request<{ metrics: CycleMetrics; patterns: string[]; disclaimer: string }>('/cycle/insights'),

  // Check-ins
  getCheckin: (dateStr: string) => request<{ checkin: DailyCheckin | null }>(`/checkins?date=${dateStr}`),
  saveCheckin: (data: DailyCheckin) => request<{ message: string; checkin: DailyCheckin }>('/checkins', { method: 'POST', body: JSON.stringify(data) }),
  deleteCheckin: (id: number) => request<{ message: string }>(`/checkins/${id}`, { method: 'DELETE' }),

  // Journal
  getJournalEntries: () => request<{ entries: JournalEntry[] }>('/journal'),
  createJournalEntry: (data: { content: string; mood?: string; date?: string }) => request<{ message: string; entry: JournalEntry }>('/journal', { method: 'POST', body: JSON.stringify(data) }),
  updateJournalEntry: (id: number, data: Partial<JournalEntry>) => request<{ message: string; entry: JournalEntry }>(`/journal/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteJournalEntry: (id: number) => request<{ message: string }>(`/journal/${id}`, { method: 'DELETE' }),

  // Profile & Settings
  getProfile: () => request<{ user: User; preferences: UserPreferences }>('/profile'),
  updateProfile: (data: Partial<UserPreferences & { display_name?: string; app_lock_pin?: string }>) => request<{ message: string; user: User; preferences: UserPreferences }>('/profile', { method: 'PATCH', body: JSON.stringify(data) }),
  deleteAccount: (password: string) => request<{ message: string }>('/account', { method: 'DELETE', body: JSON.stringify({ password }) }),

  // Data Import & Export
  importCSV: (csvText: string, preview = false) => request<{ message?: string; imported_count?: number; preview?: boolean; valid_periods_count?: number; sample?: any[] }>(`/import?preview=${preview}`, {
    method: 'POST',
    body: JSON.stringify({ csv_text: csvText })
  }),

  exportJSON: async () => {
    const token = localStorage.getItem('lunaflow_token')
    const res = await fetch(`${BASE_URL}/export?format=json`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lunaflow_backup_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    window.URL.revokeObjectURL(url)
  },

  exportCSV: async () => {
    const token = localStorage.getItem('lunaflow_token')
    const res = await fetch(`${BASE_URL}/export?format=csv`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lunaflow_periods_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  },

  downloadDoctorPDF: async (fromDate?: string, toDate?: string) => {
    const token = localStorage.getItem('lunaflow_token')
    const params = new URLSearchParams()
    if (fromDate) params.set('from', fromDate)
    if (toDate) params.set('to', toDate)
    const queryString = params.toString() ? `?${params.toString()}` : ''

    const res = await fetch(`${BASE_URL}/report/pdf${queryString}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
    if (!res.ok) throw new Error('Failed to generate PDF report')
    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lunaflow_doctor_summary_${new Date().toISOString().slice(0, 10)}.pdf`
    a.click()
    window.URL.revokeObjectURL(url)
  }
}
