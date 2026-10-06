const fs = require('fs');
let code = fs.readFileSync('src/app/rooms/page.tsx', 'utf-8');

code = code.replace(/setBookingForm\(\{\s*roomId:([^,]+),\s*title:([^,]+),\s*bookerName:([^,]+),\s*department:([^,]+),\s*bookingDate:([^,]+),\s*timeSlot:([^,]+),\s*attendeesCount:([^,]+),\s*notes:([^,]+),\s*needsTeaCoffee:([^,]+),\s*needsProjector:([^}]+)\s*\}\)/g, 
  (match, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10) => {
    return `setBookingForm({\n      roomId: ${p1.trim()},\n      title: ${p2.trim()},\n      bookerName: ${p3.trim()},\n      department: ${p4.trim()},\n      bookingDate: ${p5.trim()},\n      timeSlot: ${p6.trim()},\n      attendeesCount: ${p7.trim()},\n      notes: ${p8.trim()},\n      needsTeaCoffee: ${p9.trim()},\n      needsProjector: ${p10.trim()},\n      meetingType: 'OFFLINE',\n      platform: 'Microsoft Teams',\n      meetingLink: '',\n      meetingCredentials: ''\n    })`;
});

fs.writeFileSync('src/app/rooms/page.tsx', code);
console.log('Fixed setBookingForm');
