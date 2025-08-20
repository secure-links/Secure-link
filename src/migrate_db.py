#!/usr/bin/env python3
"""
Database migration script to add missing columns to the link table
Works with both SQLite (development) and PostgreSQL (production)
"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from src.models.user import db
from src.main import app

def migrate_database():
    """Add missing columns to the link table"""
    with app.app_context():
        try:
            # Get database type
            db_url = str(db.engine.url)
            is_postgres = 'postgresql' in db_url
            is_sqlite = 'sqlite' in db_url
            
            print(f"Database type detected: {'PostgreSQL' if is_postgres else 'SQLite' if is_sqlite else 'Unknown'}")
            print(f"Database URL: {db_url}")
            
            # List of columns to add with their SQL types
            columns_to_add = [
                ('campaign_id', 'INTEGER'),
                ('recipient_email', 'VARCHAR(255)'),
                ('capture_email', 'BOOLEAN DEFAULT 0'),
                ('capture_password', 'BOOLEAN DEFAULT 0'),
                ('bot_blocking_enabled', 'BOOLEAN DEFAULT 0'),
                ('geo_targeting_enabled', 'BOOLEAN DEFAULT 0'),
                ('rate_limiting_enabled', 'BOOLEAN DEFAULT 0'),
                ('dynamic_signature_enabled', 'BOOLEAN DEFAULT 0'),
                ('mx_verification_enabled', 'BOOLEAN DEFAULT 0'),
                ('preview_template_url', 'VARCHAR(500)'),
                ('allowed_countries', 'TEXT'),
                ('blocked_countries', 'TEXT'),
                ('allowed_cities', 'TEXT'),
                ('blocked_cities', 'TEXT'),
            ]
            
            with db.engine.connect() as conn:
                for column_name, column_type in columns_to_add:
                    column_exists = False
                    
                    if is_postgres:
                        # PostgreSQL query
                        result = conn.execute(db.text(f"""
                            SELECT column_name 
                            FROM information_schema.columns 
                            WHERE table_name='link' AND column_name='{column_name}'
                        """))
                        column_exists = result.fetchone() is not None
                    elif is_sqlite:
                        # SQLite query - try to select the column
                        try:
                            conn.execute(db.text(f"SELECT {column_name} FROM link LIMIT 1"))
                            column_exists = True
                        except Exception:
                            column_exists = False
                    
                    if not column_exists:
                        print(f"Adding {column_name} column...")
                        conn.execute(db.text(f"ALTER TABLE link ADD COLUMN {column_name} {column_type}"))
                        conn.commit()
                        print(f"✓ {column_name} column added successfully")
                    else:
                        print(f"✓ {column_name} column already exists")
                
            print("Database migration completed successfully!")
            
        except Exception as e:
            print(f"Error during migration: {e}")
            import traceback
            traceback.print_exc()
     



        # Add is_bot column to tracking_event table
        try:
            with db.engine.connect() as conn:
                column_name = 'is_bot'
                column_type = 'BOOLEAN DEFAULT 0'
                table_name = 'tracking_event'

                column_exists = False
                if is_postgres:
                    result = conn.execute(db.text(f"""
                        SELECT column_name 
                        FROM information_schema.columns 
                        WHERE table_name='{table_name}' AND column_name='{column_name}'
                    """))
                    column_exists = result.fetchone() is not None
                elif is_sqlite:
                    try:
                        conn.execute(db.text(f"SELECT {column_name} FROM {table_name} LIMIT 1"))
                        column_exists = True
                    except Exception:
                        column_exists = False

                if not column_exists:
                    print(f"Adding {column_name} column to {table_name}...")
                    conn.execute(db.text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}"))
                    conn.commit()
                    print(f"✓ {column_name} column added to {table_name} successfully")
                else:
                    print(f"✓ {column_name} column already exists in {table_name}")

        except Exception as e:
            print(f"Error during tracking_event migration: {e}")
            import traceback
            traceback.print_exc()
            return False

    return True




if __name__ == "__main__":
    migrate_database()

