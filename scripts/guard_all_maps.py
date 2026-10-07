import re

file_path = 'web/src/app/rooms/page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Guarding API response maps
content = content.replace('result.data.rooms.map', '(result.data?.rooms || []).map')
content = content.replace('result.data.bookings.map', '(result.data?.bookings || []).map')
content = content.replace('result.data.visitors.map', '(result.data?.visitors || []).map')

# Guarding other maps that could be undefined
content = content.replace('bookings.filter', '(bookings || []).filter')
content = content.replace('rooms.filter', '(rooms || []).filter')
content = content.replace('visitors.filter', '(visitors || []).filter')

content = content.replace('bookings.map', '(bookings || []).map')
content = content.replace('rooms.map', '(rooms || []).map')
content = content.replace('visitors.map', '(visitors || []).map')

# Guarding room images list rendering in JSX
content = re.sub(r'\{room\.images\.map\(', '{(Array.isArray(room.images) ? room.images : []).map(', content)

# Write back
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
