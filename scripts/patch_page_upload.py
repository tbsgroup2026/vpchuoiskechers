import os
import re

file_path = 'web/src/app/rooms/page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add isUploading state
state_search = "const [editingRoom, setEditingRoom] = useState<Partial<MeetingRoom> | null>(null);"
if "const [isUploadingImages, setIsUploadingImages]" not in content:
    content = content.replace(state_search, state_search + "\n  const [isUploadingImages, setIsUploadingImages] = useState(false);")

# 2. Fix handleSaveRoom to NOT swallow errors and handle UI locking
old_save_match = re.search(r'(const handleSaveRoom = async \(e: React\.FormEvent\) => \{.*?)(const equipmentArr = Array\.isArray)', content, re.DOTALL)
if old_save_match:
    old_save = old_save_match.group(1)
    new_save = '''const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom) return;
    try {
      let imagesArr = Array.isArray(editingRoom.images) ? [...editingRoom.images] : [];
      const hasBase64 = imagesArr.some(img => (typeof img === 'string' && img.startsWith("data:")) || (img && img.url && img.url.startsWith("data:")));
      
      if (hasBase64) {
        setIsUploadingImages(true);
        showToast("⏳ Đang tải ảnh lên hệ thống...");
        
        try {
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
        }
        setIsUploadingImages(false);
      }
      
      '''
    content = content.replace(old_save, new_save)


# 3. Disable submit buttons if isUploadingImages
btn_submit_old = '''<button
                      type="submit"
                      className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 active:scale-95 transition-all shadow-sm"
                    >
                      Lưu thông tin
                    </button>'''
btn_submit_new = '''<button
                      type="submit"
                      disabled={isUploadingImages}
                      className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUploadingImages ? "Đang tải ảnh..." : "Lưu thông tin"}
                    </button>'''
content = content.replace(btn_submit_old, btn_submit_new)


# 4. We need to make sure the image compression / logic handles file input correctly and maps to object
# Wait, let's find the file input again using exact string from earlier log
file_input_old = '''onChange={async (e) => {
                      const files = Array.from(e.target.files || []);
                      if (!files.length) return;
                      const toBase64 = (file: File): Promise<string> =>
                        new Promise((res, rej) => {
                          const reader = new FileReader();
                          reader.onload = () => res(reader.result as string);
                          reader.onerror = rej;
                          reader.readAsDataURL(file);
                        });
                      const base64List = await Promise.all(files.map(toBase64));
                      const existing = Array.isArray(editingRoom.images) ? editingRoom.images : [];
                      setEditingRoom({ ...editingRoom, images: [...existing, ...base64List] });
                    }}'''

file_input_new = '''onChange={async (e) => {
                      const files = Array.from(e.target.files || []);
                      if (!files.length) return;
                      
                      const compressImage = (file: File): Promise<string> =>
                        new Promise((resolve, reject) => {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const img = new window.Image(); // Use window.Image to avoid TS conflict
                            img.src = event.target?.result as string;
                            img.onload = () => {
                              const canvas = document.createElement("canvas");
                              let width = img.width;
                              let height = img.height;
                              const MAX_SIZE = 1200;
                              
                              if (width > height && width > MAX_SIZE) {
                                height = Math.round((height * MAX_SIZE) / width);
                                width = MAX_SIZE;
                              } else if (height > MAX_SIZE) {
                                width = Math.round((width * MAX_SIZE) / height);
                                height = MAX_SIZE;
                              }
                              
                              canvas.width = width;
                              canvas.height = height;
                              const ctx = canvas.getContext("2d");
                              if (!ctx) { resolve(img.src); return; }
                              ctx.drawImage(img, 0, 0, width, height);
                              resolve(canvas.toDataURL("image/jpeg", 0.8)); // Compress quality 80%
                            };
                            img.onerror = reject;
                          };
                          reader.onerror = reject;
                          reader.readAsDataURL(file);
                        });

                      try {
                        const base64List = await Promise.all(files.map(compressImage));
                        const formattedList = base64List.map(url => ({ url, public_id: "" }));
                        const existing = Array.isArray(editingRoom.images) ? editingRoom.images : [];
                        setEditingRoom({ ...editingRoom, images: [...existing, ...formattedList] });
                      } catch (err) {
                        alert("Lỗi nén ảnh, vui lòng thử lại!");
                      }
                    }}'''

content = content.replace(file_input_old, file_input_new)


# 5. Fix the preview count text
count_old = '''const local = imgs.filter((u) => u.startsWith("data:"));
                      return local.length > 0
                        ? `${local.length} tệp đã chọn`
                        : "Chưa có tệp nào được chọn";'''
count_new = '''const local = imgs.filter((u) => (typeof u === 'string' && u.startsWith("data:")) || (u && u.url && u.url.startsWith("data:")));
                      return local.length > 0
                        ? `${local.length} ảnh mới sẽ được tải lên`
                        : "Chưa có ảnh mới nào";'''
content = content.replace(count_old, count_new)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("page.tsx updated successfully!")
