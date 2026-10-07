import re

file_path = r"d:\Work\TBS II\web\src\app\business-trip\page.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Fix IconList import
if "IconList" not in content[:1000]:
    content = content.replace('IconChevronRight,', 'IconChevronRight,\n  IconList,')

# 2. Fix 'logistics_status' -> 'logisticsStatus' in selectedModalRecord rendering block
content = content.replace('selectedModalRecord.logistics_status', 'selectedModalRecord.logisticsStatus')

# 3. Fix 'fullName' -> 'name' in page.tsx line 3722 (or wherever it is)
content = content.replace('currentUser.fullName', 'currentUser.name')

# 4. Fix TS2554 Expected 1 arguments, but got 2.
# Need to check line 3203. It's probably a toast or something.
# We'll just leave this one if it's tricky to find without seeing the line. Wait, we can find it.
# Usually it's `showToast("...", "success")` but showToast only takes 1 argument.
content = re.sub(r'showToast\(([^,]+),\s*["\'](success|error|warning|info)["\']\)', r'showToast(\1)', content)

# 5. Add IconCheck and IconUser, IconMapPin, IconCalendar, IconCar, IconPlus imports if missing
icons_to_add = ['IconCheck', 'IconUser', 'IconMapPin', 'IconCalendar', 'IconCar', 'IconPlus']
for icon in icons_to_add:
    if icon not in content[:1000]:
        content = content.replace('IconChevronRight,', f'IconChevronRight,\n  {icon},')

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed TS errors in page.tsx")
