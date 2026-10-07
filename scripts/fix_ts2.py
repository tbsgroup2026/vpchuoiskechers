import re

file_path = r"d:\Work\TBS II\web\src\app\business-trip\page.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Fix IconList import properly
# Find the line starting with import { ... IconChevronRight
import_match = re.search(r'import\s+\{([^}]+)\}\s+from\s+["\']@tabler/icons-react["\'];', content)
if import_match:
    imports = import_match.group(1)
    for icon in ['IconList', 'IconCheck', 'IconUser', 'IconMapPin', 'IconCalendar', 'IconCar', 'IconPlus']:
        if icon not in imports:
            imports += f", {icon}"
    new_import = f'import {{ {imports} }} from "@tabler/icons-react";'
    content = content[:import_match.start()] + new_import + content[import_match.end():]

# Fix line 1227: Property 'id' does not exist on type '{ invoices: any[]; }'.
# Old code: const updatedTrip = [...records, { invoices: newInvoicesList }].find(r => r.id === tripId);
# New code: const updatedTrip = records.find(r => r.id === tripId);
content = content.replace(
    'const updatedTrip = [...records, { invoices: newInvoicesList }].find((r: any) => r.id === tripId);',
    'const updatedTrip = records.find(r => r.id === tripId);'
).replace(
    'const updatedTrip = [...records, { invoices: newInvoicesList }].find(r => (r as any).id === tripId);',
    'const updatedTrip = records.find(r => r.id === tripId);'
).replace(
    'const updatedTrip = [...records, { invoices: newInvoicesList }].find(r => r.id === tripId);',
    'const updatedTrip = records.find(r => r.id === tripId);'
)

# Fix line 1500 (approx): const updated = [...records, data.data || {}].find(r => r.id === tripId);
content = content.replace(
    'const updated = [...records, data.data || {}].find((r: any) => r.id === tripId);',
    'const updated = records.find(r => r.id === tripId);'
).replace(
    'const updated = [...records, data.data || {}].find(r => (r as any).id === tripId);',
    'const updated = records.find(r => r.id === tripId);'
).replace(
    'const updated = [...records, data.data || {}].find(r => r.id === tripId);',
    'const updated = records.find(r => r.id === tripId);'
)

# Fix setProposalForm type error
content = re.sub(r'setProposalForm\(\{([^\}]+)estimatedCost: 0\s*\}\)', r'setProposalForm({\1estimatedCost: 0, customDestinationName: "", customDestinationAddress: "", customDestinationType: "", destinations: [] })', content)
content = content.replace('setProposalForm({\n        title: "",\n        region: "VP Chuỗi (R&D)",', 'setProposalForm({\n        title: "",\n        region: "VP Chuỗi (R&D)",\n        customDestinationName: "",\n        customDestinationAddress: "",\n        customDestinationType: "",\n        destinations: [],')


# Fix showToast 2 arguments
content = re.sub(r'showToast\(([^,]+),\s*["\'](success|error|warning|info)["\']\)', r'showToast(\1)', content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed TS errors part 2")
