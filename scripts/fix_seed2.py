import os

file_path = r"d:\Work\TBS II\scripts\seed_100_trips_v2.sql"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("BEGIN TRANSACTION;\\n", "")
content = content.replace("COMMIT;\\n", "")
content = content.replace("\\n", "\n")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed")
