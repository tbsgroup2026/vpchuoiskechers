import os

page_path = r"d:\Work\TBS II\web\src\app\business-trip\page.tsx"
with open(page_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "ĐÁNH DẤU ĐÃ THANH TOÁN" in line or i in range(3275, 3290):
        print(f"{i+1}: {line.rstrip()}")
