import React from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Heart, Shield, Sparkles, Moon, Lock, ArrowRight, CheckCircle2, ChevronRight, BarChart2, BookOpen } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth()

  const features = [
    {
      icon: Calendar,
      title: 'Interactive Period Calendar',
      desc: 'Seamlessly log period days, flow intensity, and navigate months with clear visual indicators and zero guesswork.'
    },
    {
      icon: Sparkles,
      title: 'Transparent Cycle Predictions',
      desc: 'Calculations based entirely on your real past cycles. Clear estimates with explanations, never fabricated stats.'
    },
    {
      icon: Heart,
      title: 'Symptom & Mood Check-ins',
      desc: 'Track cramps, energy, sleep hours, water intake, acne, and moods daily with clean, delightful taps.'
    },
    {
      icon: BarChart2,
      title: 'Personal Wellness Insights',
      desc: 'Discover your body’s unique monthly rhythm, cycle averages, and gentle pattern observations without medical jargon.'
    },
    {
      icon: Shield,
      title: 'Private & Secure by Design',
      desc: 'Your health data is strictly yours. No third-party data broker sharing, encrypted storage, and instant one-click data deletion.'
    },
    {
      icon: Lock,
      title: 'App Lock & Discreet Mode',
      desc: 'Protect personal records behind a 4-digit PIN and switch to a masked neutral app name and icon whenever you need privacy.'
    }
  ]

  const steps = [
    {
      num: '01',
      title: 'Log your period',
      desc: 'Tap your period start and end dates on the calendar with flow intensity from spotting to heavy.'
    },
    {
      num: '02',
      title: 'Understand your cycle',
      desc: 'See which cycle phase you are in—Menstrual, Follicular, Ovulation, or Luteal—with gentle self-care tips.'
    },
    {
      num: '03',
      title: 'Learn your patterns',
      desc: 'Over time, observe how your mood, energy, and physical symptoms align with your personal monthly rhythm.'
    }
  ]

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28 px-4 sm:px-8">
        {/* Soft Background Accents */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-[#F6DCE3]/60 via-[#E8E1F7]/40 to-[#C9D8C0]/30 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F6DCE3]/70 dark:bg-[#302A38] text-[#573B50] dark:text-[#E8A1B0] text-xs font-bold mb-6 border border-[#E8A1B0]/30">
            <Moon className="w-3.5 h-3.5" />
            <span>A gentler wellness companion</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif font-extrabold tracking-tight text-[#573B50] dark:text-white mb-6 leading-[1.12]">
            Your cycle, <br className="hidden sm:block" />
            <span className="italic font-normal bg-gradient-to-r from-[#C46D82] via-[#866ACF] to-[#573B50] dark:from-[#E8A1B0] dark:to-[#E8E1F7] bg-clip-text text-transparent">
              your rhythm.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-xl text-[#6B6470] dark:text-[#C8C1CD] font-medium mb-10 leading-relaxed">
            A gentler way to understand your period, track your patterns, and care for yourself. Private, respectful, and thoughtfully designed.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to={isAuthenticated ? '/dashboard' : '/register'}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#E8A1B0] hover:bg-[#d88f9f] text-[#573B50] font-bold text-base shadow-lg shadow-[#E8A1B0]/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>{isAuthenticated ? 'Open LunaFlow Dashboard' : 'Start Tracking Free'}</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto px-7 py-4 rounded-2xl card-soft text-[#573B50] dark:text-white font-semibold text-base hover:bg-black/5 dark:hover:bg-white/5 transition-all text-center"
            >
              Explore Features
            </a>
          </div>

          {/* Product Preview Card */}
          <div className="mt-14 max-w-3xl mx-auto card-soft p-6 sm:p-8 border shadow-xl relative text-left">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-black/5 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#F6DCE3] dark:bg-[#302A38] text-[#573B50] dark:text-[#E8A1B0] flex items-center justify-center text-xl font-bold">
                  🌷
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#573B50] dark:text-white">Day 14 • Ovulation Phase</h3>
                  <p className="text-xs text-[#6B6470] dark:text-[#C8C1CD]">High energy, mental clarity, and peak focus</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#C9D8C0]/50 dark:bg-[#2F4228]/50 text-[#2F4228] dark:text-[#C9D8C0]">
                Rhythm in sync
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6">
              <div className="p-3 rounded-xl bg-[#FFF9F4] dark:bg-[#2A2432] border border-black/5 dark:border-white/5">
                <span className="text-[11px] font-semibold text-[#6B6470] dark:text-[#C8C1CD] block">Cycle Length</span>
                <span className="text-lg font-bold font-serif text-[#573B50] dark:text-white">28 Days</span>
              </div>
              <div className="p-3 rounded-xl bg-[#FFF9F4] dark:bg-[#2A2432] border border-black/5 dark:border-white/5">
                <span className="text-[11px] font-semibold text-[#6B6470] dark:text-[#C8C1CD] block">Period Duration</span>
                <span className="text-lg font-bold font-serif text-[#573B50] dark:text-white">5 Days</span>
              </div>
              <div className="p-3 rounded-xl bg-[#FFF9F4] dark:bg-[#2A2432] border border-black/5 dark:border-white/5">
                <span className="text-[11px] font-semibold text-[#6B6470] dark:text-[#C8C1CD] block">Next Period</span>
                <span className="text-lg font-bold font-serif text-[#C46D82] dark:text-[#E8A1B0]">in 14 days</span>
              </div>
              <div className="p-3 rounded-xl bg-[#FFF9F4] dark:bg-[#2A2432] border border-black/5 dark:border-white/5">
                <span className="text-[11px] font-semibold text-[#6B6470] dark:text-[#C8C1CD] block">Privacy State</span>
                <span className="text-lg font-bold font-serif text-[#573B50] dark:text-white">Encrypted</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-16 sm:py-24 px-4 sm:px-8 bg-black/[0.02] dark:bg-white/[0.02]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#573B50] dark:text-white mb-4">
              Designed around your bodily wellbeing
            </h2>
            <p className="text-[#6B6470] dark:text-[#C8C1CD] text-sm sm:text-base">
              Everything you need to track your period with peace of mind. No clutter, no predatory ads, and no selling your personal data.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, idx) => {
              const Icon = feat.icon
              return (
                <div key={idx} className="card-soft card-interactive p-7 flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-[#F6DCE3] dark:bg-[#302A38] text-[#573B50] dark:text-[#E8A1B0] flex items-center justify-center mb-5">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-serif font-bold text-lg text-[#573B50] dark:text-white mb-2">{feat.title}</h3>
                    <p className="text-sm text-[#6B6470] dark:text-[#C8C1CD] leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-24 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#573B50] dark:text-white mb-4">
              How LunaFlow works
            </h2>
            <p className="text-[#6B6470] dark:text-[#C8C1CD] text-sm sm:text-base">
              Three simple steps to intuitive cycle awareness.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((st, i) => (
              <div key={i} className="card-soft p-8 relative">
                <span className="text-4xl font-serif font-extrabold text-[#E8A1B0]/50 dark:text-[#7A4254]/50 mb-4 block">
                  {st.num}
                </span>
                <h3 className="font-serif font-bold text-xl text-[#573B50] dark:text-white mb-2">{st.title}</h3>
                <p className="text-sm text-[#6B6470] dark:text-[#C8C1CD] leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Medical Disclaimer Banner */}
      <section className="px-4 sm:px-8 max-w-4xl mx-auto mb-16 w-full">
        <div className="p-6 rounded-2xl bg-[#F6DCE3]/50 dark:bg-[#302A38]/50 border border-[#E8A1B0]/30 text-xs text-[#6B6470] dark:text-[#C8C1CD] leading-relaxed">
          <strong className="text-[#573B50] dark:text-white block mb-1">Gentle Medical Disclaimer</strong>
          LunaFlow is intended strictly as a personal wellness journal and rhythm estimation tool. It does not provide medical diagnoses, treatment plans, or reliable contraception. Always consult your qualified gynecologist or healthcare professional for medical advice.
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-black/5 dark:border-white/10 py-10 px-4 sm:px-8 text-xs text-[#6B6470] dark:text-[#C8C1CD]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-base">🌙</span>
            <span className="font-serif font-bold text-sm text-[#573B50] dark:text-white">LunaFlow</span>
            <span>— Your Cycle, Your Rhythm.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/privacy" className="hover:text-[#573B50] dark:hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/login" className="hover:text-[#573B50] dark:hover:text-white transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-[#573B50] dark:hover:text-white transition-colors">Create Account</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
