import re

with open('C:/Users/Admin/.gemini/antigravity-ide/brain/79abedba-d78d-4c45-8724-ee19d28295e0/.system_generated/tasks/task-1452.log', 'r', encoding='utf-8') as f:
    text = f.read()

urls = set(re.findall(r'"url":\s*"(.*?)"', text))
print("Unique URLs hit during tail:")
for u in urls:
    print(u)
