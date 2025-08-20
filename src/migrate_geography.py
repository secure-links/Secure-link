#!/usr/bin/env python3
"""
Migration script to add geography fields to the tracking_event table.
This script adds the new geography columns to support enhanced location tracking.
"""

import sqlite3
import os
from pathlib import Path

def migrate_geography_fields():
    """Add geography fields to tracking_event table"""
    
    # Get the database path
    db_path = Path(__file__).parent / "database" / "app.db"
    
    if not db_path.exists():
        print(f"Database not found at {db_path}")
        return False
    
    try:
        # Connect to the database
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        
        # Check if columns already exist
        cursor.execute("PRAGMA table_info(tracking_event)")
        columns = [column[1] for column in cursor.fetchall()]
        
        # List of new columns to add
        new_columns = [
            ("country_code", "VARCHAR(10)"),
            ("region", "VARCHAR(100)"),
            ("latitude", "FLOAT"),
            ("longitude", "FLOAT"),
            ("timezone", "VARCHAR(50)")
        ]
        
        # Add missing columns
        for column_name, column_type in new_columns:
            if column_name not in columns:
                try:
                    cursor.execute(f"ALTER TABLE tracking_event ADD COLUMN {column_name} {column_type}")
                    print(f"✓ Added column: {column_name}")
                except sqlite3.Error as e:
                    print(f"✗ Error adding column {column_name}: {e}")
        
        # Commit changes
        conn.commit()
        print("✓ Geography migration completed successfully")
        
        # Verify the changes
        cursor.execute("PRAGMA table_info(tracking_event)")
        updated_columns = [column[1] for column in cursor.fetchall()]
        print(f"✓ Table now has {len(updated_columns)} columns: {', '.join(updated_columns)}")
        
        return True
        
    except sqlite3.Error as e:
        print(f"✗ Database error: {e}")
        return False
    
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    print("Starting geography fields migration...")
    success = migrate_geography_fields()
    
    if success:
        print("\n🎉 Migration completed successfully!")
        print("The tracking_event table now supports enhanced geography data.")
    else:
        print("\n❌ Migration failed. Please check the errors above.")

