import os
from datetime import timedelta
from dotenv import load_dotenv

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
ROOT_DIR = os.path.abspath(os.path.join(BASE_DIR, '..'))

# Load .env from project root and backend directory if present
load_dotenv(os.path.join(ROOT_DIR, '.env'))
load_dotenv(os.path.join(BASE_DIR, '.env'))

def _build_database_uri() -> str:
    uri = os.getenv('DATABASE_URL', '').strip() or f"sqlite:///{os.path.join(BASE_DIR, 'lunaflow.db')}"
    # Handle Supabase / Render / Heroku postgres:// or postgresql:// -> postgresql+psycopg://
    if uri.startswith("postgres://"):
        uri = uri.replace("postgres://", "postgresql+psycopg://", 1)
    elif uri.startswith("postgresql://") and not uri.startswith("postgresql+"):
        uri = uri.replace("postgresql://", "postgresql+psycopg://", 1)
    return uri

def _build_engine_options(database_uri: str) -> dict:
    if not database_uri.startswith("postgresql"):
        return {}

    connect_args = {}
    if "sslmode=" not in database_uri:
        connect_args["sslmode"] = "require"
    # Supavisor transaction mode (:6543) does not support server-side prepared statements
    if ":6543/" in database_uri:
        connect_args["prepare_threshold"] = None

    options = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
    }
    if connect_args:
        options["connect_args"] = connect_args
    return options

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'lunaflow-super-secret-key-change-in-production-2026')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'lunaflow-jwt-secret-key-change-in-production-2026')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    JWT_TOKEN_LOCATION = ['headers']
    JWT_HEADER_NAME = 'Authorization'
    JWT_HEADER_TYPE = 'Bearer'
    
    # Database: Supabase PostgreSQL in prod, SQLite default for local dev
    SQLALCHEMY_DATABASE_URI = _build_database_uri()
    SQLALCHEMY_ENGINE_OPTIONS = _build_engine_options(SQLALCHEMY_DATABASE_URI)
        
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # VAPID Keys for Web Push
    VAPID_PUBLIC_KEY = os.getenv('VAPID_PUBLIC_KEY', '')
    VAPID_PRIVATE_KEY = os.getenv('VAPID_PRIVATE_KEY', '')
    VAPID_CLAIM_EMAIL = os.getenv('VAPID_CLAIM_EMAIL', 'support@lunaflow.app')
    
    # Mail Config (Resend / SendGrid / SMTP)
    MAIL_PROVIDER = os.getenv('MAIL_PROVIDER', 'console') # console, resend, sendgrid, smtp
    SMTP_SERVER = os.getenv('SMTP_SERVER', 'localhost')
    SMTP_PORT = int(os.getenv('SMTP_PORT', 587))
    SMTP_USERNAME = os.getenv('SMTP_USERNAME', '')
    SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', '')
    FROM_EMAIL = os.getenv('FROM_EMAIL', 'noreply@lunaflow.app')
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')

    # Rate Limiting
    RATELIMIT_DEFAULT = "200 per day, 50 per hour"
    RATELIMIT_STORAGE_URI = "memory://"
