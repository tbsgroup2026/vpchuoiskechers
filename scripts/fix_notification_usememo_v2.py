import os
import re

file_path = r"d:\Work\TBS II\web\src\components\NotificationCenter.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

content = re.sub(r'import\s+\{([^}]+)\}\s+from\s+"react";', lambda m: 'import {' + m.group(1) + ', useMemo} from "react";' if 'useMemo' not in m.group(1) else m.group(0), content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed NotificationCenter useMemo import via regex")
