import re
with open(r'd:\Work\TBS II\web\src\app\business-trip\page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the logistics_status error
content = content.replace('rec.logistics_status', 'rec.logisticsStatus')

# Restore handleSaveInvoice
restore = """  const handleInvoiceFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string;
      setNewInvoiceForm((prev) => ({
        ...prev,
        fileName: file.name,
        fileType: file.type,
        fileUrl: dataUrl,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveInvoice = async (tripId: string) => {
    if (!newInvoiceForm.title.trim()) {
      alert("Vui lòng nhập tên hóa đơn/chứng từ!");
      return;
    }
    const parsedAmount = parseFloat(newInvoiceForm.amount.replace(/[^0-9]/g, "")) || 0;
    if (parsedAmount <= 0) {
      alert("Vui lòng nhập số tiền hợp lệ!");
      return;
    }

    try {
      setIsLoading(true);
      const currentTrip = records.find(r => r.id === tripId);
      if (!currentTrip) return;

      const newInv: TripInvoice = {
        id: `inv_${Date.now()}`,
        title: newInvoiceForm.title,
        category: newInvoiceForm.category,
        amount: parsedAmount,
        invoiceDate: newInvoiceForm.invoiceDate,
        invoiceNumber: newInvoiceForm.invoiceNumber,
        notes: newInvoiceForm.notes,
        fileName: newInvoiceForm.fileName,
        fileType: newInvoiceForm.fileType,
        fileUrl: newInvoiceForm.fileUrl,
        createdAt: new Date().toISOString(),
      };

      const currentInvoices = currentTrip.invoices ? [...currentTrip.invoices, newInv] : [newInv];

      const res = await fetch("/api/business-trips", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: tripId,
          invoices_json: JSON.stringify(currentInvoices),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Đã lưu chứng từ thành công!");
        setNewInvoiceForm({
          title: "",
          category: "Vé máy bay / Tàu xe",
          amount: "",
          invoiceDate: new Date().toISOString().split("T")[0],
          invoiceNumber: "",
          notes: "",
          fileName: "",
          fileType: "",
          fileUrl: "",
        });
        await fetchD1Records();
        setGlobalImportModal(false);
      } else {
        showToast(`❌ Lỗi: ${data.message || data.error}`);
      }
    } catch (e) {
      showToast("❌ Lỗi mạng khi lưu hóa đơn.");
    } finally {
      setIsLoading(false);
    }
  };
"""
content = content.replace('  const handleUpdatePendingInvoice', restore + '\n  const handleUpdatePendingInvoice')
with open(r'd:\Work\TBS II\web\src\app\business-trip\page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
