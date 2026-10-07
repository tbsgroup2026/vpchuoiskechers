import os

file_path = r"d:\Work\TBS II\scripts\seed_100_trips_v2.sql"
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = [line for line in lines if "BEGIN TRANSACTION;" not in line and "COMMIT;" not in line]

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Removed transaction keywords")
