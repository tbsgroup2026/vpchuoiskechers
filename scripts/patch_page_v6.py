import re
import os

page_path = r"d:\Work\TBS II\web\src\app\business-trip\page.tsx"
with open(page_path, "r", encoding="utf-8") as f:
    content = f.read()

notify_logic = """        showToast("✅ Đã lưu thông tin hậu cần thành công!");
        
        // Push notification to Creator
        broadcastNotification({
          title: "🚘 Thông tin hậu cần đã cập nhật",
          message: `Lễ tân đã sắp xếp xong Xe / Phòng / Vé máy bay cho chuyến đi "${selectedModalRecord.title}". Vui lòng kiểm tra chi tiết.`,
          type: "INFO",
          targetUser: selectedModalRecord.creator.split(" - ")[0], // Send to emp code if possible, or exact string match
          link: `/business-trip?id=${selectedModalRecord.id}`
        });

        await fetchD1Records();"""

content = content.replace(
    '        showToast("✅ Đã lưu thông tin hậu cần thành công!");\n        await fetchD1Records();',
    notify_logic
)

with open(page_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Added logistics notification")
