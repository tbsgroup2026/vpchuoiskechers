import os

page_path = r"d:\Work\TBS II\web\src\app\rooms\page.tsx"
with open(page_path, "r", encoding="utf-8") as f:
    content = f.read()

old_logic = """          if (Array.isArray(result.data.rooms) && result.data.rooms.length > 0) {
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
          }"""

new_logic = """          if (Array.isArray(result.data.rooms)) {
            setRooms((prev) =>
              result.data.rooms.map((r: any) => {
                const matched = prev.find((p) => p.id === r.id);
                const normalized = normalizeRoom(r);
                if (matched) {
                  normalized.colorClass = matched.colorClass;
                  normalized.badgeBg = matched.badgeBg;
                }
                return normalized;
              })
            );
          }"""

content = content.replace(old_logic, new_logic)

with open(page_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed setRooms logic in page.tsx")
