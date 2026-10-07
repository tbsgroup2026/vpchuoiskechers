import re

file_path = r"d:\Work\TBS II\web\src\lib\kaizenDbMigration.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add company_vehicles table creation
new_tables = """      'CREATE TABLE IF NOT EXISTS company_vehicles (id TEXT PRIMARY KEY, plate_number TEXT NOT NULL, driver_name TEXT NOT NULL, driver_phone TEXT, seat_count INTEGER, status TEXT DEFAULT "AVAILABLE", current_trip_id TEXT, notes TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)',
      'ALTER TABLE ci_kaizen_proposals"""

content = content.replace("'ALTER TABLE ci_kaizen_proposals", new_tables, 1)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Added company_vehicles to kaizenDbMigration.ts")
