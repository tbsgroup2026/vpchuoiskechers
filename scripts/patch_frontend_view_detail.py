import re
import os

page_path = r"d:\Work\TBS II\web\src\app\business-trip\page.tsx"
with open(page_path, "r", encoding="utf-8") as f:
    page_content = f.read()

# Replace all setSelectedModalRecord(rec) and similar calls with handleViewDetail(rec.id)
# 1. Add handleViewDetail
view_detail_script = """
  const handleViewDetail = async (tripId: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/business-trips/${tripId}`);
      const data = await res.json();
      if (data.success) {
        setSelectedModalRecord(data.data);
      } else {
        showToast(`Lỗi lấy dữ liệu: ${data.error}`);
      }
    } catch (e) {
      showToast("Lỗi mạng khi tải chi tiết");
    } finally {
      setIsLoading(false);
    }
  };
"""

if "const handleViewDetail" not in page_content:
    page_content = page_content.replace(
        'const fetchD1Records = async () => {',
        view_detail_script + '\n  const fetchD1Records = async () => {'
    )

# 2. Replace setSelectedModalRecord(rec) inside the grid/list views
# For table row eye icon: onClick={() => setSelectedModalRecord(rec)}
page_content = page_content.replace(
    'onClick={() => setSelectedModalRecord(rec)}',
    'onClick={() => handleViewDetail(rec.id)}'
)
# For mobile card click: onClick={() => setSelectedModalRecord(trip)}
page_content = page_content.replace(
    'onClick={() => setSelectedModalRecord(trip)}',
    'onClick={() => handleViewDetail(trip.id)}'
)
# For logistics click: setSelectedModalRecord({...target
page_content = page_content.replace(
    'setSelectedModalRecord({...target, logistics: target.logistics_json ? JSON.parse(target.logistics_json) : null})',
    'handleViewDetail(target.id)'
)

with open(page_path, "w", encoding="utf-8") as f:
    f.write(page_content)

print("Patched handleViewDetail")
