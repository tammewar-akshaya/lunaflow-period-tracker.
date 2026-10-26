from datetime import datetime, date
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.models import DailyCheckin, JournalEntry

wellness_bp = Blueprint('wellness', __name__, url_prefix='/api')

def parse_date(date_str: str) -> date:
    return datetime.strptime(date_str, '%Y-%m-%d').date()

# ----------------- DAILY CHECK-INS -----------------

@wellness_bp.route('/checkins', methods=['GET'])
@jwt_required()
def get_checkin():
    user_id = int(get_jwt_identity())
    date_str = request.args.get('date')

    if date_str:
        try:
            target_date = parse_date(date_str)
            checkin = DailyCheckin.query.filter_by(user_id=user_id, date=target_date).first()
            return jsonify({'checkin': checkin.to_dict() if checkin else None}), 200
        except ValueError:
            return jsonify({'error': 'Invalid date format (YYYY-MM-DD)'}), 400

    # Otherwise return recent checkins
    limit = int(request.args.get('limit', 30))
    checkins = DailyCheckin.query.filter_by(user_id=user_id).order_by(DailyCheckin.date.desc()).limit(limit).all()
    return jsonify({'checkins': [c.to_dict() for c in checkins]}), 200


@wellness_bp.route('/checkins', methods=['POST'])
@jwt_required()
def save_checkin():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    date_str = data.get('date')
    if not date_str:
        return jsonify({'error': 'Date is required (YYYY-MM-DD)'}), 400

    try:
        checkin_date = parse_date(date_str)
    except ValueError:
        return jsonify({'error': 'Invalid date format (YYYY-MM-DD)'}), 400

    # Upsert logic: if check-in for this user and date exists, update it
    checkin = DailyCheckin.query.filter_by(user_id=user_id, date=checkin_date).first()
    if not checkin:
        checkin = DailyCheckin(user_id=user_id, date=checkin_date)
        db.session.add(checkin)

    if 'flow_intensity' in data:
        checkin.flow_intensity = data['flow_intensity']
    if 'symptoms' in data:
        checkin.symptoms = data['symptoms'] if isinstance(data['symptoms'], list) else []
    if 'mood' in data:
        checkin.mood = data['mood']
    if 'energy_level' in data:
        checkin.energy_level = data['energy_level']
    if 'sleep_quality' in data:
        checkin.sleep_quality = data['sleep_quality']
    if 'sleep_hours' in data:
        checkin.sleep_hours = float(data['sleep_hours']) if data['sleep_hours'] is not None else None
    if 'water_glasses' in data:
        checkin.water_glasses = int(data['water_glasses']) if data['water_glasses'] is not None else None
    if 'exercise' in data:
        checkin.exercise = data['exercise']
    if 'notes' in data:
        checkin.notes = data['notes'].strip() if data['notes'] else None

    db.session.commit()
    return jsonify({
        'message': 'Check-in saved successfully.',
        'checkin': checkin.to_dict()
    }), 200


@wellness_bp.route('/checkins/<int:checkin_id>', methods=['PATCH', 'PUT'])
@jwt_required()
def update_checkin(checkin_id):
    user_id = int(get_jwt_identity())
    checkin = DailyCheckin.query.filter_by(id=checkin_id, user_id=user_id).first()
    if not checkin:
        return jsonify({'error': 'Check-in not found or unauthorized.'}), 404

    data = request.get_json() or {}
    for field in ['flow_intensity', 'mood', 'energy_level', 'sleep_quality', 'sleep_hours', 'water_glasses', 'exercise']:
        if field in data:
            setattr(checkin, field, data[field])
    if 'symptoms' in data and isinstance(data['symptoms'], list):
        checkin.symptoms = data['symptoms']
    if 'notes' in data:
        checkin.notes = data['notes'].strip() if data['notes'] else None

    db.session.commit()
    return jsonify({'message': 'Check-in updated.', 'checkin': checkin.to_dict()}), 200


@wellness_bp.route('/checkins/<int:checkin_id>', methods=['DELETE'])
@jwt_required()
def delete_checkin(checkin_id):
    user_id = int(get_jwt_identity())
    checkin = DailyCheckin.query.filter_by(id=checkin_id, user_id=user_id).first()
    if not checkin:
        return jsonify({'error': 'Check-in not found or unauthorized.'}), 404

    db.session.delete(checkin)
    db.session.commit()
    return jsonify({'message': 'Check-in deleted successfully.'}), 200


# ----------------- WELLNESS JOURNAL -----------------

@wellness_bp.route('/journal', methods=['GET'])
@jwt_required()
def get_journal_entries():
    user_id = int(get_jwt_identity())
    entries = JournalEntry.query.filter_by(user_id=user_id).order_by(JournalEntry.date.desc(), JournalEntry.created_at.desc()).all()
    return jsonify({'entries': [e.to_dict() for e in entries]}), 200


@wellness_bp.route('/journal', methods=['POST'])
@jwt_required()
def create_journal_entry():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    content = data.get('content', '').strip()
    if not content:
        return jsonify({'error': 'Journal content cannot be empty.'}), 400

    date_str = data.get('date')
    entry_date = date.today()
    if date_str:
        try:
            entry_date = parse_date(date_str)
        except ValueError:
            return jsonify({'error': 'Invalid date format (YYYY-MM-DD)'}), 400

    entry = JournalEntry(
        user_id=user_id,
        date=entry_date,
        mood=data.get('mood'),
        content=content
    )
    db.session.add(entry)
    db.session.commit()

    return jsonify({
        'message': 'Journal entry saved.',
        'entry': entry.to_dict()
    }), 201


@wellness_bp.route('/journal/<int:entry_id>', methods=['PATCH', 'PUT'])
@jwt_required()
def update_journal_entry(entry_id):
    user_id = int(get_jwt_identity())
    entry = JournalEntry.query.filter_by(id=entry_id, user_id=user_id).first()
    if not entry:
        return jsonify({'error': 'Journal entry not found or unauthorized.'}), 404

    data = request.get_json() or {}
    if 'content' in data:
        content = data['content'].strip()
        if not content:
            return jsonify({'error': 'Journal content cannot be empty.'}), 400
        entry.content = content

    if 'mood' in data:
        entry.mood = data['mood']

    if 'date' in data:
        try:
            entry.date = parse_date(data['date'])
        except ValueError:
            return jsonify({'error': 'Invalid date format (YYYY-MM-DD)'}), 400

    db.session.commit()
    return jsonify({'message': 'Journal entry updated.', 'entry': entry.to_dict()}), 200


@wellness_bp.route('/journal/<int:entry_id>', methods=['DELETE'])
@jwt_required()
def delete_journal_entry(entry_id):
    user_id = int(get_jwt_identity())
    entry = JournalEntry.query.filter_by(id=entry_id, user_id=user_id).first()
    if not entry:
        return jsonify({'error': 'Journal entry not found or unauthorized.'}), 404

    db.session.delete(entry)
    db.session.commit()
    return jsonify({'message': 'Journal entry deleted.'}), 200
