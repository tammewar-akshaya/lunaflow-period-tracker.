import hashlib
import secrets
from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash

def hash_password(password: str) -> str:
    """Secure password hashing using Werkzeug (pbkdf2:sha256)."""
    return generate_password_hash(password, method='scrypt')

def verify_password(stored_hash: str, password: str) -> bool:
    """Verifies a plain password against the stored hash."""
    return check_password_hash(stored_hash, password)

def hash_pin(pin: str) -> str:
    """Hashes a 4-6 digit numeric PIN for App Lock."""
    return generate_password_hash(str(pin), method='scrypt')

def verify_pin(stored_pin_hash: str, pin: str) -> bool:
    """Verifies an App Lock PIN."""
    if not stored_pin_hash or not pin:
        return False
    return check_password_hash(stored_pin_hash, str(pin))

def generate_secure_token() -> str:
    """Generates a cryptographic random token for email verification or password reset."""
    return secrets.token_urlsafe(32)

def hash_token(token: str) -> str:
    """Hashes the random token with SHA256 before storing in the database."""
    return hashlib.sha256(token.encode('utf-8')).hexdigest()

def get_utc_now():
    """Returns timezone-aware UTC datetime."""
    return datetime.now(timezone.utc)
