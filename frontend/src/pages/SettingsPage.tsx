import React, { useState, useEffect } from 'react'
import {
  Settings,
  User as UserIcon,
  Moon,
  Sun,
  Lock,
  Eye,
  EyeOff,
  Globe,
  Bell,
  Download,
  Upload,
  Trash2,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'

export const SettingsPage: React.FC = () => {
  const {
    user,
    preferences,
    refreshUser,
    theme,
    setTheme,
    accent,
    setAccent,
    language,
    setLanguage,
    discreetMode,
    toggleDiscreetMode,
    logout
  } = useAuth()

  // Profile fields
  const [displayName, setDisplayName] = useState(user?.display_name || '')
  const [typicalCycle, setTypicalCycle] = useState(preferences?.typical_cycle_length || 28)
  const [typicalDuration, setTypicalDuration] = useState(preferences?.typical_period_duration || 5)
  const [predictionEnabled, setPredictionEnabled] = useState(preferences?.prediction_enabled ?? true)
  const [fertileEnabled, setFertileEnabled] = useState(preferences?.fertile_window_enabled ?? false)

  // App Lock PIN setup
  const [appLockEnabled, setAppLockEnabled] = useState(preferences?.app_lock_enabled ?? false)
  const [newPin, setNewPin] = useState('')
  const [pinMessage, setPinMessage] = useState<string | null>(null)

  // Change Password fields
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  // CSV Import state
  const [csvText, setCsvText] = useState('')
  const [importPreview, setImportPreview] = useState<any | null>(null)
  const [importStatus, setImportStatus] = useState<string | null>(null)

  // Delete Account
  const [deletePassword, setDeletePassword] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Save feedback
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    if (user) setDisplayName(user.display_name)
    if (preferences) {
      setTypicalCycle(preferences.typical_cycle_length)
      setTypicalDuration(preferences.typical_period_duration)
      setPredictionEnabled(preferences.prediction_enabled)
      setFertileEnabled(preferences.fertile_window_enabled)
      setAppLockEnabled(preferences.app_lock_enabled)
    }
  }, [user, preferences])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.updateProfile({
        display_name: displayName,
        typical_cycle_length: typicalCycle,
        typical_period_duration: typicalDuration,
        prediction_enabled: predictionEnabled,
        fertile_window_enabled: fertileEnabled,
        app_lock_enabled: appLockEnabled,
        app_lock_pin: newPin || undefined
      })
      await refreshUser()
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err: any) {
      alert(err.message || 'Failed to update settings.')
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordStatus(null)

    if (newPassword !== confirmNewPassword) {
      setPasswordStatus({ type: 'error', msg: 'New passwords do not match.' })
      return
    }

    try {
      const res = await api.changePassword({
        current_password: currentPassword,
        new_password: newPassword
      })
      setPasswordStatus({ type: 'success', msg: res.message || 'Password changed successfully.' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
    } catch (err: any) {
      setPasswordStatus({ type: 'error', msg: err.message || 'Failed to change password.' })
    }
  }

  const handlePreviewCSV = async () => {
    setImportStatus(null)
    setImportPreview(null)
    try {
      const res = await api.importCSV(csvText, true)
      setImportPreview(res)
    } catch (err: any) {
      setImportStatus(err.message || 'CSV preview failed.')
    }
  }

  const handleConfirmImport = async () => {
    try {
      const res = await api.importCSV(csvText, false)
      setImportStatus(res.message || 'Import completed successfully!')
      setImportPreview(null)
      setCsvText('')
      await refreshUser()
    } catch (err: any) {
      setImportStatus(err.message || 'Import failed.')
    }
  }

  const handleDeleteAccount = async () => {
    setDeleteError(null)
    try {
      await api.deleteAccount(deletePassword)
      logout()
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete account. Please check your password.')
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6 sm:py-10">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#573B50] dark:text-white flex items-center gap-2.5">
          <Settings className="w-7 h-7 text-[#573B50] dark:text-[#E8A1B0]" />
          <span>Settings & Personalization</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#6B6470] dark:text-[#C8C1CD] mt-0.5">
          Manage your personal preferences, cycle baselines, display themes, and privacy controls
        </p>
      </div>

      {saveSuccess && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Preferences saved successfully!</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Section 1: Cycle Baselines & Profile */}
        <div className="card-soft p-6 sm:p-8 border shadow-sm">
          <h2 className="text-base font-serif font-bold text-[#573B50] dark:text-white mb-4 flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-[#E8A1B0]" />
            <span>Cycle Rhythm Baseline</span>
          </h2>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-bold mb-1">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full sm:w-80 p-2.5 rounded-xl border bg-white dark:bg-[#26212C] text-xs font-semibold"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1">
                  Typical Cycle Length (days)
                </label>
                <input
                  type="number"
                  min="18"
                  max="60"
                  value={typicalCycle}
                  onChange={(e) => setTypicalCycle(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border bg-white dark:bg-[#26212C] text-xs font-semibold"
                />
                <span className="text-[11px] text-[#6B6470] dark:text-[#C8C1CD] block mt-1">
                  Default estimate when fewer than 2 cycles are logged.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">
                  Typical Period Duration (days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="14"
                  value={typicalDuration}
                  onChange={(e) => setTypicalDuration(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border bg-white dark:bg-[#26212C] text-xs font-semibold"
                />
                <span className="text-[11px] text-[#6B6470] dark:text-[#C8C1CD] block mt-1">
                  Bleeding duration estimate.
                </span>
              </div>
            </div>

            {/* Prediction Toggles */}
            <div className="pt-2 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={predictionEnabled}
                  onChange={(e) => setPredictionEnabled(e.target.checked)}
                  className="mt-0.5 rounded text-[#E8A1B0] focus:ring-[#E8A1B0]"
                />
                <div>
                  <span className="text-xs font-bold text-[#573B50] dark:text-white block">
                    Enable Cycle Predictions
                  </span>
                  <span className="text-[11px] text-[#6B6470] dark:text-[#C8C1CD] block">
                    Calculates estimated next period dates dynamically using your actual logged cycles.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={fertileEnabled}
                  onChange={(e) => setFertileEnabled(e.target.checked)}
                  className="mt-0.5 rounded text-[#E8A1B0] focus:ring-[#E8A1B0]"
                />
                <div>
                  <span className="text-xs font-bold text-[#573B50] dark:text-white block">
                    Estimate Fertile & Ovulation Window (Optional)
                  </span>
                  <span className="text-[11px] text-[#6B6470] dark:text-[#C8C1CD] block">
                    Off by default. Highlights estimated fertile days on the calendar. <em>Estimate only, not contraception.</em>
                  </span>
                </div>
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#E8A1B0] hover:bg-[#d88f9f] text-[#573B50] font-bold text-xs shadow-sm transition-all"
              >
                Save Baseline Settings
              </button>
            </div>
          </form>
        </div>

        {/* Section 2: Privacy, Discreet Mode & App Lock */}
        <div className="card-soft p-6 sm:p-8 border shadow-sm">
          <h2 className="text-base font-serif font-bold text-[#573B50] dark:text-white mb-4 flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#866ACF]" />
            <span>Privacy & App Lock</span>
          </h2>

          <div className="space-y-5">
            {/* Discreet Mode */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5">
              <div className="max-w-md">
                <div className="flex items-center gap-2">
                  {discreetMode ? <EyeOff className="w-4 h-4 text-[#E8A1B0]" /> : <Eye className="w-4 h-4 text-[#6B6470]" />}
                  <span className="text-xs font-bold text-[#573B50] dark:text-white">Discreet Mode</span>
                </div>
                <p className="text-[11px] text-[#6B6470] dark:text-[#C8C1CD] mt-0.5">
                  Replaces "LunaFlow" with neutral "LF Rhythm" title and suppresses sensitive wording.
                </p>
              </div>
              <button
                type="button"
                onClick={toggleDiscreetMode}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  discreetMode
                    ? 'bg-[#E8A1B0] text-[#573B50]'
                    : 'bg-black/10 dark:bg-white/10 text-[#6B6470] dark:text-white'
                }`}
              >
                {discreetMode ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            {/* App Lock with PIN */}
            <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#573B50] dark:text-white block">
                    App Lock PIN Protection
                  </span>
                  <span className="text-[11px] text-[#6B6470] dark:text-[#C8C1CD] block">
                    Require a 4-digit PIN every time the application is opened or locked.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={appLockEnabled}
                  onChange={(e) => setAppLockEnabled(e.target.checked)}
                  className="rounded text-[#E8A1B0] focus:ring-[#E8A1B0]"
                />
              </div>

              {appLockEnabled && (
                <div className="pt-2 border-t border-black/5 dark:border-white/5 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <input
                    type="password"
                    maxLength={6}
                    placeholder="Set new 4-digit PIN"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    className="p-2 rounded-xl border bg-white dark:bg-[#26212C] text-xs font-mono w-44"
                  />
                  <span className="text-[11px] text-[#6B6470] dark:text-[#C8C1CD]">
                    {preferences?.has_pin ? 'PIN is currently active. Enter to update.' : 'Enter 4 numbers and click Save above.'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Data Import & Export */}
        <div className="card-soft p-6 sm:p-8 border shadow-sm">
          <h2 className="text-base font-serif font-bold text-[#573B50] dark:text-white mb-4 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-[#C9D8C0]" />
            <span>Data Portability & Import</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5">
              <span className="text-xs font-bold text-[#573B50] dark:text-white block mb-1">
                Export Your Cycle Records
              </span>
              <p className="text-[11px] text-[#6B6470] dark:text-[#C8C1CD] mb-3">
                Download your complete period entries and daily check-ins anytime.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => api.exportCSV()}
                  className="px-3 py-1.5 rounded-xl border border-black/10 dark:border-white/10 text-xs font-bold hover:bg-black/5 flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> CSV
                </button>
                <button
                  type="button"
                  onClick={() => api.exportJSON()}
                  className="px-3 py-1.5 rounded-xl border border-black/10 dark:border-white/10 text-xs font-bold hover:bg-black/5 flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> JSON
                </button>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5">
              <span className="text-xs font-bold text-[#573B50] dark:text-white block mb-1">
                CSV Import from Other Apps
              </span>
              <p className="text-[11px] text-[#6B6470] dark:text-[#C8C1CD] mb-3">
                Migrate historical period dates from Clue, Flo, or custom spreadsheet format.
              </p>
              <textarea
                rows={2}
                placeholder="Paste CSV text here (START_DATE, END_DATE, FLOW)..."
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                className="w-full p-2 rounded-xl border bg-white dark:bg-[#26212C] text-xs font-mono mb-2"
              />
              <button
                type="button"
                disabled={!csvText.trim()}
                onClick={handlePreviewCSV}
                className="px-3 py-1.5 rounded-xl bg-[#E8A1B0] hover:bg-[#d88f9f] text-[#573B50] text-xs font-bold disabled:opacity-40"
              >
                Validate & Preview Import
              </button>
            </div>
          </div>

          {/* Import Preview Box */}
          {importPreview && (
            <div className="p-4 rounded-2xl bg-[#FFF9F4] dark:bg-[#302A38] border border-[#E8A1B0] text-xs mb-4">
              <span className="font-bold text-[#573B50] dark:text-white block mb-1">
                CSV Validation Preview:
              </span>
              <p className="mb-2">
                Found <strong>{importPreview.valid_periods_count}</strong> valid period records. (Skipped {importPreview.skipped_rows} rows).
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  className="px-4 py-1.5 rounded-xl bg-[#573B50] text-white font-bold"
                >
                  Confirm & Save Records
                </button>
                <button
                  type="button"
                  onClick={() => setImportPreview(null)}
                  className="px-3 py-1.5 rounded-xl border"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {importStatus && (
            <p className="text-xs font-semibold text-[#573B50] dark:text-white">{importStatus}</p>
          )}
        </div>

        {/* Section 4: Change Password */}
        <div className="card-soft p-6 sm:p-8 border shadow-sm">
          <h2 className="text-base font-serif font-bold text-[#573B50] dark:text-white mb-4 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[#B2702E]" />
            <span>Change Password</span>
          </h2>

          {passwordStatus && (
            <div className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
              passwordStatus.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
            }`}>
              {passwordStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{passwordStatus.msg}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-3 max-w-sm">
            <div>
              <label className="block text-xs font-bold mb-1">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full p-2.5 rounded-xl border bg-white dark:bg-[#26212C] text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full p-2.5 rounded-xl border bg-white dark:bg-[#26212C] text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="w-full p-2.5 rounded-xl border bg-white dark:bg-[#26212C] text-xs"
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#573B50] hover:bg-[#432d3d] text-white text-xs font-bold shadow-sm"
            >
              Update Password
            </button>
          </form>
        </div>

        {/* Section 5: Account Deletion (Danger Zone) */}
        <div className="card-soft p-6 sm:p-8 border border-rose-200 dark:border-rose-900/40 bg-rose-50/20 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400 block uppercase tracking-wider">
                Permanent Account Deletion
              </span>
              <p className="text-xs text-[#6B6470] dark:text-[#C8C1CD] mt-0.5">
                Permanently erase your account, period records, symptoms, and journal notes. This cannot be undone.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm self-start sm:self-auto"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete Account Password Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm card-soft p-6 sm:p-8 border shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-lg text-[#573B50] dark:text-white mb-2">
              Confirm Account Deletion
            </h3>
            <p className="text-xs text-[#6B6470] dark:text-[#C8C1CD] mb-4">
              Please enter your password to permanently delete all your health records and data.
            </p>

            {deleteError && (
              <p className="text-xs text-rose-600 font-semibold mb-3">{deleteError}</p>
            )}

            <input
              type="password"
              placeholder="Your current password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className="w-full p-2.5 rounded-xl border bg-white dark:bg-[#26212C] text-xs mb-4"
            />

            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl border text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={!deletePassword}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs disabled:opacity-50"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
