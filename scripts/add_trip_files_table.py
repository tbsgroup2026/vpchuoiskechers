import re

mig_path = r"d:\Work\TBS II\web\src\lib\kaizenDbMigration.ts"
with open(mig_path, "r", encoding="utf-8") as f:
    mig_content = f.read()

# Add trip_files table creation
new_tables = """      'CREATE TABLE IF NOT EXISTS trip_files (id TEXT PRIMARY KEY, trip_id TEXT, uploader_emp_code TEXT, file_type TEXT, original_name TEXT, mime_type TEXT, size_bytes INTEGER, r2_key TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)',
      'CREATE INDEX IF NOT EXISTS idx_trip_files_trip_id ON trip_files (trip_id)',
      'ALTER TABLE business_trips ADD COLUMN trip_type TEXT DEFAULT "TRONG_NGAY"','""
"""

if "trip_files" not in mig_content:
    mig_content = mig_content.replace(
        '\'ALTER TABLE business_trips ADD COLUMN trip_type TEXT DEFAULT "TRONG_NGAY"\',',
        new_tables
    )
    with open(mig_path, "w", encoding="utf-8") as f:
        f.write(mig_content)

print("Added trip_files table to migration.")
