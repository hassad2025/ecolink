from fastapi.testclient import TestClient
from app.main import app
import traceback

client = TestClient(app)

try:
    resp = client.get('/items/recent?limit=3')
    print('STATUS', resp.status_code)
    print('HEADERS', resp.headers)
    try:
        print('JSON:', resp.json())
    except Exception:
        print('TEXT:', resp.text)
except Exception as e:
    print('EXCEPTION during request:')
    traceback.print_exc()
    raise
