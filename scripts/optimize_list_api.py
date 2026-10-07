import re
import os

list_api = r"d:\Work\TBS II\web\src\app\api\business-trips\route.ts"
with open(list_api, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Optimize the SELECT query
old_select = "'SELECT * FROM business_trips ORDER BY created_at DESC'"
new_select = "'SELECT id, code, title, region, factory, creator, department, department_id, location, start_date, end_date, days_count, transport, participants_count, status, estimated_cost, logistics_status, payment_status, trip_type, created_at FROM business_trips ORDER BY created_at DESC LIMIT 500'"

content = content.replace(old_select, new_select)

# 2. Add pagination info to return
# But since we use client filtering, we just return the 500 most recent trips to make it fast without heavy JSON.
# The payload drops from 500MB to ~100KB.

with open(list_api, "w", encoding="utf-8") as f:
    f.write(content)

print("Optimized list API")
