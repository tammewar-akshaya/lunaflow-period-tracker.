export type FlowIntensity = 'spotting' | 'light' | 'medium' | 'heavy'

export type CyclePhase = 'Menstrual' | 'Follicular' | 'Ovulation' | 'Luteal'

export interface UserPreferences {
  typical_cycle_length: number
  typical_period_duration: number
  cycle_regularity: 'regular' | 'irregular' | 'unknown'
  prediction_enabled: boolean
  fertile_window_enabled: boolean
  reminder_preferences: {
    period_reminder?: boolean
    period_days_before?: number
    daily_checkin?: boolean
    checkin_time?: string
    journal_reminder?: boolean
    push_enabled?: boolean
    email_enabled?: boolean
  }
  theme_preference: 'light' | 'dark'
  accent_theme: 'blush' | 'lavender' | 'sage'
  language: 'en' | 'hi' | 'te'
  discreet_mode: boolean
  app_lock_enabled: boolean
  has_pin: boolean
}

export interface User {
  id: number
  display_name: string
  email: string
  email_verified: boolean
  created_at: string
  preferences?: UserPreferences
}

export interface Period {
  id: number
  user_id: number
  start_date: string // YYYY-MM-DD
  end_date: string | null // YYYY-MM-DD
  flow_intensity?: FlowIntensity
  duration?: number
  notes?: string | null
  created_at?: string
}

export interface DailyCheckin {
  id?: number
  user_id?: number
  date: string // YYYY-MM-DD
  flow_intensity?: FlowIntensity | null
  symptoms: string[]
  mood?: string | null
  energy_level?: number | null // 1-5
  sleep_quality?: string | null
  sleep_hours?: number | null
  water_glasses?: number | null
  exercise?: {
    minutes?: number
    type?: string
  } | null
  notes?: string | null
  created_at?: string
}

export interface JournalEntry {
  id: number
  user_id: number
  date: string // YYYY-MM-DD
  mood?: string | null
  content: string
  created_at?: string
  updated_at?: string
}

export interface FertileWindowInfo {
  ovulation_date: string
  fertile_start: string
  fertile_end: string
  disclaimer: string
}

export interface CycleMetrics {
  has_enough_data: boolean
  message: string | null
  average_cycle_length: number
  average_period_duration: number
  cycle_lengths_history?: number[]
  cycle_variation_high: boolean
  irregularity_notice: string | null
  last_period: {
    id: number
    start_date: string
    end_date: string | null
    duration: number
  } | null
  next_predicted_start: string | null
  next_predicted_end: string | null
  fertile_window: FertileWindowInfo | null
  current_cycle_day: number | null
  current_phase: CyclePhase | null
  phase_tips: string
  total_periods_logged: number
}

export interface CalendarMonthData {
  year: number
  month: number
  num_days: number
  first_day_weekday: number
  period_days: Record<string, {
    period_id: number
    flow_intensity: FlowIntensity
    is_start: boolean
    is_end: boolean
    notes?: string
  }>
  predicted_days: Record<string, {
    is_predicted: boolean
    is_start: boolean
    is_end: boolean
  }>
  fertile_days: Record<string, {
    is_ovulation: boolean
  }>
  checkins: Record<string, DailyCheckin>
  cycle_metrics: CycleMetrics
}
