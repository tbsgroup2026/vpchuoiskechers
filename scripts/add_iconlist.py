import re
import os

file_path = r'd:\Work\TBS II\web\src\app\business-trip\page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace IconZoomIn with IconZoomIn, IconList, IconChevronRight, IconLoader
content = content.replace("IconZoomIn,", "IconZoomIn,\n  IconList,\n  IconChevronRight,\n  IconLoader,")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Added IconList to imports!")
