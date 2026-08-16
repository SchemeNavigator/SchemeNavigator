import os
from fastapi.testclient import TestClient
from app.core.app_factory import create_app
from app.core.config import Settings

os.chdir(os.path.dirname(__file__))
app = create_app(Settings(csv_path='app/tests/conftest.py'))
with TestClient(app) as client:
    response = client.post('/api/v1/recommendations', json={
        'citizen_id': '123',
        'age': 30,
        'state': 'Odisha',
        'category': 'Education',
    })
    print('status', response.status_code)
    print('headers', response.headers)
    try:
        print('json', response.json())
    except Exception as exc:
        print('json error', exc)
