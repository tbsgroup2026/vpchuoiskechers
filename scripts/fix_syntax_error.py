import re

with open('web/public/_worker.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('\\`', '`')
content = content.replace('\\$', '$')
content = content.replace('\\\\[', '[')
content = content.replace('\\\\]', ']')
content = content.replace('\\\\S', '\\S')

with open('web/public/_worker.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed")
