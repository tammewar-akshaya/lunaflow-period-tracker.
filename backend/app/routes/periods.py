from datetime import date, datetime, timedelta
import calendar
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.models import Period, User, DailyCheckin, UserPreferences
from app.services.cycle_service import calculate_cycle_metrics

periods_bp = Blueprint('periods', __name__, url_prefix='/api')

def parse_date(date_str: str) -> date:
    """Parses YYYY-MM-DD date strictly without timezone mutation."""
    return datetime.strptime(date_str, '%Y-%m-%d').date()

@periods_bp.route('/periods', methods=['GET'])
@jwt_required()
def get_periods():
    user_id = int(get_jwt_identity())
    periods = Period.query.filter_by(user_id=user_id).order_by(Period.start_date.desc()).all()
    return jsonify({'periods': [p.to_dict() for p in periods]}), 200


@periods_bp.route('/periods', methods=['POST'])
@jwt_required()
def create_period():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    start_date_str = data.get('start_date')
    if not start_date_str:
        return jsonify({'error': 'start_date is required (YYYY-MM-DD)'}), 400

    try:
        start_date = parse_date(start_date_str)
    except ValueError:
        return jsonify({'error': 'Invalid start_date format, expected YYYY-MM-DD'}), 400

    end_date = None
    if data.get('end_date'):
        try:
            end_date = parse_date(data.get('end_date'))
            if end_date < start_date:
                return jsonify({'error': 'end_date cannot be earlier than start_date'}), 400
        except ValueError:
            return jsonify({'error': 'Invalid end_date format, expected YYYY-MM-DD'}), 400

    # Check for exact duplicate start_date
    existing = Period.query.filter_by(user_id=user_id, start_date=start_date).first()
    if existing:
        return jsonify({'error': 'A period starting on this date is already recorded. Please edit the existing entry.'}), 409

    # Check for overlapping periods
    effective_end = end_date or start_date
    overlapping = Period.query.filter(
        Period.user_id == user_id,
        Period.start_date <= effective_end,
        db.or_(Period.end_date == None, Period.end_date >= start_date)
    ).first()

    warning_msg = None
    if overlapping:
        warning_msg = f"Note: This entry overlaps with an existing period ({overlapping.start_date} to {overlapping.end_date or 'ongoing'})."

    period = Period(
        user_id=user_id,
        start_date=start_date,
        end_date=end_date,
        flow_intensity=data.get('flow_intensity', 'medium'),
        notes=(data.get('notes') or '').strip() or None
    )
    db.session.add(period)
    db.session.commit()

    return jsonify({
        'message': 'Period recorded successfully.',
        'warning': warning_msg,
        'period': period.to_dict()
    }), 201


@periods_bp.route('/periods/<int:period_id>', methods=['GET'])
@jwt_required()
def get_period(period_id):
    user_id = int(get_jwt_identity())
    period = Period.query.filter_by(id=period_id, user_id=user_id).first()
    if not period:
        return jsonify({'error': 'Period record not found or access denied.'}), 404
    return jsonify({'period': period.to_dict()}), 200


@periods_bp.route('/periods/<int:period_id>', methods=['PATCH', 'PUT'])
@jwt_required()
def update_period(period_id):
    user_id = int(get_jwt_identity())
    period = Period.query.filter_by(id=period_id, user_id=user_id).first()
    if not period:
        return jsonify({'error': 'Period record not found or access denied.'}), 404

    data = request.get_json() or {}

    if 'start_date' in data:
        try:
            period.start_date = parse_date(data['start_date'])
        except ValueError:
            return jsonify({'error': 'Invalid start_date format (YYYY-MM-DD)'}), 400

    if 'end_date' in data:
        if data['end_date'] is None or data['end_date'] == '':
            period.end_date = None
        else:
            try:
                e_date = parse_date(data['end_date'])
                if e_date < period.start_date:
                    return jsonify({'error': 'end_date cannot be earlier than start_date'}), 400
                period.end_date = e_date
            except ValueError:
                return jsonify({'error': 'Invalid end_date format (YYYY-MM-DD)'}), 400

    if 'flow_intensity' in data:
        period.flow_intensity = data['flow_intensity']

    if 'notes' in data:
        period.notes = data['notes'].strip() if data['notes'] else None

    db.session.commit()
    return jsonify({
        'message': 'Period updated successfully.',
        'period': period.to_dict()
    }), 200


@periods_bp.route('/periods/<int:period_id>', methods=['DELETE'])
@jwt_required()
def delete_period(period_id):
    user_id = int(get_jwt_identity())
    period = Period.query.filter_by(id=period_id, user_id=user_id).first()
    if not period:
        return jsonify({'error': 'Period record not found or access denied.'}), 404

    deleted_data = period.to_dict()
    db.session.delete(period)
    db.session.commit()

    return jsonify({
        'message': 'Period deleted successfully.',
        'deleted_period': deleted_data
    }), 200


