import csv
import io
import json
from datetime import datetime, date, timezone
from flask import Blueprint, request, jsonify, Response, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.models import User, UserPreferences, Period, DailyCheckin, JournalEntry, PushSubscription
from app.utils.security import hash_pin, verify_password
from app.services.pdf_service import generate_doctor_report

user_bp = Blueprint('user', __name__, url_prefix='/api')

def parse_date(date_str: str) -> date:
    return datetime.strptime(date_str, '%Y-%m-%d').date()

# ----------------- PROFILE & PREFERENCES -----------------

@user_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'error': 'User not found.'}), 404

    return jsonify({
        'user': user.to_dict(),
        'preferences': user.preferences.to_dict() if user.preferences else {}
    }), 200


@user_bp.route('/profile', methods=['PATCH', 'PUT'])
@jwt_required()
def update_profile():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'error': 'User not found.'}), 404

    data = request.get_json() or {}

    # Update basic user info
    if 'display_name' in data and data['display_name'].strip():
        user.display_name = data['display_name'].strip()

    # Update preferences
    pref = user.preferences
    if not pref:
        pref = UserPreferences(user_id=user.id)
        db.session.add(pref)

    if 'typical_cycle_length' in data:
        val = int(data['typical_cycle_length'])
        if 15 <= val <= 90:
            pref.typical_cycle_length = val
    if 'typical_period_duration' in data:
        val = int(data['typical_period_duration'])
        if 1 <= val <= 20:
            pref.typical_period_duration = val
    if 'cycle_regularity' in data:
        pref.cycle_regularity = data['cycle_regularity']
    if 'prediction_enabled' in data:
        pref.prediction_enabled = bool(data['prediction_enabled'])
    if 'fertile_window_enabled' in data:
        pref.fertile_window_enabled = bool(data['fertile_window_enabled'])
    if 'reminder_preferences' in data and isinstance(data['reminder_preferences'], dict):
        pref.reminder_preferences = data['reminder_preferences']
    if 'theme_preference' in data and data['theme_preference'] in ['light', 'dark']:
        pref.theme_preference = data['theme_preference']
    if 'accent_theme' in data and data['accent_theme'] in ['blush', 'lavender', 'sage']:
        pref.accent_theme = data['accent_theme']
    if 'language' in data and data['language'] in ['en', 'hi', 'te']:
        pref.language = data['language']
    if 'discreet_mode' in data:
        pref.discreet_mode = bool(data['discreet_mode'])
    if 'app_lock_enabled' in data:
        pref.app_lock_enabled = bool(data['app_lock_enabled'])
        if not pref.app_lock_enabled:
            pref.app_lock_pin_hash = None
    if 'app_lock_pin' in data and data['app_lock_pin']:
        pin_str = str(data['app_lock_pin']).strip()
        if len(pin_str) >= 4:
            pref.app_lock_pin_hash = hash_pin(pin_str)
            pref.app_lock_enabled = True

    db.session.commit()
    return jsonify({
        'message': 'Profile updated successfully.',
        'user': user.to_dict(),
        'preferences': pref.to_dict()
    }), 200


# ----------------- DATA EXPORT (JSON & CSV) -----------------

