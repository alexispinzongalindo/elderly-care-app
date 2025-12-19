#!/usr/bin/env python3
"""
Check if incident_reports table exists and test saving an incident
"""

import sqlite3
import os
from datetime import datetime

DATABASE = 'elder_care.db'

if not os.path.exists(DATABASE):
    print(f"❌ Database file '{DATABASE}' not found!")
    exit(1)

print(f"✅ Database found: {DATABASE}")
print()

conn = sqlite3.connect(DATABASE)
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

# Check if table exists
try:
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='incident_reports'")
    table = cursor.fetchone()
    if table:
        print("✅ incident_reports table exists")
    else:
        print("❌ incident_reports table DOES NOT EXIST!")
        print("   This is the problem - the table needs to be created.")
        conn.close()
        exit(1)
except Exception as e:
    print(f"❌ Error checking table: {e}")
    conn.close()
    exit(1)

# Check table schema
print()
print("📋 Table schema:")
cursor.execute("PRAGMA table_info(incident_reports)")
columns = cursor.fetchall()
for col in columns:
    nullable = "NULL" if col[3] == 0 else "NOT NULL"
    default = f" DEFAULT {col[4]}" if col[4] else ""
    print(f"   - {col[1]} ({col[2]}) {nullable}{default}")

# Check if there are any incidents
print()
cursor.execute("SELECT COUNT(*) as count FROM incident_reports")
count = cursor.fetchone()[0]
print(f"📊 Current incidents in database: {count}")

# Check for residents and staff (required for foreign keys)
print()
cursor.execute("SELECT COUNT(*) as count FROM residents")
resident_count = cursor.fetchone()[0]
print(f"👥 Residents in database: {resident_count}")

cursor.execute("SELECT COUNT(*) as count FROM staff")
staff_count = cursor.fetchone()[0]
print(f"👤 Staff in database: {staff_count}")

if resident_count == 0:
    print("⚠️ WARNING: No residents found. Cannot create test incident.")
    conn.close()
    exit(0)

if staff_count == 0:
    print("⚠️ WARNING: No staff found. Cannot create test incident.")
    conn.close()
    exit(0)

# Try to insert a test incident
print()
print("🧪 Testing incident insertion...")
try:
    # Get first resident and staff
    cursor.execute("SELECT id FROM residents LIMIT 1")
    resident = cursor.fetchone()
    resident_id = resident[0] if resident else None
    
    cursor.execute("SELECT id FROM staff LIMIT 1")
    staff = cursor.fetchone()
    staff_id = staff[0] if staff else None
    
    if not resident_id or not staff_id:
        print("❌ Cannot find resident or staff for test")
        conn.close()
        exit(1)
    
    print(f"   Using resident_id: {resident_id}, staff_id: {staff_id}")
    
    cursor.execute('''
        INSERT INTO incident_reports (
            resident_id, incident_date, incident_type, location, description,
            severity, witnesses, actions_taken, family_notified,
            family_notification_date, follow_up_required, follow_up_notes,
            photos, residents_involved, staff_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        resident_id,
        datetime.now().isoformat(),
        'Test Incident',
        'Test Location',
        'This is a test incident to verify database save functionality',
        'minor',
        '',
        '',
        0,
        None,
        0,
        '',
        '',
        '',
        staff_id
    ))
    
    conn.commit()
    incident_id = cursor.lastrowid
    print(f"✅ Test incident inserted successfully! ID: {incident_id}")
    
    # Verify it was saved
    cursor.execute("SELECT * FROM incident_reports WHERE id = ?", (incident_id,))
    saved_incident = cursor.fetchone()
    if saved_incident:
        print(f"✅ Verified: Incident {incident_id} exists in database")
        print(f"   Description: {saved_incident['description']}")
    else:
        print(f"❌ ERROR: Incident {incident_id} was not found after insert!")
    
    # Clean up test incident
    cursor.execute("DELETE FROM incident_reports WHERE id = ?", (incident_id,))
    conn.commit()
    print(f"🧹 Test incident deleted")
    
except sqlite3.IntegrityError as e:
    print(f"❌ Integrity Error: {e}")
    print("   This usually means a foreign key constraint failed")
except sqlite3.OperationalError as e:
    print(f"❌ Operational Error: {e}")
    print("   This usually means a column doesn't exist or wrong data type")
except Exception as e:
    print(f"❌ Unexpected Error: {e}")
    import traceback
    traceback.print_exc()

conn.close()
print()
print("✅ Diagnostic complete")















