#!/usr/bin/env python3
"""
Database Migration Script for Brain Link Tracker
Properly handles PostgreSQL schema updates
"""

import os
import sys
from dotenv import load_dotenv
import psycopg2
from urllib.parse import urlparse

# Load environment variables
load_dotenv()

def get_db_connection():
    """Get direct PostgreSQL connection"""
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL not found in environment variables")
        return None
    
    try:
        # Parse the database URL
        parsed = urlparse(database_url)
        
        conn = psycopg2.connect(
            host=parsed.hostname,
            port=parsed.port,
            database=parsed.path[1:],  # Remove leading slash
            user=parsed.username,
            password=parsed.password,
            sslmode='require'
        )
        return conn
    except Exception as e:
        print(f"❌ Failed to connect to database: {e}")
        return None

def check_column_exists(conn, table_name, column_name):
    """Check if a column exists in a table"""
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = %s AND column_name = %s
        """, (table_name, column_name))
        result = cursor.fetchone()
        cursor.close()
        return result is not None
    except Exception as e:
        print(f"❌ Error checking column existence: {e}")
        return False

def add_title_column(conn):
    """Add title column to link table"""
    try:
        cursor = conn.cursor()
        
        # Check if title column exists
        if check_column_exists(conn, 'link', 'title'):
            print("✅ Title column already exists in link table")
            cursor.close()
            return True
        
        # Add title column
        cursor.execute("ALTER TABLE link ADD COLUMN title VARCHAR(255)")
        conn.commit()
        cursor.close()
        print("✅ Added title column to link table")
        return True
        
    except Exception as e:
        print(f"❌ Failed to add title column: {e}")
        conn.rollback()
        return False

def add_geography_columns(conn):
    """Add geography columns to tracking_event table"""
    try:
        cursor = conn.cursor()
        
        geography_columns = [
            ('latitude', 'FLOAT'),
            ('longitude', 'FLOAT'),
            ('timezone', 'VARCHAR(100)'),
            ('region', 'VARCHAR(255)'),
            ('country_code', 'VARCHAR(10)'),
            ('isp', 'VARCHAR(255)')
        ]
        
        for column_name, column_type in geography_columns:
            if not check_column_exists(conn, 'tracking_event', column_name):
                cursor.execute(f"ALTER TABLE tracking_event ADD COLUMN {column_name} {column_type}")
                print(f"✅ Added {column_name} column to tracking_event table")
            else:
                print(f"✅ {column_name} column already exists in tracking_event table")
        
        conn.commit()
        cursor.close()
        return True
        
    except Exception as e:
        print(f"❌ Failed to add geography columns: {e}")
        conn.rollback()
        return False

def create_indexes(conn):
    """Create performance indexes"""
    try:
        cursor = conn.cursor()
        
        indexes = [
            ("idx_tracking_event_country", "tracking_event", "country"),
            ("idx_tracking_event_timestamp", "tracking_event", "timestamp"),
            ("idx_tracking_event_link_id", "tracking_event", "link_id"),
            ("idx_link_user_id", "link", "user_id"),
            ("idx_link_short_code", "link", "short_code")
        ]
        
        for index_name, table_name, column_name in indexes:
            try:
                cursor.execute(f"CREATE INDEX IF NOT EXISTS {index_name} ON {table_name} ({column_name})")
                print(f"✅ Created index {index_name}")
            except Exception as e:
                print(f"⚠️  Index {index_name} may already exist: {e}")
        
        conn.commit()
        cursor.close()
        return True
        
    except Exception as e:
        print(f"❌ Failed to create indexes: {e}")
        conn.rollback()
        return False

def main():
    """Run database migrations"""
    print("🚀 Brain Link Tracker - Database Migration")
    print("=" * 50)
    
    # Get database connection
    conn = get_db_connection()
    if not conn:
        return False
    
    print("✅ Connected to PostgreSQL database")
    
    migrations_applied = 0
    total_migrations = 3
    
    # Apply migrations
    if add_title_column(conn):
        migrations_applied += 1
    
    if add_geography_columns(conn):
        migrations_applied += 1
    
    if create_indexes(conn):
        migrations_applied += 1
    
    conn.close()
    
    print("\n" + "=" * 50)
    print(f"🎯 Migration Summary: {migrations_applied}/{total_migrations} applied")
    
    if migrations_applied == total_migrations:
        print("🎉 All database migrations completed successfully!")
        return True
    else:
        print("⚠️  Some migrations failed. Please review the output above.")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)

