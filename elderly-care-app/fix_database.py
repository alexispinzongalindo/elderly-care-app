#!/usr/bin/env python3
"""
Fix Database - Ensure all tables exist, especially incident_reports
"""

import sqlite3
import os

DATABASE = 'elder_care.db'

if not os.path.exists(DATABASE):
    print(f"❌ Database file not found: {DATABASE}")
    print("   Database will be created when server starts")
    exit(1)

print(f"✅ Database found: {DATABASE}")
print()

conn = sqlite3.connect(DATABASE)
cursor = conn.cursor()

# Check if incident_reports table exists
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='incident_reports'")
table_exists = cursor.fetchone()

if not table_exists:
    print("⚠️ incident_reports table does NOT exist. Creating it now...")
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS incident_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            resident_id INTEGER NOT NULL,
            incident_date DATETIME NOT NULL,
            incident_type TEXT NOT NULL,
            location TEXT,
            description TEXT NOT NULL,
            severity TEXT DEFAULT 'minor',
            witnesses TEXT,
            actions_taken TEXT,
            family_notified BOOLEAN DEFAULT 0,
            family_notification_date DATETIME,
            follow_up_required BOOLEAN DEFAULT 0,
            follow_up_notes TEXT,
            photos TEXT,
            residents_involved TEXT,
            staff_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (resident_id) REFERENCES residents (id),
            FOREIGN KEY (staff_id) REFERENCES staff (id)
        )
    ''')
    
    # Add residents_involved column if it doesn't exist (migration)
    try:
        cursor.execute('ALTER TABLE incident_reports ADD COLUMN residents_involved TEXT')
    except sqlite3.OperationalError:
        pass  # Column already exists
    
    conn.commit()
    print("✅ incident_reports table created successfully!")
else:
    print("✅ incident_reports table already exists")

# Check for other important tables
tables_to_check = [
    'staff',
    'residents',
    'medications',
    'appointments',
    'vital_signs',
    'billing',
    'payments',
    'notifications'
]

print()
print("Checking other important tables:")
for table in tables_to_check:
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table,))
    exists = cursor.fetchone()
    status = "✅" if exists else "❌"
    print(f"   {status} {table}")

conn.close()
print()
print("✅ Database check complete!")
print("   Run the diagnostic script again to verify: python3 diagnose_email_issue.py")

