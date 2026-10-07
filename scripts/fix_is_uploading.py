import re

file_path = 'web/src/app/rooms/page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

state_def = 'const [isUploadingImages, setIsUploadingImages] = useState<boolean>(false);'

# Find where to insert it, maybe near `todayVnStr`
insert_target = 'const [todayVnStr, setTodayVnStr] = useState<string>("");'
if insert_target in content:
    content = content.replace(
        insert_target,
        insert_target + '\n  ' + state_def
    )
else:
    # If not found, look for another state
    content = content.replace(
        'const [rooms, setRooms] = useState<MeetingRoom[]>([]);',
        'const [rooms, setRooms] = useState<MeetingRoom[]>([]);\n  ' + state_def
    )

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Added setIsUploadingImages state")
