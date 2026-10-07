import os

file_path = r"d:\Work\TBS II\web\src\components\NotificationCenter.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace('import { useState, useEffect, useRef } from "react";', 'import { useState, useEffect, useRef, useMemo } from "react";')

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed NotificationCenter useMemo import")
