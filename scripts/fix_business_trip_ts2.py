import re

file_path = r'd:\Work\TBS II\web\src\app\business-trip\page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix currentUser type
old_type = "const [currentUser, setCurrentUser] = useState<{ name: string; title: string; department: string; avatar: string }>({"
new_type = "const [currentUser, setCurrentUser] = useState<{ name: string; title: string; department: string; avatar: string; roleCode?: string; empCode?: string }>({"
content = content.replace(old_type, new_type)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed TS errors for roleCode and empCode!")
