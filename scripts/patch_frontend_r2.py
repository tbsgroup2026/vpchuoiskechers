import re
import os

page_path = r"d:\Work\TBS II\web\src\app\business-trip\page.tsx"
with open(page_path, "r", encoding="utf-8") as f:
    page_content = f.read()

# 1. Add Image Compression function
compression_script = """
  const compressImage = (file: File, maxSize: number = 1600, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > height && width > maxSize) {
            height *= maxSize / width;
            width = maxSize;
          } else if (height > maxSize) {
            width *= maxSize / height;
            height = maxSize;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve(file); // Fallback
          
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          }, file.type, quality);
        };
        img.onerror = () => resolve(file); // Fallback
      };
      reader.onerror = () => resolve(file);
    });
  };

  const uploadFileToR2 = async (file: File, fileType: string, tripId: string = ""): Promise<any> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("fileType", fileType);
    if (tripId) formData.append("tripId", tripId);

    const res = await fetch("/api/files/upload", {
      method: "POST",
      body: formData,
    });
    return await res.json();
  };
"""

if "compressImage" not in page_content:
    # Insert at the beginning of the component (after const router = useRouter())
    page_content = page_content.replace(
        'const router = useRouter();',
        'const router = useRouter();\n' + compression_script
    )

# 2. Patch handleFileUpload (for attachments)
old_handle_file_upload = """  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachments((prev) => [
          ...prev,
          {
            id: `ATT-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            name: file.name,
            fileData: reader.result as string,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };"""

new_handle_file_upload = """  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setIsLoading(true);
    
    try {
      for (const file of Array.from(files)) {
        let finalFile = file;
        if (file.type.startsWith("image/")) {
           finalFile = await compressImage(file, 1600, 0.8);
        }
        const uploadRes = await uploadFileToR2(finalFile, "ATTACHMENT");
        if (uploadRes.success) {
          setAttachments((prev) => [
            ...prev,
            {
              id: uploadRes.data.id,
              name: uploadRes.data.originalName,
              fileData: `/api/files/${uploadRes.data.id}`, // Store URL instead of Base64
            },
          ]);
        } else {
          showToast(`Lỗi tải lên ${file.name}: ${uploadRes.error}`);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };"""

page_content = page_content.replace(old_handle_file_upload, new_handle_file_upload)


# 3. Patch Invoice Upload 
# Find handleAddInvoices function
old_invoice_upload = """  const handleAddInvoices = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !selectedModalRecord) return;
    
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPendingInvoices((prev) => [
          ...prev,
          {
            id: `INV-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            name: file.name,
            fileData: reader.result as string,
            amount: 0,
            date: new Date().toISOString().split("T")[0],
            category: "OTHER",
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };"""

new_invoice_upload = """  const handleAddInvoices = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !selectedModalRecord) return;
    setIsLoading(true);

    try {
      for (const file of Array.from(files)) {
        let finalFile = file;
        if (file.type.startsWith("image/")) {
           finalFile = await compressImage(file, 1600, 0.8);
        }
        const uploadRes = await uploadFileToR2(finalFile, "INVOICE", selectedModalRecord.id);
        if (uploadRes.success) {
          setPendingInvoices((prev) => [
            ...prev,
            {
              id: uploadRes.data.id,
              name: uploadRes.data.originalName,
              fileData: `/api/files/${uploadRes.data.id}`, // Store URL instead of Base64
              amount: 0,
              date: new Date().toISOString().split("T")[0],
              category: "OTHER",
            },
          ]);
        } else {
          showToast(`Lỗi tải lên ${file.name}: ${uploadRes.error}`);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };"""

page_content = page_content.replace(old_invoice_upload, new_invoice_upload)

with open(page_path, "w", encoding="utf-8") as f:
    f.write(page_content)

print("Patched frontend to use R2 upload & client compression")
