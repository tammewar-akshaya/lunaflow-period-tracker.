import logging
import re

# Sensitive health and personal data patterns to scrub from all logs
HEALTH_FIELDS = [
    'symptoms', 'symptom', 'flow', 'flow_intensity', 'bleeding', 'cramps',
    'mood', 'moods', 'energy_level', 'sleep_quality', 'sleep_hours',
    'water_glasses', 'exercise', 'content', 'notes', 'period', 'periods',
    'password', 'password_hash', 'token', 'pin', 'app_lock_pin'
]

class HealthDataSanitizingFilter(logging.Filter):
    """
    Ensures no sensitive health, cycle, or credential data ever leaks into application logs.
    """
    def filter(self, record):
        if not isinstance(record.msg, str):
            record.msg = str(record.msg)
            
        for field in HEALTH_FIELDS:
            # Matches field: [...] or field: {...} or field: "..." or field: value
            pattern = rf'([\'"]?{field}[\'"]?\s*[:=]\s*)(\[[^\]]*\]|\{{[^\}}]*\}}|[\'"][^\'"]*[\'"]|[^,\s}}]+)'
            record.msg = re.sub(pattern, r'\1"[REDACTED_HEALTH_DATA]"', record.msg, flags=re.IGNORECASE)
            
        return True

def configure_logging(app):
    """Configures application logger with health data scrubbing filter."""
    handler = logging.StreamHandler()
    handler.setLevel(logging.INFO)
    handler.addFilter(HealthDataSanitizingFilter())
    formatter = logging.Formatter('[%(asctime)s] %(levelname)s in %(module)s: %(message)s')
    handler.setFormatter(formatter)
    
    app.logger.handlers = [handler]
    app.logger.setLevel(logging.INFO)
