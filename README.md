# 🌙 LunaFlow — Your Cycle, Your Rhythm

> A gentler way to understand your period, track your patterns, and care for yourself. Private, respectful, and thoughtfully designed full-stack web application.

---

## 🌸 Overview

**LunaFlow** is a production-grade full-stack women’s menstrual health and wellness tracker built with modern web technologies, a real relational database, transparent cycle calculations, and privacy-first security safeguards.

- **Interactive Monthly Calendar**: Visual flow intensity tracking, period logging, custom symptoms & mood tags, predicted cycle days with distinct dashed borders, and optional fertile window indicators.
- **Dynamic Predictions & Phase Awareness**: Transparent, real-data-driven calculations for current cycle day, phase estimate (Menstrual, Follicular, Ovulation, Luteal), and self-care tips.
- **Daily Wellness Check-in**: Track cramps, headaches, energy level (1–5), water glasses, sleep duration, exercise minutes, and personal notes.
- **Private Wellness Journal**: Personal sanctuary for reflections, feeling notes, and symptom histories.
- **Privacy & Security**:
  - Cryptographic Scrypt password & PIN hashing.
  - Automatic log sanitization filter that scrubs sensitive health data before logging.
  - App Lock (4-digit PIN protection).
  - Discreet Mode (neutral title *LF Rhythm* and masked styling).
  - Data portability: One-click JSON & CSV data export and CSV import from other trackers.
  - Doctor Consultation Summary Report in PDF format.
  - Complete, permanent cascading account deletion.
- **Multilingual Support**: English, Hindi (हिन्दी), and Telugu (తెలుగు).
- **Theme Accents**: Light & Dark modes with Blush, Lavender, and Sage accent themes.
- **PWA Ready**: Offline caching for viewing past cycles and offline status banners.

---

## 🧱 Technology Stack

### Frontend
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS (v4) with custom feminine wellness design system tokens
- **Routing**: React Router DOM (v7)
- **Icons**: Lucide React
- **Charts**: Recharts
- **Internationalization**: react-i18next (en, hi, te)
- **PWA**: vite-plugin-pwa with automatic service worker registration

### Backend
- **Framework**: Python 3.11+ / Flask REST APIs
- **Database ORM**: Flask-SQLAlchemy with PostgreSQL (Supabase) / SQLite support
- **Migrations**: Flask-Migrate & Alembic
- **Authentication**: Flask-JWT-Extended
- **Rate Limiting**: Flask-Limiter
- **PDF Generation**: ReportLab
- **Push & Email**: pywebpush (VAPID) and pluggable email providers (SMTP / Resend / Console)
- **Testing**: Pytest

---

## 📁 Project Structure

```
Period App/
├── backend/
│   ├── app/
│   │   ├── models/          # SQLAlchemy Models (User, Period, Checkin, Journal, etc.)
│   │   ├── routes/          # REST Endpoints (auth, periods, wellness, user)
│   │   ├── services/        # Business logic (cycle_service, pdf_service, notification_service)
│   │   ├── utils/           # Security, password hashing, and health data sanitizing log filter
│   │   └── __init__.py      # Flask app factory, CORS, and limiter configuration
│   ├── tests/               # Pytest automated test suite
│   ├── config.py            # Environment-driven configuration
│   ├── run.py               # Backend entry point
│   ├── requirements.txt     # Python dependencies
│   └── Procfile             # Production web process
├── frontend/
│   ├── src/
│   │   ├── components/      # UI components (Navbar, BottomNav, LogPeriodModal, CheckinModal, AppLockModal)
│   │   ├── pages/           # LandingPage, Dashboard, Calendar, Insights, Journal, Settings, Auth
│   │   ├── layouts/         # MainLayout with responsive header and bottom navigation
│   │   ├── context/         # AuthContext with theme, language, and PIN lock state
│   │   ├── services/        # Typed API client
│   │   ├── locales/         # en.json, hi.json, te.json translation dictionaries
│   │   └── types/           # TypeScript data interfaces
│   ├── index.html           # Google Fonts and PWA meta tags
│   └── vite.config.ts       # Vite configuration with PWA and Tailwind
├── .github/workflows/
│   └── ci.yml               # Automated CI pipeline for backend tests and frontend build
├── .env.example             # Template environment variables
├── render.yaml              # Render deployment blueprint
└── README.md
```

