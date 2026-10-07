import os

page_path = r"d:\Work\TBS II\web\src\app\business-trip\page.tsx"
with open(page_path, "r", encoding="utf-8") as f:
    content = f.read()

old_func = """  const handlePaymentAction = async (action: "SUBMIT_DOCS" | "REVIEW_DOCS_PASS" | "REVIEW_DOCS_REJECT" | "MARK_PAID", tripId: string, notes?: string) => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/business-trips", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: tripId, actionLevel: action, paymentNotes: notes }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`✅ Đã cập nhật trạng thái quyết toán thành công!`);
        await fetchD1Records();
        
        // Update local modal state if open
        if (activeInvoiceTrip?.id === tripId) {
           const updated = records.find(r => r.id === tripId); // Note: we'd ideally fetch from server response, but fetchD1Records triggers a re-render. Let's just close modal for simplicity if it's too complex to merge, or let the re-render handle it.
           setActiveInvoiceTrip(null); 
        }
      } else {
        showToast(`❌ Lỗi: ${data.message || data.error}`);
      }
    } catch (e) {
      showToast("❌ Lỗi mạng, vui lòng thử lại!");
    } finally {
      setIsLoading(false);
    }
  };"""

new_func = """  const handlePaymentAction = async (action: string, tripId: string, notes?: string) => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/business-trips/payment-status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId, action, notes }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`✅ ${data.message}`);
        
        if (data.notify) {
           broadcastNotification(data.notify);
        }

        await fetchD1Records();
        
        if (activeInvoiceTrip?.id === tripId) {
           setActiveInvoiceTrip(null); 
        }
      } else {
        showToast(`❌ Lỗi: ${data.error || data.message}`);
      }
    } catch (e) {
      showToast("❌ Lỗi mạng, vui lòng thử lại!");
    } finally {
      setIsLoading(false);
    }
  };"""

content = content.replace(old_func, new_func)

with open(page_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Patched handlePaymentAction")
