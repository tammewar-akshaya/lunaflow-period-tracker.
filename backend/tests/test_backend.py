import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pytest
import io
import json
import logging
from datetime import date, timedelta
from app import create_app

from app.extensions import db
from app.models.models import User, Period, DailyCheckin, JournalEntry
from app.utils.logger import HealthDataSanitizingFilter

class TestConfig:
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = 'test-secret-key-at-least-32-bytes-long-for-tests'
    JWT_SECRET_KEY = 'lunaflow-test-jwt-secret-key-32-bytes-long-for-tests'
    WTF_CSRF_ENABLED = False
    RATELIMIT_ENABLED = False

@pytest.fixture
def app():
    app = create_app(TestConfig)
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

def register_and_login(client, email='jane@example.com', password='Password123!', name='Jane Doe'):
    client.post('/api/auth/register', json={
        'display_name': name,
        'email': email,
        'password': password,
        'confirm_password': password,
        'privacy_policy_agreed': True
    })
    res = client.post('/api/auth/login', json={'email': email, 'password': password})
    return res.get_json()['access_token']

def test_registration_and_login(client):
    res = client.post('/api/auth/register', json={
        'display_name': 'Alice Test',
        'email': 'alice@example.com',
        'password': 'Password123!',
        'confirm_password': 'Password123!',
        'privacy_policy_agreed': True
    })
    assert res.status_code == 201
    data = res.get_json()
    assert 'access_token' in data
    assert data['user']['email'] == 'alice@example.com'

    # Duplicate registration should return 409
    dup = client.post('/api/auth/register', json={
        'display_name': 'Alice Test',
        'email': 'alice@example.com',
        'password': 'Password123!',
        'confirm_password': 'Password123!',
        'privacy_policy_agreed': True
    })
    assert dup.status_code == 409

    # Login
    login_res = client.post('/api/auth/login', json={
        'email': 'alice@example.com',
        'password': 'Password123!'
    })
    assert login_res.status_code == 200
    assert 'access_token' in login_res.get_json()

def test_unauthorized_access(client):
    res = client.get('/api/periods')
    assert res.status_code == 401

def test_email_verification_flow(client):
    reg = client.post('/api/auth/register', json={
        'display_name': 'Bob Test',
        'email': 'bob@example.com',
        'password': 'Password123!',
        'confirm_password': 'Password123!',
        'privacy_policy_agreed': True
    })
    token = reg.get_json()['dev_verification_token']
    
    # Verify
    verify_res = client.post('/api/auth/verify-email', json={
        'token': token,
        'email': 'bob@example.com'
    })
    assert verify_res.status_code == 200
    assert verify_res.get_json()['user']['email_verified'] is True

def test_periods_crud_and_calculations(client):
    token = register_and_login(client, 'carol@example.com')
    headers = {'Authorization': f'Bearer {token}'}

    # Create cycle 1 (28 days ago)
    d1_start = (date.today() - timedelta(days=28)).isoformat()
    d1_end = (date.today() - timedelta(days=24)).isoformat()
    res1 = client.post('/api/periods', headers=headers, json={
        'start_date': d1_start,
        'end_date': d1_end,
        'flow_intensity': 'heavy',
        'notes': 'Cycle 1'
    })
    assert res1.status_code == 201

    # Create cycle 2 (today)
    d2_start = date.today().isoformat()
    d2_end = (date.today() + timedelta(days=4)).isoformat()
    res2 = client.post('/api/periods', headers=headers, json={
        'start_date': d2_start,
        'end_date': d2_end,
        'flow_intensity': 'medium',
        'notes': 'Cycle 2'
    })
    assert res2.status_code == 201

    # Check predictions
    pred_res = client.get('/api/cycle/predictions', headers=headers)
    assert pred_res.status_code == 200
    data = pred_res.get_json()['metrics']
    assert data['has_enough_data'] is True
    assert data['average_cycle_length'] == 28
    assert data['total_periods_logged'] == 2

    # Calendar endpoint
    cal_res = client.get(f'/api/calendar?month={date.today().strftime("%Y-%m")}', headers=headers)
    assert cal_res.status_code == 200
    cal_data = cal_res.get_json()
    assert d2_start in cal_data['period_days']

    # Update period
    p_id = res2.get_json()['period']['id']
    upd_res = client.patch(f'/api/periods/{p_id}', headers=headers, json={'notes': 'Updated cycle 2'})
    assert upd_res.status_code == 200
    assert upd_res.get_json()['period']['notes'] == 'Updated cycle 2'

    # Delete period
    del_res = client.delete(f'/api/periods/{p_id}', headers=headers)
    assert del_res.status_code == 200

