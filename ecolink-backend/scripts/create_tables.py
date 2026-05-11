"""
Script to create database tables using SQLAlchemy metadata.
Run from the Backend folder inside your virtualenv:

  python scripts/create_tables.py

It will read the engine and Base from app.core.database and create tables.
"""
from app.core.database import engine, Base
from app.models import db_models

def main():
    print("Creating tables from SQLAlchemy models...")
    Base.metadata.create_all(bind=engine)
    print("Done.")

if __name__ == '__main__':
    main()
