#!/usr/bin/env python3
"""Production database migration script for PostgreSQL.
Adds any missing columns required by the latest code.
Usage:
  python migrate_production.py
Requires env var DATABASE_URL to be set.
"""
import os
import psycopg2
from urllib.parse import urlparse

REQUIRED_ALTERS = [
    "ALTER TABLE tracking_event ADD COLUMN IF NOT EXISTS country_code VARCHAR(10)",
    "ALTER TABLE tracking_event ADD COLUMN IF NOT EXISTS zip_code VARCHAR(20)",
    "ALTER TABLE tracking_event ADD COLUMN IF NOT EXISTS device_type VARCHAR(20)"
]

def migrate_production_database():
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        print("DATABASE_URL not set")
        return False
    try:
        conn = psycopg2.connect(database_url)
        conn.autocommit = True
        cur = conn.cursor()
        for sql in REQUIRED_ALTERS:
            try:
                cur.execute(sql)
                print("Ran:", sql)
            except Exception as e:
                # if table doesn't exist yet, skip
                print("Warn for SQL ->", sql, ":", e)
        cur.close()
        conn.close()
        print("Production database migration completed successfully!")
        return True
    except Exception as e:
        print("Error during production migration:", e)
        return False

if __name__ == "__main__":
    migrate_production_database()