@periods_bp.route('/calendar', methods=['GET'])
@jwt_required()
def get_calendar_month():
    user_id = int(get_jwt_identity())
    month_param = request.args.get('month') # e.g. "2026-10"

    today = date.today()
    if month_param:
        try:
            year, month = map(int, month_param.split('-'))
        except ValueError:
            return jsonify({'error': 'Invalid month parameter. Format must be YYYY-MM'}), 400
    else:
        year, month = today.year, today.month

    # Calculate month date bounds
    _, num_days = calendar.monthrange(year, month)
    first_day = date(year, month, 1)
    last_day = date(year, month, num_days)

    # Fetch user periods and preferences
    user = db.session.get(User, user_id)
    periods = Period.query.filter_by(user_id=user_id).order_by(Period.start_date.asc()).all()
    preferences = user.preferences if user else None

    metrics = calculate_cycle_metrics(periods, preferences)

    # Days mapping for month
    # Identify period days in this month
    period_days = {} # "YYYY-MM-DD": {'flow': ..., 'is_start': ..., 'is_end': ..., 'period_id': ...}
    for p in periods:
        p_start = p.start_date
        p_end = p.end_date or p.start_date
        # Check intersection with current month
        if p_start <= last_day and p_end >= first_day:
            curr = max(p_start, first_day)
            end_limit = min(p_end, last_day)
            while curr <= end_limit:
                d_str = curr.isoformat()
                period_days[d_str] = {
                    'period_id': p.id,
                    'flow_intensity': p.flow_intensity or 'medium',
                    'is_start': (curr == p.start_date),
                    'is_end': (curr == p.end_date),
                    'notes': p.notes
                }
                curr += timedelta(days=1)

    # Predicted days for this month (if predictions enabled)
    predicted_days = {}
    if metrics.get('next_predicted_start') and metrics.get('next_predicted_end'):
        pred_start = parse_date(metrics['next_predicted_start'])
        pred_end = parse_date(metrics['next_predicted_end'])
        
        # Also project next 2 cycles if within viewing window
        avg_len = metrics.get('average_cycle_length', 28)
        avg_dur = metrics.get('average_period_duration', 5)

        for cycle_step in range(3):
            cur_p_start = pred_start + timedelta(days=cycle_step * avg_len)
            cur_p_end = cur_p_start + timedelta(days=avg_dur - 1)
            if cur_p_start <= last_day and cur_p_end >= first_day:
                curr = max(cur_p_start, first_day)
                end_limit = min(cur_p_end, last_day)
                while curr <= end_limit:
                    d_str = curr.isoformat()
                    # Real days take priority over predictions
                    if d_str not in period_days:
                        predicted_days[d_str] = {
                            'is_predicted': True,
                            'is_start': (curr == cur_p_start),
                            'is_end': (curr == cur_p_end)
                        }
                    curr += timedelta(days=1)

    # Fertile window days (if enabled)
    fertile_days = {}
    fertile_info = metrics.get('fertile_window')
    if fertile_info and preferences and preferences.fertile_window_enabled:
        f_start = parse_date(fertile_info['fertile_start'])
        f_end = parse_date(fertile_info['fertile_end'])
        ov_date = parse_date(fertile_info['ovulation_date'])

        curr = max(f_start, first_day)
        end_limit = min(f_end, last_day)
        while curr <= end_limit:
            d_str = curr.isoformat()
            fertile_days[d_str] = {
                'is_ovulation': (curr == ov_date)
            }
            curr += timedelta(days=1)

    # Fetch daily check-ins for the month
    checkins = DailyCheckin.query.filter(
        DailyCheckin.user_id == user_id,
        DailyCheckin.date >= first_day,
        DailyCheckin.date <= last_day
    ).all()
    checkins_map = {c.date.isoformat(): c.to_dict() for c in checkins}

    return jsonify({
        'year': year,
        'month': month,
        'num_days': num_days,
        'first_day_weekday': first_day.weekday(), # 0 = Monday, 6 = Sunday
        'period_days': period_days,
        'predicted_days': predicted_days,
        'fertile_days': fertile_days,
        'checkins': checkins_map,
        'cycle_metrics': metrics
    }), 200


@periods_bp.route('/cycle/predictions', methods=['GET'])
@jwt_required()
def get_predictions():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    periods = Period.query.filter_by(user_id=user_id).order_by(Period.start_date.asc()).all()
    metrics = calculate_cycle_metrics(periods, user.preferences if user else None)
    return jsonify({'metrics': metrics}), 200


@periods_bp.route('/cycle/insights', methods=['GET'])
@jwt_required()
def get_insights():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    periods = Period.query.filter_by(user_id=user_id).order_by(Period.start_date.asc()).all()
    checkins = DailyCheckin.query.filter_by(user_id=user_id).all()
    metrics = calculate_cycle_metrics(periods, user.preferences if user else None)

    # Pattern observations based strictly on user's own real data
    # (Requires at least 2 recorded cycles and symptoms to avoid false patterns)
    patterns = []
    if len(periods) >= 2 and len(checkins) >= 3:
        # Check symptoms appearing 1-3 days before period starts
        pre_period_symptoms = {}
        for p in periods:
            for day_offset in [1, 2, 3]:
                check_d = p.start_date - timedelta(days=day_offset)
                c = next((ch for ch in checkins if ch.date == check_d), None)
                if c and c.symptoms:
                    for s in c.symptoms:
                        pre_period_symptoms[s] = pre_period_symptoms.get(s, 0) + 1

        for sym, cnt in pre_period_symptoms.items():
            if cnt >= 2:
                sym_clean = sym.replace('_', ' ').capitalize()
                patterns.append(f"{sym_clean} was observed in your logs 1–3 days prior to your period in {cnt} recorded cycles.")

        # Check most frequent mood during menstrual flow
        flow_moods = {}
        for c in checkins:
            if c.flow_intensity and c.mood:
                flow_moods[c.mood] = flow_moods.get(c.mood, 0) + 1

        if flow_moods:
            top_mood = max(flow_moods.items(), key=lambda x: x[1])
            if top_mood[1] >= 2:
                patterns.append(f"'{top_mood[0].capitalize()}' is your most frequently logged mood during period days.")

    return jsonify({
        'metrics': metrics,
        'patterns': patterns,
        'disclaimer': 'LunaFlow is for personal wellness tracking only and does not provide medical diagnoses or treatment recommendations.'
    }), 200
