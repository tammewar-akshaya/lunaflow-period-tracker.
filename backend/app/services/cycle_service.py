from datetime import date, timedelta
import math
from typing import List, Dict, Any, Optional
from app.models.models import Period, UserPreferences

def calculate_cycle_metrics(periods: List[Period], preferences: Optional[UserPreferences] = None) -> Dict[str, Any]:
    """
    Computes transparent cycle metrics, averages, predictions, and fertile window estimates.
    Requires at least 2 consecutive periods to calculate a real historical cycle length.
    Otherwise falls back to user preferences (default 28/5).
    """
    default_cycle_length = preferences.typical_cycle_length if preferences else 28
    default_period_duration = preferences.typical_period_duration if preferences else 5
    prediction_enabled = preferences.prediction_enabled if preferences else True
    fertile_window_enabled = preferences.fertile_window_enabled if preferences else False

    # Sort periods by start_date ascending for accurate calculation
    sorted_periods = sorted(periods, key=lambda p: p.start_date)

    if not sorted_periods:
        return {
            'has_enough_data': False,
            'message': 'Your predictions will become more useful as you record more cycles.',
            'average_cycle_length': default_cycle_length,
            'average_period_duration': default_period_duration,
            'cycle_variation_high': False,
            'irregularity_notice': None,
            'last_period': None,
            'next_predicted_start': None,
            'next_predicted_end': None,
            'fertile_window': None,
            'current_cycle_day': None,
            'current_phase': None,
            'phase_tips': 'Log your first period to receive personalized cycle rhythm insights.',
            'total_periods_logged': 0
        }

    # Calculate individual period durations
    recorded_durations = []
    for p in sorted_periods:
        if p.end_date and p.end_date >= p.start_date:
            dur = (p.end_date - p.start_date).days + 1
            # Filter realistic period lengths (e.g., 1 to 14 days)
            if 1 <= dur <= 14:
                recorded_durations.append(dur)

    avg_duration = round(sum(recorded_durations) / len(recorded_durations)) if recorded_durations else default_period_duration

    # Calculate cycle lengths between consecutive start dates
    cycle_lengths = []
    for i in range(len(sorted_periods) - 1):
        c_len = (sorted_periods[i + 1].start_date - sorted_periods[i].start_date).days
        # Valid menstrual cycles usually range between 20 and 55 days
        if 20 <= c_len <= 55:
            cycle_lengths.append(c_len)

    has_enough_data = len(cycle_lengths) >= 1
    if has_enough_data:
        avg_cycle_length = round(sum(cycle_lengths) / len(cycle_lengths))
    else:
        avg_cycle_length = default_cycle_length

    # Irregularity assessment
    cycle_variation_high = False
    irregularity_notice = None
    if len(cycle_lengths) >= 2:
        variance = sum((x - avg_cycle_length) ** 2 for x in cycle_lengths) / len(cycle_lengths)
        std_dev = math.sqrt(variance)
        if std_dev >= 4.5 or (max(cycle_lengths) - min(cycle_lengths) >= 8):
            cycle_variation_high = True
            irregularity_notice = "Your cycles vary quite a bit. If this worries you, consider talking to a doctor or healthcare provider."

    last_period = sorted_periods[-1]
    last_start = last_period.start_date
    today = date.today()

    # Next period prediction
    next_predicted_start = None
    next_predicted_end = None
    fertile_window = None

    if prediction_enabled:
        # If last period was in the past, step forward by avg_cycle_length until predicted date is in future or today
        predicted_start = last_start + timedelta(days=avg_cycle_length)
        while predicted_start < today and (today - predicted_start).days > 7:
            predicted_start += timedelta(days=avg_cycle_length)

        next_predicted_start = predicted_start
        next_predicted_end = predicted_start + timedelta(days=avg_duration - 1)

        # Ovulation and fertile window calculation (estimate only)
        # Ovulation typically occurs 14 days before next period start
        ovulation_date = next_predicted_start - timedelta(days=14)
        fertile_start = ovulation_date - timedelta(days=5)
        fertile_end = ovulation_date + timedelta(days=1)

        if fertile_window_enabled:
            fertile_window = {
                'ovulation_date': ovulation_date.isoformat(),
                'fertile_start': fertile_start.isoformat(),
                'fertile_end': fertile_end.isoformat(),
                'disclaimer': 'Estimate only, not contraception or medical diagnosis.'
            }

    # Current cycle day and phase calculation
    current_cycle_day = (today - last_start).days + 1 if today >= last_start else 1

    current_phase = None
    phase_tips = ""

    if current_cycle_day <= avg_duration:
        current_phase = "Menstrual"
        phase_tips = "Rest, hydrate, and nourish yourself with warm foods and gentle movement like stretching."
    elif current_cycle_day <= (avg_cycle_length - 16):
        current_phase = "Follicular"
        phase_tips = "Energy and mental clarity often increase. A great time for fresh beginnings, creative projects, and active workouts."
    elif current_cycle_day <= (avg_cycle_length - 12):
        current_phase = "Ovulation"
        phase_tips = "Peak social energy and confidence. Stay hydrated and prioritize quality sleep."
    else:
        current_phase = "Luteal"
        phase_tips = "Energy naturally winds down. Practice calming rituals, eat nutrient-dense meals, and take warm baths."

    return {
        'has_enough_data': has_enough_data,
        'message': None if has_enough_data else 'Your predictions will become more useful as you record more cycles.',
        'average_cycle_length': avg_cycle_length,
        'average_period_duration': avg_duration,
        'cycle_lengths_history': cycle_lengths,
        'cycle_variation_high': cycle_variation_high,
        'irregularity_notice': irregularity_notice,
        'last_period': {
            'id': last_period.id,
            'start_date': last_period.start_date.isoformat(),
            'end_date': last_period.end_date.isoformat() if last_period.end_date else None,
            'duration': (last_period.end_date - last_period.start_date).days + 1 if last_period.end_date else avg_duration
        },
        'next_predicted_start': next_predicted_start.isoformat() if next_predicted_start else None,
        'next_predicted_end': next_predicted_end.isoformat() if next_predicted_end else None,
        'fertile_window': fertile_window,
        'current_cycle_day': current_cycle_day,
        'current_phase': current_phase,
        'phase_tips': phase_tips,
        'total_periods_logged': len(sorted_periods)
    }
