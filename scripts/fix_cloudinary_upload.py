import re

file_path = 'web/src/app/rooms/page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_block = """        try {
          const uploadedUrls = await Promise.all(
            imagesArr.map(async (img) => {
              const url = typeof img === 'string' ? img : img.url;
              const public_id = typeof img === 'string' ? '' : (img.public_id || '');
              
              if (!url || !url.startsWith("data:")) return { url, public_id };
              
              // 1. Get Signature
              const signRes = await fetch("/api/cloudinary/sign", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ folder: "meeting-rooms" })
              });
              if (!signRes.ok) throw new Error(`Lỗi cấp quyền upload (Mã: ${signRes.status})`);
              const signData = await signRes.json();
              if (!signData.success) throw new Error(signData.error || "Không thể lấy chữ ký Cloudinary");
              
              // 2. Upload
              const formData = new FormData();
              formData.append("file", url);
              formData.append("api_key", signData.apiKey);
              formData.append("timestamp", signData.timestamp);
              formData.append("signature", signData.signature);
              formData.append("folder", "meeting-rooms");
              
              const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`, {
                method: "POST",
                body: formData
              });
              if (!uploadRes.ok) throw new Error(`Lỗi upload Cloudinary (Mã: ${uploadRes.status})`);
              const uploadData = await uploadRes.json();
              if (!uploadData.secure_url) throw new Error("Cloudinary không trả về URL ảnh");
              return { url: uploadData.secure_url, public_id: uploadData.public_id };
            })
          );
          imagesArr = uploadedUrls;
        } catch (uploadError: any) {
          setIsUploadingImages(false);
          alert("Tải ảnh lên thất bại: " + uploadError.message);
          return; // Stop saving if upload fails!
        }"""

new_block = """        try {
          const uploadedUrls = await Promise.all(
            imagesArr.map(async (img) => {
              const url = typeof img === 'string' ? img : img.url;
              const public_id = typeof img === 'string' ? '' : (img.public_id || '');
              
              if (!url || !url.startsWith("data:")) return { url, public_id };
              
              const { secure_url, public_id: new_public_id } = await uploadCloudinaryFile(url, { category: "meeting-rooms" });
              return { url: secure_url, public_id: new_public_id };
            })
          );
          imagesArr = uploadedUrls;
        } catch (uploadError: any) {
          setIsUploadingImages(false);
          alert("Tải ảnh lên thất bại: " + (uploadError.message || uploadError.toString()));
          return; // Stop saving if upload fails!
        }"""

if old_block in content:
    content = content.replace(old_block, new_block)
    print("Replaced old upload block with uploadCloudinaryFile.")
else:
    print("Old upload block not found!")

if 'import { uploadCloudinaryFile }' not in content:
    # find where to insert the import
    import_match = re.search(r'^import .*?;\n', content, re.MULTILINE)
    if import_match:
        content = content[:import_match.start()] + 'import { uploadCloudinaryFile } from "@/lib/cloudinary";\n' + content[import_match.start():]
        print("Added import.")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