@user_bp.route('/export', methods=['GET'])
@jwt_required()
def export_user_data():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'error': 'User not found.'}), 404

    export_format = request.args.get('format', 'json').lower()

    periods = Period.query.filter_by(user_id=user_id).order_by(Period.start_date.asc()).all()
    checkins = DailyCheckin.query.filter_by(user_id=user_id).order_by(DailyCheckin.date.asc()).all()
    journals = JournalEntry.query.filter_by(user_id=user_id).order_by(JournalEntry.date.asc()).all()

    if export_format == 'csv':
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Period Records CSV
        writer.writerow(['RECORD_TYPE', 'START_DATE', 'END_DATE', 'FLOW_INTENSITY', 'DURATION_DAYS', 'NOTES'])
        for p in periods:
            dur = (p.end_date - p.start_date).days + 1 if p.end_date else 1
            writer.writerow(['PERIOD', p.start_date.isoformat(), p.end_date.isoformat() if p.end_date else '', p.flow_intensity or '', dur, p.notes or ''])
        
        writer.writerow([])
        writer.writerow(['RECORD_TYPE', 'DATE', 'FLOW', 'SYMPTOMS', 'MOOD', 'ENERGY', 'SLEEP_HRS', 'WATER_GLASSES', 'NOTES'])
        for c in checkins:
            syms_str = "; ".join(c.symptoms) if c.symptoms else ""
            writer.writerow(['CHECKIN', c.date.isoformat(), c.flow_intensity or '', syms_str, c.mood or '', c.energy_level or '', c.sleep_hours or '', c.water_glasses or '', c.notes or ''])

        return Response(
            output.getvalue(),
            mimetype="text/csv",
            headers={"Content-disposition": f"attachment; filename=lunaflow_export_{date.today().isoformat()}.csv"}
        )

    # JSON Export
    data = {
        'export_metadata': {
            'app': 'LunaFlow',
            'exported_at': datetime.now(timezone.utc).isoformat(),
            'user': user.display_name,
            'email': user.email
        },
        'preferences': user.preferences.to_dict() if user.preferences else {},
        'periods': [p.to_dict() for p in periods],
        'checkins': [c.to_dict() for c in checkins],
        'journal_entries': [j.to_dict() for j in journals]
    }
    return Response(
        json.dumps(data, indent=2),
        mimetype="application/json",
        headers={"Content-disposition": f"attachment; filename=lunaflow_export_{date.today().isoformat()}.json"}
    )


# ----------------- DATA IMPORT (CSV) -----------------

@user_bp.route('/import', methods=['POST'])
@jwt_required()
def import_csv():
    user_id = int(get_jwt_identity())
    
    # Can accept raw CSV text or multipart file
    csv_content = ""
    if 'file' in request.files:
        f = request.files['file']
        csv_content = f.read().decode('utf-8', errors='ignore')
    elif request.is_json and 'csv_text' in request.json:
        csv_content = request.json['csv_text']
    else:
        csv_content = request.get_data(as_text=True)

    if not csv_content.strip():
        return jsonify({'error': 'No CSV data provided.'}), 400

    preview_only = request.args.get('preview', 'false').lower() == 'true'

    reader = csv.reader(io.StringIO(csv_content))
    rows = list(reader)
    if not rows:
        return jsonify({'error': 'Empty CSV file.'}), 400

    imported_periods = []
    skipped_rows = 0

    for idx, row in enumerate(rows):
        if not row or len(row) < 1:
            continue
        # Skip header rows
        first_col = row[0].strip().upper()
        if 'DATE' in first_col or 'START' in first_col or 'RECORD_TYPE' in first_col:
            continue

        try:
            # Handle LunaFlow CSV format or standard tracker format (start_date, [end_date], [flow])
            if first_col == 'PERIOD' and len(row) >= 3:
                start_str = row[1].strip()
                end_str = row[2].strip() if len(row) > 2 else ""
                flow = row[3].strip() if len(row) > 3 else "medium"
            else:
                start_str = row[0].strip()
                end_str = row[1].strip() if len(row) > 1 and row[1].strip() else ""
                flow = row[2].strip() if len(row) > 2 and row[2].strip() else "medium"

            s_date = parse_date(start_str)
            e_date = parse_date(end_str) if end_str else None
            
            if e_date and e_date < s_date:
                skipped_rows += 1
                continue

            imported_periods.append({
                'start_date': s_date.isoformat(),
                'end_date': e_date.isoformat() if e_date else None,
                'flow_intensity': flow or 'medium'
            })
        except Exception:
            skipped_rows += 1
            continue

    if preview_only:
        return jsonify({
            'preview': True,
            'valid_periods_count': len(imported_periods),
            'skipped_rows': skipped_rows,
            'sample': imported_periods[:5]
        }), 200

    # Save to database
    saved_count = 0
    for item in imported_periods:
        s_date = parse_date(item['start_date'])
        existing = Period.query.filter_by(user_id=user_id, start_date=s_date).first()
        if not existing:
            p = Period(
                user_id=user_id,
                start_date=s_date,
                end_date=parse_date(item['end_date']) if item['end_date'] else None,
                flow_intensity=item['flow_intensity']
            )
            db.session.add(p)
            saved_count += 1

    db.session.commit()
    return jsonify({
        'message': f'Successfully imported {saved_count} period records.',
        'imported_count': saved_count,
        'skipped_rows': skipped_rows
    }), 200


