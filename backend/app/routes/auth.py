import re
from datetime import datetime, timedelta, timezone
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from email_validator import validate_email, EmailNotValidError
from app.extensions import db, limiter
from app.models.models import User, UserPreferences, EmailToken
from app.utils.security import (
    hash_password, verify_password, hash_pin, verify_pin,
    generate_secure_token, hash_token, get_utc_now
)
from app.services.notification_service import send_verification_email, send_password_reset_email

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

def validate_password_strength(password: str) -> bool:
    """Password must be at least 8 characters."""
    return bool(password and len(password) >= 8)

@auth_bp.route('/register', methods=['POST'])
@limiter.limit("10 per hour")
def register():
    data = request.get_json() or {}
    display_name = data.get('display_name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    confirm_password = data.get('confirm_password', '')
    privacy_agreed = data.get('privacy_policy_agreed', False)

    if not display_name or not email or not password:
        return jsonify({'error': 'Name, email, and password are required.'}), 400

    if not privacy_agreed:
        return jsonify({'error': 'You must agree to the privacy policy to register.'}), 400

    if password != confirm_password:
        return jsonify({'error': 'Passwords do not match.'}), 400

    if not validate_password_strength(password):
        return jsonify({'error': 'Password must be at least 8 characters long.'}), 400

    try:
        valid = validate_email(email, check_deliverability=False)
        email = valid.normalized
    except EmailNotValidError as e:
        return jsonify({'error': f'Invalid email address: {str(e)}'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'An account with this email already exists.'}), 409

    # Create user
    pw_hash = hash_password(password)
    user = User(
        display_name=display_name,
        email=email,
        password_hash=pw_hash,
        email_verified=False
    )
    db.session.add(user)
    db.session.flush()

    # Optional onboarding fields
    typical_cycle = int(data.get('typical_cycle_length', 28) or 28)
    typical_duration = int(data.get('typical_period_duration', 5) or 5)
    regularity = data.get('cycle_regularity', 'regular')

    preferences = UserPreferences(
        user_id=user.id,
        typical_cycle_length=typical_cycle,
        typical_period_duration=typical_duration,
        cycle_regularity=regularity
    )
    db.session.add(preferences)

    # Generate verification token
    raw_token = generate_secure_token()
    token_entry = EmailToken(
        user_id=user.id,
        token_hash=hash_token(raw_token),
        purpose='verify',
        expires_at=get_utc_now() + timedelta(days=2)
    )
    db.session.add(token_entry)
    db.session.commit()

    # Send verification email
    send_verification_email(user.email, user.display_name, raw_token)

    # Create JWT
    access_token = create_access_token(identity=str(user.id))

    return jsonify({
        'message': 'Registration successful. A verification link has been sent to your email.',
        'access_token': access_token,
        'user': user.to_dict(),
        'requires_verification': True,
        # Provide token in dev response for seamless instant testing
        'dev_verification_token': raw_token
    }), 201


@auth_bp.route('/login', methods=['POST'])
@limiter.limit("15 per 15 minute")
def login():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Email and password are required.'}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not verify_password(user.password_hash, password):
        return jsonify({'error': 'Invalid email or password.'}), 401

    access_token = create_access_token(identity=str(user.id))

    return jsonify({
        'message': 'Login successful.',
        'access_token': access_token,
        'user': user.to_dict()
    }), 200


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found.'}), 404

    return jsonify({'user': user.to_dict()}), 200


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    return jsonify({'message': 'Logged out successfully.'}), 200


@auth_bp.route('/verify-email', methods=['POST'])
@limiter.limit("10 per hour")
def verify_email():
    data = request.get_json() or {}
    raw_token = data.get('token', '').strip()
    email = data.get('email', '').strip().lower()

    if not raw_token:
        return jsonify({'error': 'Verification token is required.'}), 400

    t_hash = hash_token(raw_token)
    token_entry = EmailToken.query.filter_by(token_hash=t_hash, purpose='verify').first()

    now = get_utc_now()
    if not token_entry or token_entry.used_at is not None:
        return jsonify({'error': 'Invalid or already used verification token.'}), 400

    # Ensure token is not expired
    expires = token_entry.expires_at.replace(tzinfo=timezone.utc) if token_entry.expires_at.tzinfo is None else token_entry.expires_at
    if expires < now:
        return jsonify({'error': 'Verification token has expired. Please request a new one.'}), 400

    user = db.session.get(User, token_entry.user_id)
    if not user:
        return jsonify({'error': 'User not found.'}), 404

    user.email_verified = True
    token_entry.used_at = now
    db.session.commit()

    return jsonify({
        'message': 'Email verified successfully! You now have full access.',
        'user': user.to_dict()
    }), 200


@auth_bp.route('/resend-verification', methods=['POST'])
@limiter.limit("5 per hour")
def resend_verification():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()

    if not email:
        return jsonify({'error': 'Email is required.'}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        # Prevent account enumeration
        return jsonify({'message': 'If an account exists, a verification link was sent.'}), 200

    if user.email_verified:
        return jsonify({'message': 'Email is already verified.'}), 200

    raw_token = generate_secure_token()
    token_entry = EmailToken(
        user_id=user.id,
        token_hash=hash_token(raw_token),
        purpose='verify',
        expires_at=get_utc_now() + timedelta(days=2)
    )
    db.session.add(token_entry)
    db.session.commit()

    send_verification_email(user.email, user.display_name, raw_token)

    return jsonify({
        'message': 'Verification email resent.',
        'dev_verification_token': raw_token
    }), 200


@auth_bp.route('/forgot-password', methods=['POST'])
@limiter.limit("5 per hour")
def forgot_password():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()

    if not email:
        return jsonify({'error': 'Email is required.'}), 400

    user = User.query.filter_by(email=email).first()
    if user:
        raw_token = generate_secure_token()
        token_entry = EmailToken(
            user_id=user.id,
            token_hash=hash_token(raw_token),
            purpose='reset',
            expires_at=get_utc_now() + timedelta(hours=2)
        )
        db.session.add(token_entry)
        db.session.commit()
        send_password_reset_email(user.email, user.display_name, raw_token)
        return jsonify({
            'message': 'If an account exists with this email, password reset instructions have been sent.',
            'dev_reset_token': raw_token
        }), 200

    return jsonify({'message': 'If an account exists with this email, password reset instructions have been sent.'}), 200


@auth_bp.route('/reset-password', methods=['POST'])
@limiter.limit("10 per hour")
def reset_password():
    data = request.get_json() or {}
    raw_token = data.get('token', '').strip()
    new_password = data.get('new_password', '')
    confirm_password = data.get('confirm_password', '')

    if not raw_token or not new_password:
        return jsonify({'error': 'Token and new password are required.'}), 400

    if new_password != confirm_password:
        return jsonify({'error': 'Passwords do not match.'}), 400

    if not validate_password_strength(new_password):
        return jsonify({'error': 'Password must be at least 8 characters long.'}), 400

    t_hash = hash_token(raw_token)
    token_entry = EmailToken.query.filter_by(token_hash=t_hash, purpose='reset').first()

    now = get_utc_now()
    if not token_entry or token_entry.used_at is not None:
        return jsonify({'error': 'Invalid or expired password reset link.'}), 400

    expires = token_entry.expires_at.replace(tzinfo=timezone.utc) if token_entry.expires_at.tzinfo is None else token_entry.expires_at
    if expires < now:
        return jsonify({'error': 'Password reset link has expired.'}), 400

    user = User.query.get(token_entry.user_id)
    if not user:
        return jsonify({'error': 'User not found.'}), 404

    user.password_hash = hash_password(new_password)
    token_entry.used_at = now
    db.session.commit()

    return jsonify({'message': 'Password has been successfully updated. You may now log in.'}), 200


@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found.'}), 404

    data = request.get_json() or {}
    current_password = data.get('current_password', '')
    new_password = data.get('new_password', '')

    if not verify_password(user.password_hash, current_password):
        return jsonify({'error': 'Incorrect current password.'}), 400

    if not validate_password_strength(new_password):
        return jsonify({'error': 'New password must be at least 8 characters.'}), 400

    user.password_hash = hash_password(new_password)
    db.session.commit()

    return jsonify({'message': 'Password updated successfully.'}), 200


@auth_bp.route('/verify-pin', methods=['POST'])
@jwt_required()
def verify_app_lock_pin():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or not user.preferences:
        return jsonify({'error': 'User preferences not found.'}), 404

    data = request.get_json() or {}
    pin = data.get('pin', '')
    
    if not user.preferences.app_lock_pin_hash:
        return jsonify({'error': 'App lock is not enabled.'}), 400

    if verify_pin(user.preferences.app_lock_pin_hash, pin):
        return jsonify({'success': True, 'message': 'PIN verified.'}), 200
    else:
        return jsonify({'success': False, 'error': 'Incorrect PIN.'}), 401
