from app.core.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    res = conn.execute(text("SHOW COLUMNS FROM items"))
    print('Columns in items table:')
    for row in res:
        print(row)
