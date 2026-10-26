from datetime import date, datetime, timezone
from sqlalchemy import UniqueConstraint
from app.extensions import db

def get_utc_now():
    return datetime.now(timezone.utc)

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    display_name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    email_verified = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=get_utc_now, nullable=False)
    updated_at = db.Column(db.DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)

    # Relationships with cascade delete for complete privacy and GDPR compliance
    preferences = db.relationship('UserPreferences', backref='user', uselist=False, cascade='all, delete-orphan')
    periods = db.relationship('Period', backref='user', lazy='dynamic', cascade='all, delete-orphan', order_by='Period.start_date.desc()')
    checkins = db.relationship('DailyCheckin', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    journal_entries = db.relationship('JournalEntry', backref='user', lazy='dynamic', cascade='all, delete-orphan', order_by='JournalEntry.date.desc()')
    push_subscriptions = db.relationship('PushSubscription', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    email_tokens = db.relationship('EmailToken', backref='user', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'display_name': self.display_name,
            'email': self.email,
            'email_verified': self.email_verified,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'preferences': self.preferences.to_dict() if self.preferences else None
        }


class UserPreferences(db.Model):
    __tablename__ = 'user_preferences'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False)
    typical_cycle_length = db.Column(db.Integer, default=28, nullable=False)
    typical_period_duration = db.Column(db.Integer, default=5, nullable=False)
    cycle_regularity = db.Column(db.String(20), default='regular', nullable=False) # regular, irregular, unknown
    prediction_enabled = db.Column(db.Boolean, default=True, nullable=False)
    fertile_window_enabled = db.Column(db.Boolean, default=False, nullable=False)
    reminder_preferences = db.Column(db.JSON, default=lambda: {
        'period_reminder': False,
        'period_days_before': 2,
        'daily_checkin': False,
        'checkin_time': '20:00',
        'journal_reminder': False,
        'push_enabled': False,
        'email_enabled': False
    }, nullable=False)
    theme_preference = db.Column(db.String(20), default='light', nullable=False)
    accent_theme = db.Column(db.String(20), default='blush', nullable=False)
    language = db.Column(db.String(10), default='en', nullable=False)
    discreet_mode = db.Column(db.Boolean, default=False, nullable=False)
    app_lock_enabled = db.Column(db.Boolean, default=False, nullable=False)
    app_lock_pin_hash = db.Column(db.String(255), nullable=True)

    def to_dict(self):
        return {
            'typical_cycle_length': self.typical_cycle_length,
            'typical_period_duration': self.typical_period_duration,
            'cycle_regularity': self.cycle_regularity,
            'prediction_enabled': self.prediction_enabled,
            'fertile_window_enabled': self.fertile_window_enabled,
            'reminder_preferences': self.reminder_preferences or {},
            'theme_preference': self.theme_preference,
            'accent_theme': self.accent_theme,
            'language': self.language,
            'discreet_mode': self.discreet_mode,
            'app_lock_enabled': self.app_lock_enabled,
            'has_pin': bool(self.app_lock_pin_hash)
        }


class Period(db.Model):
    __tablename__ = 'periods'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    start_date = db.Column(db.Date, nullable=False, index=True)
    end_date = db.Column(db.Date, nullable=True)
    flow_intensity = db.Column(db.String(30), nullable=True) # spotting, light, medium, heavy
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=get_utc_now, nullable=False)
    updated_at = db.Column(db.DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)

    def to_dict(self):
        duration = None
        if self.start_date and self.end_date:
            duration = (self.end_date - self.start_date).days + 1
        return {
            'id': self.id,
            'user_id': self.user_id,
            'start_date': self.start_date.isoformat(),
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'flow_intensity': self.flow_intensity,
            'duration': duration,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class DailyCheckin(db.Model):
    __tablename__ = 'daily_checkins'
    __table_args__ = (
        UniqueConstraint('user_id', 'date', name='uq_user_daily_checkin_date'),
    )

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    date = db.Column(db.Date, nullable=False, index=True)
    flow_intensity = db.Column(db.String(30), nullable=True)
    symptoms = db.Column(db.JSON, default=list, nullable=False)
    mood = db.Column(db.String(50), nullable=True)
    energy_level = db.Column(db.Integer, nullable=True) # 1-5
    sleep_quality = db.Column(db.String(30), nullable=True)
    sleep_hours = db.Column(db.Float, nullable=True)
    water_glasses = db.Column(db.Integer, nullable=True)
    exercise = db.Column(db.JSON, nullable=True) # e.g. {"minutes": 30, "type": "walking"}
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=get_utc_now, nullable=False)
    updated_at = db.Column(db.DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'date': self.date.isoformat(),
            'flow_intensity': self.flow_intensity,
            'symptoms': self.symptoms or [],
            'mood': self.mood,
            'energy_level': self.energy_level,
            'sleep_quality': self.sleep_quality,
            'sleep_hours': self.sleep_hours,
            'water_glasses': self.water_glasses,
            'exercise': self.exercise,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class JournalEntry(db.Model):
    __tablename__ = 'journal_entries'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    date = db.Column(db.Date, nullable=False, index=True)
    mood = db.Column(db.String(50), nullable=True)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=get_utc_now, nullable=False)
    updated_at = db.Column(db.DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'date': self.date.isoformat(),
            'mood': self.mood,
            'content': self.content,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class PushSubscription(db.Model):
    __tablename__ = 'push_subscriptions'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    endpoint = db.Column(db.Text, nullable=False)
    keys = db.Column(db.JSON, nullable=False)
    created_at = db.Column(db.DateTime, default=get_utc_now, nullable=False)


class EmailToken(db.Model):
    __tablename__ = 'email_tokens'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    token_hash = db.Column(db.String(128), nullable=False, index=True)
    purpose = db.Column(db.String(32), nullable=False) # 'verify', 'reset'
    expires_at = db.Column(db.DateTime, nullable=False)
    used_at = db.Column(db.DateTime, nullable=True)
