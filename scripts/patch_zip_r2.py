import re

page_path = r"d:\Work\TBS II\web\src\app\business-trip\page.tsx"
with open(page_path, "r", encoding="utf-8") as f:
    page_content = f.read()

old_zip = """  // --- KẾ TOÁN & QUYẾT TOÁN ACTIONS ---
  const handleDownloadZIP = async (trip: BusinessTripRecord) => {
    try {
      setIsLoading(true);
      showToast("Đang chuẩn bị file ZIP, vui lòng đợi...");
      const zip = new JSZip();
      let hasFiles = false;

      // Add signed paper if exists
      if (trip.signedTravelPaper?.dataUrl) {
        const base64Data = trip.signedTravelPaper.dataUrl.split(",")[1];
        if (base64Data) {
          zip.file(`GiayDiDuong_${trip.code}_${trip.creator}.${trip.signedTravelPaper.type.includes("pdf") ? "pdf" : "png"}`, base64Data, { base64: true });
          hasFiles = true;
        }
      }

      // Add invoices
      if (trip.invoices && trip.invoices.length > 0) {
        const folder = zip.folder("HoaDon");
        trip.invoices.forEach((inv, idx) => {
          if (inv.fileUrl) {
            const base64Data = inv.fileUrl.split(",")[1];
            if (base64Data) {
              const ext = inv.fileType?.includes("pdf") ? "pdf" : "png";
              folder?.file(`${idx + 1}_${inv.title.replace(/[\/\\\\?%*:|"<>]/g, '-')}.${ext}`, base64Data, { base64: true });
              hasFiles = true;
            }
          }
        });
      }

      if (!hasFiles) {
        showToast("Không có chứng từ nào để tải", "error");
        return;
      }

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `ChungTu_${trip.code}_${trip.creator}.zip`);
      showToast("Tải ZIP thành công!", "success");
    } catch (e) {
      showToast("Lỗi khi tạo ZIP", "error");
    } finally {
      setIsLoading(false);
    }
  };"""

new_zip = """  // --- KẾ TOÁN & QUYẾT TOÁN ACTIONS ---
  const handleDownloadZIP = async (trip: BusinessTripRecord) => {
    try {
      setIsLoading(true);
      showToast("Đang tải file từ server, vui lòng không tắt trang...");
      const zip = new JSZip();
      let hasFiles = false;

      const fetchFileForZip = async (url: string) => {
        if (url.startsWith("data:")) {
           // Base64
           return url.split(",")[1];
        }
        // Fetch from R2
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch file");
        return await res.blob();
      };

      // Add signed paper if exists
      if (trip.signedTravelPaper?.dataUrl) {
        try {
          const fileData = await fetchFileForZip(trip.signedTravelPaper.dataUrl);
          const isBase64 = typeof fileData === "string";
          zip.file(`GiayDiDuong_${trip.code}_${trip.creator}.${trip.signedTravelPaper.type?.includes("pdf") ? "pdf" : "png"}`, fileData, isBase64 ? { base64: true } : undefined);
          hasFiles = true;
        } catch(e) { console.error(e); }
      }

      // Add invoices
      if (trip.invoices && trip.invoices.length > 0) {
        const folder = zip.folder("HoaDon");
        for (let idx = 0; idx < trip.invoices.length; idx++) {
          const inv = trip.invoices[idx];
          if (inv.fileUrl) {
             try {
                const fileData = await fetchFileForZip(inv.fileUrl);
                const isBase64 = typeof fileData === "string";
                const ext = inv.fileType?.includes("pdf") ? "pdf" : "png";
                folder?.file(`${idx + 1}_${(inv.title || "HoaDon").replace(/[\/\\\\?%*:|"<>]/g, '-')}.${ext}`, fileData, isBase64 ? { base64: true } : undefined);
                hasFiles = true;
             } catch(e) { console.error(e); }
          }
        }
      }

      if (!hasFiles) {
        showToast("Không có chứng từ nào để tải (Hoặc lỗi tải)");
        return;
      }

      showToast("Đang nén ZIP...");
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `ChungTu_${trip.code}_${trip.creator}.zip`);
      showToast("Tải ZIP thành công!");
    } catch (e) {
      showToast("Lỗi khi tạo ZIP");
    } finally {
      setIsLoading(false);
    }
  };"""

page_content = page_content.replace(old_zip, new_zip)

with open(page_path, "w", encoding="utf-8") as f:
    f.write(page_content)

print("Patched handleDownloadZIP to support R2 fetching")
