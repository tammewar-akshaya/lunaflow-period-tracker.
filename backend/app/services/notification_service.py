import json
import logging
from typing import Dict, Any, Optional
from flask import current_app
from pywebpush import webpush, WebPushException

logger = logging.getLogger(__name__)

def send_verification_email(user_email: str, user_name: str, token: str) -> bool:
    """
    Sends email verification token. In development, logs token safely to console.
    """
    frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:5173')
    verify_url = f"{frontend_url}/verify-email?token={token}&email={user_email}"

    logger.info(f"Verification requested for user. Token generated: {token[:8]}...")
    print(f"\n[LUNAFLOW EMAIL NOTIFICATION]\nTo: {user_email}\nSubject: Verify your LunaFlow Account\nLink: {verify_url}\n")
    return True

def send_password_reset_email(user_email: str, user_name: str, token: str) -> bool:
    """
    Sends password reset token link.
    """
    frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:5173')
    reset_url = f"{frontend_url}/reset-password?token={token}&email={user_email}"

    logger.info(f"Password reset requested for user. Token generated: {token[:8]}...")
    print(f"\n[LUNAFLOW EMAIL NOTIFICATION]\nTo: {user_email}\nSubject: Reset your LunaFlow Password\nLink: {reset_url}\n")
    return True

def send_web_push(subscription_info: Dict[str, Any], payload: Dict[str, Any]) -> bool:
    """
    Sends Web Push notification using pywebpush and VAPID keys.
    """
    vapid_private = current_app.config.get('VAPID_PRIVATE_KEY')
    vapid_claims = {
        "sub": f"mailto:{current_app.config.get('VAPID_CLAIM_EMAIL', 'support@lunaflow.app')}"
    }

    if not vapid_private:
        logger.info("Web push skipped: VAPID keys not configured.")
        return False

    try:
        webpush(
            subscription_info=subscription_info,
            data=json.dumps(payload),
            vapid_private_key=vapid_private,
            vapid_claims=vapid_claims
        )
        return True
    except WebPushException as ex:
        logger.warning(f"Web push failed: {ex}")
        return False
    except Exception as ex:
        logger.warning(f"Push notification error: {ex}")
        return False
