import re
import sys

file_path = 'web/src/app/rooms/page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix syntax errors caused by naive replacement
content = content.replace('json.data.(rooms || []).map', '(json.data.rooms || []).map')
content = content.replace('json.data.(bookings || []).map', '(json.data.bookings || []).map')
content = content.replace('json.data.(visitors || []).map', '(json.data.visitors || []).map')

# Also fix the previous prev.map state mappings that might have been hit if they were written as `bookings.map`? No, those were `prev.map`.

# Let's add the ErrorBoundary and normalizeRoom logic per user request
# Actually, the user asked to create normalizeRoom() running right when receiving data from API.
# Let's search for fetchD1RoomsData and patch the normalization there.
# It is better to ensure the API response is properly guarded.

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Syntax errors patched successfully.")
