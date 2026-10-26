import React from 'react'
import { Shield, Lock, FileText, CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'

export const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-10 sm:py-16">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="w-12 h-12 rounded-2xl bg-[#C9D8C0] text-[#2F4228] flex items-center justify-center mx-auto mb-4">
          <Shield className="w-6 h-6" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#573B50] dark:text-white mb-2">
          LunaFlow Privacy Manifesto
        </h1>
        <p className="text-xs sm:text-sm text-[#6B6470] dark:text-[#C8C1CD]">
          Your menstrual and health data is deeply personal. Here is our unwavering commitment to safeguarding it.
        </p>
      </div>

      <div className="card-soft p-8 sm:p-12 border shadow-sm space-y-8 text-sm leading-relaxed text-[#34313A] dark:text-[#F7F3F6]">
        <section>
          <h2 className="text-lg font-serif font-bold text-[#573B50] dark:text-white mb-2 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <span>1. What We Collect and Why</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#6B6470] dark:text-[#C8C1CD]">
            LunaFlow collects only the data you explicitly choose to record: your display name, email, period start and end dates, flow intensities, symptoms, moods, energy ratings, and private journal notes. This data is collected solely to provide you with your interactive calendar, rhythm averages, and self-care tips.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-serif font-bold text-[#573B50] dark:text-white mb-2 flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#866ACF]" />
            <span>2. No Selling, No Third-Party Brokers</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#6B6470] dark:text-[#C8C1CD]">
            We do not sell, rent, monetize, or disclose your reproductive or wellness data to advertisers, insurance companies, data brokers, or third parties. There are no tracking pixels or advertising telemetry embedded in your personal logs.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-serif font-bold text-[#573B50] dark:text-white mb-2 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#E8A1B0]" />
            <span>3. Sanitized Logging & Security</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#6B6470] dark:text-[#C8C1CD]">
            Our server utilizes real-time log filtering that automatically redacts and scrubs symptoms, bleeding records, moods, PINs, and passwords before any system diagnostic log is written. All passwords and App Lock PINs are hashed using cryptographic Scrypt hashing with unique random salts.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-serif font-bold text-[#573B50] dark:text-white mb-2 flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#B2702E]" />
            <span>4. Complete Data Portability & Deletion</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#6B6470] dark:text-[#C8C1CD]">
            You have full ownership of your data. You can export all your period logs, check-ins, and journal entries in open JSON and CSV formats at any time. When you choose to delete your account, all associated database records are immediately and permanently erased via cascading database deletion.
          </p>
        </section>

        <div className="pt-6 border-t border-black/5 dark:border-white/10 flex items-center justify-between text-xs text-[#6B6470] dark:text-[#C8C1CD]">
          <span>Effective Date: October 2026</span>
          <Link to="/" className="font-bold underline text-[#573B50] dark:text-white">
            Return to LunaFlow Home
          </Link>
        </div>
      </div>
    </div>
  )
}