---

## 🚀 Quickstart & Local Setup

### 1. Prerequisites
- **Python**: 3.10+ (Python 3.14 recommended)
- **Node.js**: v18+ (Node.js v24 recommended)
- **npm**: v9+

---

### 2. Backend Setup

```bash
# Navigate to backend and create virtual environment
cd backend
python -m venv venv

# Activate virtual environment:
# On Windows:
venv\Scripts\activate
# On macOS / Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run backend API server (runs on port 5000)
python run.py
```

Backend will automatically create `lunaflow.db` with all tables on initial startup.

---

### 3. Frontend Setup

In a new terminal:

```bash
# Navigate to frontend
cd frontend

# Install packages
npm install

# Start Vite dev server (runs on port 5173 with automatic /api proxy)
npm run dev
```

Open your browser to: **`http://localhost:5173`**

---

## 🧪 Running Tests

### Backend Unit & Integration Tests (pytest)
```bash
# From workspace root:
backend\venv\Scripts\pytest -v backend\tests\test_backend.py
```
*Tests cover registration, login, verification tokens, user data isolation, cycle calculations, overlapping period checks, daily check-in upsert, journal privacy, doctor PDF generation, and log sanitization.*

### Frontend Type-Check & Production Build
```bash
cd frontend
npm run build
```

---

## ⚙️ Environment Variables

Create `.env` based on `.env.example`:

| Variable | Description | Default / Example |
|---|---|---|
| `SECRET_KEY` | Flask secret key for sessions | Secure random string (32+ bytes) |
| `JWT_SECRET_KEY` | Secret for signing JWT authentication tokens | Secure random string (32+ bytes) |
| `DATABASE_URL` | Database connection URL | `sqlite:///lunaflow.db` or Supabase PostgreSQL URL |
| `FRONTEND_URL` | URL of the frontend client | `http://localhost:5173` |
| `VAPID_PUBLIC_KEY` | Web Push VAPID public key | Optional |
| `VAPID_PRIVATE_KEY`| Web Push VAPID private key | Optional |
| `MAIL_PROVIDER` | Email provider (`console`, `smtp`, `resend`) | `console` for dev |

---

## 🌐 Production Deployment

### 1. Database (Supabase PostgreSQL)
1. Create a free project on [Supabase](https://supabase.com).
2. Under Project Settings -> Database, copy your **URI** connection string:
   `postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-REF].supabase.co:5432/postgres`
3. Set this as `DATABASE_URL` in your backend environment.

### 2. Backend (Render / Railway / Fly.io)
1. Connect your Git repository to Render.
2. Select **Web Service** with runtime `Python 3`.
3. Set Build Command: `pip install -r backend/requirements.txt`
4. Set Start Command: `cd backend && gunicorn run:app --bind 0.0.0.0:$PORT`
5. Configure Environment Variables (`SECRET_KEY`, `JWT_SECRET_KEY`, `DATABASE_URL`, `FRONTEND_URL`).

### 3. Frontend (Vercel / Netlify)
1. Import repository on [Vercel](https://vercel.com).
2. Set Root Directory to `frontend`.
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Add Environment Variable: `VITE_API_URL=https://your-backend-api.onrender.com/api`

---

## 🛡️ Medical & Health Disclaimer

LunaFlow is designed as a personal wellness journal and rhythm estimation tool. It does **not** provide medical diagnoses, treatment recommendations, or guaranteed contraception. Women should always consult a licensed healthcare provider regarding medical concerns or cycle irregularities.
