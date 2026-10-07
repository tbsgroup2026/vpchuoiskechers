import re

notif_path = r"d:\Work\TBS II\web\src\components\NotificationCenter.tsx"
with open(notif_path, "r", encoding="utf-8") as f:
    notif_content = f.read()

# 1. Add handleMarkAllAsRead
read_all = """  const handleMarkAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications/read-all", { method: "PATCH" });
      if (res.ok) {
        setNotifications(notifications.map(n => ({ ...n, is_read: 1 })));
        setUnreadCount(0);
      }
    } catch(e) {}
  };"""

if "handleMarkAllAsRead" not in notif_content:
    notif_content = notif_content.replace(
        'const markAsRead = async (id: string, link: string | null) => {',
        read_all + '\n\n  const markAsRead = async (id: string, link: string | null) => {'
    )

# 2. Add "Đánh dấu tất cả đã đọc" button UI
header_old = """                  <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                    <IconBell size={18} className="text-[#006838]" /> Thông báo
                  </h3>
                  <button
                    onClick={() => setIsOpen(false)}"""

header_new = """                  <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                    <IconBell size={18} className="text-[#006838]" /> Thông báo
                  </h3>
                  <div className="flex items-center gap-3">
                    <button onClick={handleMarkAllAsRead} className="text-xs font-semibold text-blue-600 hover:text-blue-700">Đánh dấu tất cả đã đọc</button>
                    <button
                      onClick={() => setIsOpen(false)}"""

notif_content = notif_content.replace(header_old, header_new)

# 3. Grouping Notifications (in render)
# Group notifications by title and link
group_script = """  // Group notifications by title + message
  const groupedNotifications = useMemo(() => {
    const groups = new Map<string, any>();
    notifications.forEach(n => {
      const key = `${n.title}-${n.message}-${n.link}`;
      if (groups.has(key)) {
        groups.get(key).count += 1;
        if (n.is_read === 0) groups.get(key).unreadCount += 1;
      } else {
        groups.set(key, { ...n, count: 1, unreadCount: n.is_read === 0 ? 1 : 0 });
      }
    });
    return Array.from(groups.values());
  }, [notifications]);"""

if "groupedNotifications" not in notif_content:
    notif_content = notif_content.replace(
        'const [isOpen, setIsOpen] = useState(false);',
        'const [isOpen, setIsOpen] = useState(false);\n' + group_script
    )

notif_content = notif_content.replace(
    'notifications.length === 0 ? (',
    'groupedNotifications.length === 0 ? ('
)

notif_content = notif_content.replace(
    'notifications.map((notif) => (',
    'groupedNotifications.map((notif) => ('
)

# Add badge for count if count > 1
count_badge_old = """                          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                            {notif.message}
                          </p>"""

count_badge_new = """                          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                            {notif.message}
                          </p>
                          {notif.count > 1 && (
                            <span className="inline-block mt-1 bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[10px] font-bold">
                               Gộp {notif.count} thông báo
                            </span>
                          )}"""

notif_content = notif_content.replace(count_badge_old, count_badge_new)

# Add useMemo import if missing
if "useMemo" not in notif_content:
    notif_content = notif_content.replace('useState, useEffect, useRef', 'useState, useEffect, useRef, useMemo')

with open(notif_path, "w", encoding="utf-8") as f:
    f.write(notif_content)

print("Patched NotificationCenter.tsx")