def test_user_data_isolation(client):
    token1 = register_and_login(client, 'user1@example.com')
    token2 = register_and_login(client, 'user2@example.com')

    # User 1 creates period
    p_res = client.post('/api/periods', headers={'Authorization': f'Bearer {token1}'}, json={
        'start_date': '2026-09-01',
        'end_date': '2026-09-05'
    })
    p_id = p_res.get_json()['period']['id']

    # User 2 tries to access User 1's period -> 404
    forbidden_get = client.get(f'/api/periods/{p_id}', headers={'Authorization': f'Bearer {token2}'})
    assert forbidden_get.status_code == 404

    forbidden_del = client.delete(f'/api/periods/{p_id}', headers={'Authorization': f'Bearer {token2}'})
    assert forbidden_del.status_code == 404

def test_daily_checkin_and_journal(client):
    token = register_and_login(client, 'checkin_user@example.com')
    headers = {'Authorization': f'Bearer {token}'}

    today_str = date.today().isoformat()
    c_res = client.post('/api/checkins', headers=headers, json={
        'date': today_str,
        'flow_intensity': 'medium',
        'symptoms': ['cramps', 'bloating'],
        'mood': 'calm',
        'energy_level': 4,
        'water_glasses': 8,
        'sleep_hours': 7.5
    })
    assert c_res.status_code == 200
    assert c_res.get_json()['checkin']['symptoms'] == ['cramps', 'bloating']

    # Upsert (editing same date checkin)
    c_res2 = client.post('/api/checkins', headers=headers, json={
        'date': today_str,
        'mood': 'energetic'
    })
    assert c_res2.status_code == 200
    assert c_res2.get_json()['checkin']['mood'] == 'energetic'

    # Journal Entry
    j_res = client.post('/api/journal', headers=headers, json={
        'date': today_str,
        'mood': 'calm',
        'content': 'Felt very relaxed today after yoga.'
    })
    assert j_res.status_code == 201

def test_export_and_pdf_report(client):
    token = register_and_login(client, 'export_user@example.com')
    headers = {'Authorization': f'Bearer {token}'}

    # Add a period
    client.post('/api/periods', headers=headers, json={
        'start_date': '2026-10-01',
        'end_date': '2026-10-05',
        'flow_intensity': 'heavy'
    })

    # Export JSON
    exp_json = client.get('/api/export?format=json', headers=headers)
    assert exp_json.status_code == 200
    data = exp_json.get_json()
    assert len(data['periods']) == 1

    # Export CSV
    exp_csv = client.get('/api/export?format=csv', headers=headers)
    assert exp_csv.status_code == 200
    assert 'text/csv' in exp_csv.content_type

    # PDF Doctor Report
    pdf_res = client.get('/api/report/pdf', headers=headers)
    assert pdf_res.status_code == 200
    assert 'application/pdf' in pdf_res.content_type
    assert pdf_res.data.startswith(b'%PDF')

def test_health_data_not_in_logs():
    filter_obj = HealthDataSanitizingFilter()
    record = logging.LogRecord(
        name='test',
        level=logging.INFO,
        pathname='test.py',
        lineno=1,
        msg="User checkin payload: symptoms: ['cramps', 'bloating'], flow_intensity: 'heavy', password: 'secret'",
        args=(),
        exc_info=None
    )
    filter_obj.filter(record)
    assert 'cramps' not in record.msg
    assert 'bloating' not in record.msg
    assert '[REDACTED_HEALTH_DATA]' in record.msg
