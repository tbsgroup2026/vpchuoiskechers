const fs = require('fs');

const filePath = 'web/src/app/rooms/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Fix getTodayIsoDate and getTodayVnDate to use VN timezone stably
const oldHelpers = `const getTodayIsoDate = () => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return \`\${yyyy}-\${mm}-\${dd}\`;
};

const getTodayVnDate = () => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return \`\${dd}/\${mm}/\${yyyy}\`;
};`;

const newHelpers = `const getVnDateObj = () => {
  if (typeof window === "undefined") return new Date("2026-01-01T00:00:00Z");
  const nowStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" });
  return new Date(nowStr);
};

const getTodayIsoDate = () => {
  const d = getVnDateObj();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return \`\${yyyy}-\${mm}-\${dd}\`;
};

const getTodayVnDate = () => {
  const d = getVnDateObj();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return \`\${dd}/\${mm}/\${yyyy}\`;
};`;

content = content.replace(oldHelpers, newHelpers);

// 2. Fix parseVnDate to be stable on SSR
content = content.replace(
  'const parts = (dateStr || getTodayVnDate()).split("/");',
  'const parts = (dateStr || (typeof window !== "undefined" ? getTodayVnDate() : "01/01/2026")).split("/");'
);

// 3. Fix toLocaleString and toLocaleTimeString to use timeZone
content = content.replace(/\.toLocaleString\("vi-VN"\)/g, '.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })');
content = content.replace(/\.toLocaleString\("vi-VN", \{ dateStyle: "short", timeStyle: "short" \}\)/g, '.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" })');
content = content.replace(/\.toLocaleTimeString\("vi-VN", \{/g, '.toLocaleTimeString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh",');

// 4. Fix state initializers
content = content.replace(
  'const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(getTodayVnDate());',
  'const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>("");'
);

content = content.replace(
  'bookingDate: getTodayIsoDate(),\n    timeSlot: "09:00 - 10:30",',
  'bookingDate: "",\n    timeSlot: "09:00 - 10:30",'
);

content = content.replace(
  'roomLocation: "Phòng Họp Executive VIP 1",\n    visitDate: getTodayIsoDate(),',
  'roomLocation: "Phòng Họp Executive VIP 1",\n    visitDate: "",'
);

// 5. Update useEffect to initialize states
const oldEffect = `  useEffect(() => {
    setMounted(true);
  }, []);`;

const newEffect = `  useEffect(() => {
    setSelectedCalendarDate(getTodayVnDate());
    setBookingForm(prev => ({ ...prev, bookingDate: getTodayIsoDate() }));
    setVisitorForm(prev => ({ ...prev, visitDate: getTodayIsoDate() }));
    setMounted(true);
  }, []);`;

content = content.replace(oldEffect, newEffect);

// 6. Fix use of new Date() in render methods
// Find all instances of new Date() that are not in event handlers or useEffects and wrap them with mounted check if needed
// Actually, since selectedCalendarDate is now "", parseVnDate handles it and it returns stable values.
// What about other places?
content = content.replace(
  'const today = new Date();',
  'const today = getVnDateObj();'
);
content = content.replace(
  'const bookingDateObj = new Date(bookingForm.bookingDate + "T" + bookingForm.timeSlot.split(" - ")[0]);',
  'const bookingDateObj = new Date((bookingForm.bookingDate || "2026-01-01") + "T" + bookingForm.timeSlot.split(" - ")[0]);'
);

// Remove the global if (!mounted) return null; so the layout renders on SSR
// But wrap the specific content that depends on time in {mounted && ...} or ClientOnly
// Wait, the user said "Có thể tạo hook useMounted hoặc component ClientOnly", but if we remove the global return null and just use stable empty strings, we don't even need it.
content = content.replace(
  '  if (!mounted) {\n    return null; // Prevents hydration mismatch caused by time-dependent initial state (e.g. at midnight crossover)\n  }',
  '  // Removed global !mounted return null to allow SSR of the layout'
);

// Let's write the file
fs.writeFileSync(filePath, content, 'utf8');
console.log('page.tsx hydration fixed!');
