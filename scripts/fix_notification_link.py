import re

file_path = r"d:\Work\TBS II\web\src\app\business-trip\page.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace the specific block
old_block = """          broadcastNotification({
            title: "🚙 Bố Trí Xe Công Tác Mới",
            message: `Đơn công tác "${target.title}" của ${target.creator} (${target.startDate} - ${target.endDate}) đã duyệt hoàn tất. Vui lòng xếp xe công ty/phương tiện.`,
            type: "INFO",
            targetUser: "Lễ Tân",
            link: "/business-trip",
          });"""

new_block = """          broadcastNotification({
            title: "🚙 Bố Trí Xe Công Tác Mới",
            message: `Đơn công tác "${target.title}" của ${target.creator} (${target.startDate} - ${target.endDate}) đã duyệt hoàn tất. Vui lòng xếp xe công ty/phương tiện.`,
            type: "INFO",
            targetUser: "Lễ Tân",
            link: `/business-trip?tab=LOGISTICS&id=${target.id}`,
          });"""

content = content.replace(old_block, new_block)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed notification link")
