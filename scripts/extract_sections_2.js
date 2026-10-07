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

extract('interface MeetingRoom {', '} // MeetingRoom_END', 'MeetingRoom_interface'); // Wait, the interface just ends with }
extract('<div className="relative h-44 w-full', '<div className="flex items-center gap-2">', 'Card_Image');
extract('const handleDeleteRoom = async (roomId: string) => {', 'showToast(`Đã xóa phòng họp', 'handleDeleteRoom');
extract('/* TẢI LÊN NHIỀU ẢNH (Cloudinary) */', '{/* Trang thiết bị */}', 'Form_Images_Upload');
extract('{/* Modal: Room Details', '{/* Modal: Zalo Notify', 'Modal_Room_Details');
