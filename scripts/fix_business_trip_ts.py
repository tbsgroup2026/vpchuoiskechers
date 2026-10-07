import re

file_path = r'd:\Work\TBS II\web\src\app\business-trip\page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix Array.from(files).forEach((file)
content = content.replace("Array.from(files).forEach((file) => {", "Array.from(files).forEach((file: File) => {")

# Add isAccountant before filteredRecords
if "const isAccountant =" not in content:
    old_filter = """  // Filter records
  const filteredRecords = records.filter((rec) => {"""
    new_filter = """  const isAccountant = roles.includes('ACCOUNTANT') || roles.includes('accountant') || currentUser?.roleCode === 'KE_TOAN' || ['KT-001','KT-002'].includes(currentUser?.empCode||'');

  // Filter records
  const filteredRecords = records.filter((rec) => {"""
    content = content.replace(old_filter, new_filter)

# Add isAccountant for the second filteredRecords (just in case)
if "const isAccountant =" not in content:
    # Try another fallback
    content = content.replace("const filteredRecords =", "const isAccountant = roles.includes('ACCOUNTANT') || roles.includes('accountant') || currentUser?.roleCode === 'KE_TOAN' || ['KT-001','KT-002'].includes(currentUser?.empCode||'');\n  const filteredRecords =")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed TS errors and added isAccountant!")
