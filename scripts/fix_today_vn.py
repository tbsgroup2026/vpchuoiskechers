import re
import sys

file_path = 'web/src/app/rooms/page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Actually wait, let me just use regex or a simple string replace
content = content.replace(
    'const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>("");',
    'const [todayVnStr, setTodayVnStr] = useState<string>("");\n  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>("");'
)

if "setMounted(true);" in content:
    content = content.replace(
        "setMounted(true);",
        'setMounted(true);\n    setTodayVnStr(new Date().toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }));'
    )
elif "setIsMounted(true);" in content:
    content = content.replace(
        "setIsMounted(true);",
        'setIsMounted(true);\n    setTodayVnStr(new Date().toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }));'
    )

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Added todayVnStr")
