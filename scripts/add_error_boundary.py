import re
import sys

file_path = 'web/src/app/rooms/page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

error_boundary = """
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) { console.error("ErrorBoundary caught error", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center text-red-600 bg-red-50 rounded-2xl m-4 border border-red-200 shadow-md">
          <IconX className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-bold mb-2">Lỗi Hiển Thị Danh Sách Phòng</h2>
          <p className="text-sm opacity-80 mb-4">Một dữ liệu phòng họp bị lỗi định dạng (undefined). Hệ thống đã chặn lỗi để không làm sập trang.</p>
          <pre className="text-left bg-white p-4 rounded-xl text-xs overflow-auto opacity-70">
            {this.state.error?.toString()}
          </pre>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Tải lại trang</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const normalizeRoom = (r: any) => {
  let images = r.images || [];
  if (typeof images === 'string') {
    try { images = JSON.parse(images); } catch(e) { images = []; }
  }
  let equipment = r.equipment || [];
  if (typeof equipment === 'string') {
    try { equipment = JSON.parse(equipment); } 
    catch(e) { equipment = equipment.split(',').map((s: string) => s.trim()).filter(Boolean); }
  }
  images = Array.isArray(images) ? images.filter((img: any) => {
    const url = typeof img === 'string' ? img : (img?.url || '');
    return !url.startsWith('blob:') && !url.startsWith('data:');
  }) : [];
  equipment = Array.isArray(equipment) ? equipment : [];
  return {
    id: r.id || "room_unknown",
    name: r.name || "Phòng chưa đặt tên",
    capacity: r.capacity || 10,
    location: r.location || "Văn phòng",
    equipment,
    status: r.status || "AVAILABLE",
    isLocked: Boolean(r.is_locked || r.isLocked),
    colorClass: r.colorClass || r.color_class || "bg-slate-700 hover:bg-slate-800 text-white",
    badgeBg: r.badgeBg || r.badge_bg || "bg-slate-100 text-slate-800",
    images,
  };
};
"""

# Insert right after imports
import_end = content.find('export default function RoomsPage()')
content = content[:import_end] + error_boundary + "\n" + content[import_end:]

# Replace the mapping in fetchD1RoomsData
old_fetch_rooms = """
          setRooms((prev) =>
            (result.data?.rooms || []).map((r: any) => {
              const matched = prev.find((p) => p.id === r.id);
              return {
                id: r.id,
                name: r.name,
                capacity: r.capacity || 10,
                location: r.location,
                equipment: typeof r.equipment === "string" ? r.equipment.split(", ") : r.equipment || [],
                status: r.status || "AVAILABLE",
                isLocked: Boolean(r.is_locked),
                colorClass: matched?.colorClass || "bg-blue-600 border-blue-700 text-white",
                badgeBg: matched?.badgeBg || "bg-blue-100 text-blue-800",
                images: r.images || [],
              };
            })
          );
"""
new_fetch_rooms = """
          setRooms((prev) =>
            (Array.isArray(result.data?.rooms) ? result.data.rooms : []).map((r: any) => {
              const matched = prev.find((p) => p.id === r.id);
              const normalized = normalizeRoom(r);
              if (matched) {
                normalized.colorClass = matched.colorClass;
                normalized.badgeBg = matched.badgeBg;
              }
              return normalized;
            })
          );
"""
content = content.replace(old_fetch_rooms.strip(), new_fetch_rooms.strip())

# Also in the polling data update
old_poll_rooms = """
              setRooms((prev) =>
                (json.data.rooms || []).map((r: any) => {
                  const matched = prev.find((p: any) => p.id === r.id);
                  return {
                    id: r.id,
                    name: r.name,
                    capacity: r.capacity || 10,
                    location: r.location,
                    equipment: typeof r.equipment === "string" ? r.equipment.split(", ") : r.equipment || [],
                    status: r.status || "AVAILABLE",
                    isLocked: Boolean(r.is_locked),
                    colorClass: matched?.colorClass || "bg-blue-600 border-blue-700 text-white",
                    badgeBg: matched?.badgeBg || "bg-blue-100 text-blue-800",
                    images: r.images || [],
                  };
                })
              );
"""
new_poll_rooms = """
              setRooms((prev) =>
                (Array.isArray(json.data?.rooms) ? json.data.rooms : []).map((r: any) => {
                  const matched = prev.find((p: any) => p.id === r.id);
                  const normalized = normalizeRoom(r);
                  if (matched) {
                    normalized.colorClass = matched.colorClass;
                    normalized.badgeBg = matched.badgeBg;
                  }
                  return normalized;
                })
              );
"""
content = content.replace(old_poll_rooms.strip(), new_poll_rooms.strip())

# Wrap the main component return with ErrorBoundary
# Find: return (
#   <div className="min-h-screen
# We replace it with return <ErrorBoundary><div ...
content = content.replace(
    'return (\n    <div className="min-h-screen bg-slate-50/50 pb-20 md:pb-0 relative">',
    'return (\n    <ErrorBoundary>\n      <div className="min-h-screen bg-slate-50/50 pb-20 md:pb-0 relative">'
)
# Now we need to close </ErrorBoundary> at the very end of the file.
# The file ends with:
#     </div>
#   );
# }
content = content.replace(
    '    </div>\n  );\n}',
    '      </div>\n    </ErrorBoundary>\n  );\n}'
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("ErrorBoundary and normalizeRoom applied.")
