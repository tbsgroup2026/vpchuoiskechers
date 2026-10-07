const fs = require('fs');
const content = fs.readFileSync('web/src/app/rooms/page.tsx', 'utf8');

function extract(markerStart, markerEnd, name) {
  const start = content.indexOf(markerStart);
  if (start === -1) { console.log(`START MISSING for ${name}`); return; }
  const end = content.indexOf(markerEnd, start);
  if (end === -1) { console.log(`END MISSING for ${name}`); return; }
  fs.writeFileSync(`scripts/${name}.txt`, content.slice(start, end));
  console.log(`Extracted ${name}`);
}

extract('interface MeetingRoom {', '}\n', 'MeetingRoom_interface');
extract('const handleSaveRoom = async', '    if (selectedRoomForDetail', 'handleSaveRoom');
extract('<div className="relative h-40 sm:h-44', '<div className="flex items-center gap-2">', 'Card_Image');
extract('{/* Modal: Room Details (View Only) */}', '{/* Modal: Zalo Notify Priority Selector */}', 'Modal_Room_Details');
extract('{/* Images Upload */}', '{/* Trang thiết bị */}', 'Form_Images_Upload');
extract('const handleDeleteRoom = async (id: string) => {', 'showToast("Xóa phòng họp thành công");', 'handleDeleteRoom');
