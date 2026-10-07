import re

file_path = 'web/src/app/rooms/page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Guard room.equipment
content = content.replace('{room.equipment.map(', '{(Array.isArray(room.equipment) ? room.equipment : []).map(')
# Guard selectedRoomForDetail.equipment
content = content.replace('{selectedRoomForDetail.equipment.map(', '{(Array.isArray(selectedRoomForDetail.equipment) ? selectedRoomForDetail.equipment : []).map(')
# Guard editingRoom.images
content = content.replace('{editingRoom.images.map(', '{(Array.isArray(editingRoom.images) ? editingRoom.images : []).map(')
# Guard roomGalleryImages
content = content.replace('{roomGalleryImages.map(', '{(Array.isArray(roomGalleryImages) ? roomGalleryImages : []).map(')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