# ----------------- DOCTOR CONSULTATION PDF REPORT -----------------

@user_bp.route('/report/pdf', methods=['GET'])
@jwt_required()
def get_pdf_report():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'error': 'User not found.'}), 404

    from_str = request.args.get('from')
    to_str = request.args.get('to')
    from_date = parse_date(from_str) if from_str else None
    to_date = parse_date(to_str) if to_str else None

    # Query periods in range
    p_query = Period.query.filter_by(user_id=user_id)
    c_query = DailyCheckin.query.filter_by(user_id=user_id)

    if from_date:
        p_query = p_query.filter(Period.start_date >= from_date)
        c_query = c_query.filter(DailyCheckin.date >= from_date)
    if to_date:
        p_query = p_query.filter(Period.start_date <= to_date)
        c_query = c_query.filter(DailyCheckin.date <= to_date)

    periods = p_query.order_by(Period.start_date.asc()).all()
    checkins = c_query.order_by(DailyCheckin.date.asc()).all()

    pdf_bytes = generate_doctor_report(user, periods, checkins, from_date, to_date)

    return Response(
        pdf_bytes,
        mimetype="application/pdf",
        headers={"Content-disposition": f"attachment; filename=lunaflow_doctor_report_{date.today().isoformat()}.pdf"}
    )


# ----------------- ACCOUNT DELETION (PRIVACY FIRST) -----------------

@user_bp.route('/account', methods=['DELETE'])
@jwt_required()
def delete_account():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'error': 'User not found.'}), 404

    data = request.get_json() or {}
    password = data.get('password', '')

    if not verify_password(user.password_hash, password):
        return jsonify({'error': 'Incorrect password. Account deletion requires password confirmation.'}), 403

    # All related records (periods, checkins, journals, tokens) are deleted via CASCADE
    db.session.delete(user)
    db.session.commit()

    return jsonify({
        'message': 'Your account and all associated health and personal records have been permanently deleted.'
    }), 200


# ----------------- WEB PUSH NOTIFICATIONS -----------------

@user_bp.route('/push/subscribe', methods=['POST'])
@jwt_required()
def subscribe_push():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    endpoint = data.get('endpoint')
    keys = data.get('keys')

    if not endpoint or not keys:
        return jsonify({'error': 'Push endpoint and encryption keys are required.'}), 400

    existing = PushSubscription.query.filter_by(user_id=user_id, endpoint=endpoint).first()
    if not existing:
        sub = PushSubscription(user_id=user_id, endpoint=endpoint, keys=keys)
        db.session.add(sub)
        db.session.commit()

    return jsonify({'message': 'Push subscription saved.'}), 200


@user_bp.route('/push/subscribe', methods=['DELETE'])
@jwt_required()
def unsubscribe_push():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    endpoint = data.get('endpoint')

    if endpoint:
        sub = PushSubscription.query.filter_by(user_id=user_id, endpoint=endpoint).first()
        if sub:
            db.session.delete(sub)
            db.session.commit()
    else:
        PushSubscription.query.filter_by(user_id=user_id).delete()
        db.session.commit()

    return jsonify({'message': 'Push subscription removed.'}), 200
