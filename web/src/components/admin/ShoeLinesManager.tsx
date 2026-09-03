"use client";

import React, { useState } from "react";
import {
  IconPlus,
  IconTrash,
  IconEdit,
  IconCheck,
  IconUpload,
  IconArrowUp,
  IconArrowDown,
  IconArrowLeft,
  IconArrowRight,
  IconRefresh,
  IconEye,
} from "@tabler/icons-react";
import { ShoeLinesConfig, ShoeGroup, ShoeImageItem, DEFAULT_SHOE_LINES_CONFIG } from "@/lib/landingCMS";
import { uploadCloudinaryFile } from "@/lib/cloudinary";

interface Props {
  shoeLines: ShoeLinesConfig;
  onChange: (config: ShoeLinesConfig) => void;
  showToast: (msg: string) => void;
}

export default function ShoeLinesManager({ shoeLines, onChange, showToast }: Props) {
  const [config, setConfig] = useState<ShoeLinesConfig>(shoeLines || DEFAULT_SHOE_LINES_CONFIG);
  const [activePreviewTab, setActivePreviewTab] = useState<"edit" | "preview">("edit");
  const [isUploading, setIsUploading] = useState(false);

  const handleTitleChange = (newTitle: string) => {
    const updated = { ...config, title: newTitle };
    setConfig(updated);
    onChange(updated);
  };

  const handleGroupTitleChange = (groupId: string, newTitle: string) => {
    const updatedGroups = config.groups.map((g) => (g.id === groupId ? { ...g, title: newTitle } : g));
    const updated = { ...config, groups: updatedGroups };
    setConfig(updated);
    onChange(updated);
  };

  const handleImageFileUpload = async (file: File, groupId: string, itemIndex: number) => {
    if (file.size > 5 * 1024 * 1024) {
      alert("⚠️ Dung lượng tệp ảnh quá lớn (vượt quá 5MB)!");
      return;
    }

    try {
      setIsUploading(true);

      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          updateItemUrl(groupId, itemIndex, reader.result);
        }
      };
      reader.readAsDataURL(file);

      const res = await uploadCloudinaryFile(file, { category: "shoe_lines" });
      if (res.secure_url) {
        updateItemUrl(groupId, itemIndex, res.secure_url);
        showToast(`☁️ Tải ảnh giày "${file.name}" lên Cloudinary CDN thành công!`);
      }
    } catch (e: any) {
      console.warn("Cloudinary upload warning:", e);
    } finally {
      setIsUploading(false);
    }
  };

  const updateItemUrl = (groupId: string, itemIndex: number, newUrl: string) => {
    const updatedGroups = config.groups.map((group) => {
      if (group.id !== groupId) return group;
      const newItems = [...group.items];
      if (newItems[itemIndex]) {
        newItems[itemIndex] = { ...newItems[itemIndex], url: newUrl };
      }
      return { ...group, items: newItems };
    });
    const updated = { ...config, groups: updatedGroups };
    setConfig(updated);
    onChange(updated);
  };

  const handleMoveItem = (groupId: string, itemIdx: number, direction: "LEFT" | "RIGHT") => {
    const group = config.groups.find((g) => g.id === groupId);
    if (!group) return;

    if (
      (direction === "LEFT" && itemIdx === 0) ||
      (direction === "RIGHT" && itemIdx === group.items.length - 1)
    ) {
      return;
    }

    const targetIdx = direction === "LEFT" ? itemIdx - 1 : itemIdx + 1;
    const newItems = [...group.items];
    const temp = newItems[itemIdx];
    newItems[itemIdx] = newItems[targetIdx];
    newItems[targetIdx] = temp;

    const updatedGroups = config.groups.map((g) => (g.id === groupId ? { ...g, items: newItems } : g));
    const updated = { ...config, groups: updatedGroups };
    setConfig(updated);
    onChange(updated);
    showToast("↔️ Đã thay đổi thứ tự ảnh giày");
  };

  const handleAddItemToGroup = (groupId: string) => {
    const updatedGroups = config.groups.map((group) => {
      if (group.id !== groupId) return group;
      const newItem: ShoeImageItem = {
        id: `img-${Date.now()}`,
        url: "/images/brands/skechers.svg",
        name: "Giày SKECHERS Mới",
        order: group.items.length + 1,
      };
      return { ...group, items: [...group.items, newItem] };
    });
    const updated = { ...config, groups: updatedGroups };
    setConfig(updated);
    onChange(updated);
    showToast("➕ Đã thêm ô ảnh mới vào nhóm");
  };

  const handleDeleteItemFromGroup = (groupId: string, itemIndex: number) => {
    const updatedGroups = config.groups.map((group) => {
      if (group.id !== groupId) return group;
      const newItems = group.items.filter((_, idx) => idx !== itemIndex);
      return { ...group, items: newItems };
    });
    const updated = { ...config, groups: updatedGroups };
    setConfig(updated);
    onChange(updated);
    showToast("🗑️ Đã xóa ô ảnh khỏi nhóm");
  };

  const handleMoveGroup = (groupIndex: number, direction: "UP" | "DOWN") => {
    if (
      (direction === "UP" && groupIndex === 0) ||
      (direction === "DOWN" && groupIndex === config.groups.length - 1)
    ) {
      return;
    }

    const targetIdx = direction === "UP" ? groupIndex - 1 : groupIndex + 1;
    const newGroups = [...config.groups];
    const temp = newGroups[groupIndex];
    newGroups[groupIndex] = newGroups[targetIdx];
    newGroups[targetIdx] = temp;

    const updated = { ...config, groups: newGroups };
    setConfig(updated);
    onChange(updated);
    showToast("↔️ Đã thay đổi thứ tự nhóm sản phẩm");
  };

  const handleAddGroup = () => {
    const newGroup: ShoeGroup = {
      id: `sg-${Date.now()}`,
      title: "NHÓM MỚI",
      order: config.groups.length + 1,
      items: [
        { id: `img-${Date.now()}-1`, url: "/images/brands/skechers.svg", name: "Shoe 1", order: 1 },
        { id: `img-${Date.now()}-2`, url: "/images/crawled/05.webp", name: "Shoe 2", order: 2 },
      ],
    };
    const updated = { ...config, groups: [...config.groups, newGroup] };
    setConfig(updated);
    onChange(updated);
    showToast("🎉 Đã tạo thêm 1 nhóm dòng giày mới!");
  };

  const handleDeleteGroup = (groupId: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa nhóm dòng giày này?")) {
      const updatedGroups = config.groups.filter((g) => g.id !== groupId);
      const updated = { ...config, groups: updatedGroups };
      setConfig(updated);
      onChange(updated);
      showToast("🗑️ Đã xóa nhóm dòng giày");
    }
  };

  const handleResetDefaults = () => {
    if (confirm("Bạn có chắc chắn muốn khôi phục 3 nhóm dòng giày SKECHERS mặc định?")) {
      setConfig(DEFAULT_SHOE_LINES_CONFIG);
      onChange(DEFAULT_SHOE_LINES_CONFIG);
      showToast("🔄 Đã khôi phục nhóm dòng giày mặc định thành công!");
    }
  };

  const handleSaveConfig = () => {
    onChange(config);
    showToast("💾 ĐÃ LƯU THAY ĐỔI DÒNG GIÀY TIÊU BIỂU THÀNH CÔNG!");
  };

  const totalImages = config.groups.reduce((acc, g) => acc + (g.items?.length || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2 font-display">
              <span className="w-3 h-3 rounded-full bg-[#004029]" />
              Quản Lý Dòng Giày SKECHERS Tiêu Biểu (Featured Shoe Lines)
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Quản lý các khối nhóm dòng sản phẩm giày (Performance Running, Lifestyle Casual, Work & Safety...)
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setActivePreviewTab("edit")}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer transition-all flex items-center gap-1 ${
                  activePreviewTab === "edit"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <IconEdit size={14} />
                <span>Chỉnh sửa</span>
              </button>

              <button
                type="button"
                onClick={() => setActivePreviewTab("preview")}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer transition-all flex items-center gap-1 ${
                  activePreviewTab === "preview"
                    ? "bg-[#004029] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <IconEye size={14} />
                <span>Xem Trước Live</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <IconRefresh size={16} />
              <span>Reset Mặc Định</span>
            </button>

            <button
              type="button"
              onClick={handleSaveConfig}
              className="px-5 py-2.5 rounded-xl bg-[#004029] hover:bg-[#005a39] text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <IconCheck size={18} />
              <span>Lưu Thay Đổi</span>
            </button>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Tiêu Đề Khối Trang Chủ (In Hoa)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={config.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="DÒNG GIÀY CHUỖI SKECHERS TIÊU BIỂU"
              className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm font-black uppercase tracking-widest outline-none focus:border-[#004029]"
            />
            <span className="text-xs text-slate-500 font-mono font-bold">
              {config.groups.length} Nhóm | {totalImages} Ảnh Giày
            </span>
          </div>
        </div>
      </div>

      {activePreviewTab === "edit" && (
        <div className="space-y-6">
          {config.groups.map((group, groupIdx) => (
            <div
              key={group.id || groupIdx}
              className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-4 transition-all hover:border-[#004029]/40"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3 flex-1">
                  <span className="w-7 h-7 rounded-xl bg-[#004029] text-white font-mono font-bold text-xs flex items-center justify-center flex-shrink-0">
                    #{groupIdx + 1}
                  </span>
                  <input
                    type="text"
                    value={group.title}
                    onChange={(e) => handleGroupTitleChange(group.id, e.target.value)}
                    placeholder="Tên Nhóm (Ví dụ: PERFORMANCE RUNNING)"
                    className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-black uppercase tracking-wider outline-none focus:border-[#004029] focus:bg-white max-w-xs"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={groupIdx === 0}
                    onClick={() => handleMoveGroup(groupIdx, "UP")}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-30 cursor-pointer transition-colors"
                    title="Chuyển lên trước"
                  >
                    <IconArrowUp size={14} />
                  </button>

                  <button
                    type="button"
                    disabled={groupIdx === config.groups.length - 1}
                    onClick={() => handleMoveGroup(groupIdx, "DOWN")}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-30 cursor-pointer transition-colors"
                    title="Chuyển xuống sau"
                  >
                    <IconArrowDown size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddItemToGroup(group.id)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#004029] text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <IconPlus size={14} />
                    <span>Thêm Ảnh</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteGroup(group.id)}
                    className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition-colors cursor-pointer"
                    title="Xóa nhóm"
                  >
                    <IconTrash size={15} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {group.items.map((item, itemIdx) => (
                  <div
                    key={item.id || itemIdx}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 flex flex-col justify-between"
                  >
                    <div className="aspect-square rounded-xl bg-white p-2 border border-slate-200 flex items-center justify-center relative overflow-hidden group">
                      <img
                        src={item.url}
                        alt={item.name || `Shoe ${itemIdx + 1}`}
                        className="max-h-full max-w-full object-contain filter drop-shadow-xs"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl bg-[#004029] hover:bg-[#005a39] text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs">
                        <IconUpload size={14} />
                        <span>{isUploading ? "Đang nạp..." : "Thay Ảnh Từ Máy"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageFileUpload(file, group.id, itemIdx);
                          }}
                        />
                      </label>

                      <input
                        type="text"
                        value={item.url}
                        onChange={(e) => updateItemUrl(group.id, itemIdx, e.target.value)}
                        placeholder="Link URL ảnh..."
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 text-[11px] font-mono outline-none focus:border-[#004029]"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/80">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={itemIdx === 0}
                          onClick={() => handleMoveItem(group.id, itemIdx, "LEFT")}
                          className="p-1 rounded-md bg-white border border-slate-200 text-slate-600 disabled:opacity-30 cursor-pointer"
                          title="Qua trái"
                        >
                          <IconArrowLeft size={13} />
                        </button>
                        <button
                          type="button"
                          disabled={itemIdx === group.items.length - 1}
                          onClick={() => handleMoveItem(group.id, itemIdx, "RIGHT")}
                          className="p-1 rounded-md bg-white border border-slate-200 text-slate-600 disabled:opacity-30 cursor-pointer"
                          title="Qua phải"
                        >
                          <IconArrowRight size={13} />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteItemFromGroup(group.id, itemIdx)}
                        className="text-rose-500 hover:text-rose-700 text-[11px] font-bold cursor-pointer"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddGroup}
            className="w-full py-4 rounded-3xl bg-slate-100 hover:bg-slate-200 border-2 border-dashed border-slate-300 text-slate-700 font-extrabold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <IconPlus size={18} />
            <span>Thêm Nhóm Dòng Giày SKECHERS Mới</span>
          </button>
        </div>
      )}

      {activePreviewTab === "preview" && (
        <div className="space-y-4">
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#004029] text-xs font-bold flex items-center gap-2">
            <IconEye size={18} />
            <span>Xem trước Giao diện Dòng Giày Tiêu Biểu xuất hiện trên Trang Chủ:</span>
          </div>

          <div className="relative z-30 py-7 bg-[#0c1f19] rounded-3xl border border-emerald-500/30 shadow-2xl overflow-hidden">
            <div className="w-full text-center space-y-4">
              <div className="flex items-center justify-center gap-4 px-4">
                <div className="h-[1px] w-12 sm:w-20 bg-gradient-to-r from-transparent to-emerald-400" />
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-[3.5px] text-emerald-300 font-display">
                  {config.title || "DÒNG GIÀY CHUỖI SKECHERS TIÊU BIỂU"}
                </h3>
                <div className="h-[1px] w-12 sm:w-20 bg-gradient-to-l from-transparent to-emerald-400" />
              </div>

              <div className="overflow-hidden w-full flex items-center py-1">
                <div className="flex items-center gap-5 justify-center flex-wrap px-4">
                  {config.groups.map((grp) => (
                    <React.Fragment key={grp.id}>
                      {grp.items.map((item, idx) => (
                        <div
                          key={`${item.id}-${idx}`}
                          className="flex-shrink-0 flex items-center justify-center w-[150px] h-[68px] rounded-[18px] px-4 py-2 bg-white shadow-lg border border-white/30"
                        >
                          <img
                            src={item.url}
                            alt={item.name || grp.title}
                            className="max-h-[48px] max-w-[130px] w-auto h-auto object-contain"
                          />
                        </div>
                      ))}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
