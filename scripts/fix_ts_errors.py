import re

# 1. Fix NotificationCenter.tsx
path = r"d:\Work\TBS II\web\src\components\NotificationCenter.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Move useMemo declaration after notifications
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

content = content.replace(group_script, "")

content = content.replace(
    'const [unreadCount, setUnreadCount] = useState(0);',
    'const [unreadCount, setUnreadCount] = useState(0);\n\n' + group_script
)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)


# 2. Fix BusinessTripRecord in page.tsx
page_path = r"d:\Work\TBS II\web\src\app\business-trip\page.tsx"
with open(page_path, "r", encoding="utf-8") as f:
    page_content = f.read()

page_content = page_content.replace(
    'budgetStatus?: string;',
    'budgetStatus?: string;\n  logistics_json?: string;\n  signedTravelPaperJson?: string;'
)

with open(page_path, "w", encoding="utf-8") as f:
    f.write(page_content)

print("Fixed TS errors")
