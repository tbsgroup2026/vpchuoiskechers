import re

file_path = 'web/public/_worker.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('\\n', '\n')
content = content.replace("\\'", "'")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
