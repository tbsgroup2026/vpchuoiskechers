"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Lightbox from "@/components/Lightbox";
import { useDirectory } from "@/lib/useDirectory";
import {
  IconPlus,
  IconTrash,
  IconLoader2,
  IconCircleCheck,
  IconCircleX,
  IconClock,
} from "@tabler/icons-react";

const HEADER_IMAGE = "/images/KGLV/MẶT TIỀN SẢNH.png";

interface Member {
  hoTen: string;
  chucVu: string;
  msnv: string;
  boPhan: string;
  dienThoai: string;
  diaDiemDon: string;
}

const emptyMember: Member = { hoTen: "", chucVu: "", msnv: "", boPhan: "", dienThoai: "", diaDiemDon: "" };

function addDays(dateStr: string, days: number): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  d.setDate(d.getDate() + (days - 1));
  return d.toISOString().slice(0, 10);
}

const STATUS_LABEL: Record<string, { label: string; className: string; icon: typeof IconClock }> = {
  PENDING: { label: "Chờ duyệt", className: "bg-amber-50 text-amber-700 border-amber-200", icon: IconClock },
  APPROVED: { label: "Đã duyệt", className: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: IconCircleCheck },
  REJECTED: { label: "Từ chối", className: "bg-red-50 text-red-700 border-red-200", icon: IconCircleX },
};

export default function BusinessTripPage() {
  const [tab, setTab] = useState<"input" | "view">("input");
  const [user, setUser] = useState<{ name: string; empCode: string } | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => data.user && setUser(data.user))
      .catch(() => {});
  }, []);

  const zones = useDirectory("zones");
  const factories = useDirectory("factories");
  const boPhanList = useDirectory("bo_phan");
  const workLocations = useDirectory("work_locations");
  const travelMethods = useDirectory("travel_methods");
  const workAddresses = useDirectory("work_addresses");

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [form, setForm] = useState({
    donViXuat: "",
    khuVucId: "",
    nhaMayId: "",
    nguoiTao: "",
    boPhanId: "",
    congTacTaiId: "",
    hinhThucId: "",
    ngayBatDau: today,
    soNgay: 1,
    ngayKetThuc: addDays(today, 1),
    mucDich: "",
    diaChiCongTacId: "",
    ghiChu: "",
  });

  useEffect(() => {
    if (user?.name) setForm((f) => ({ ...f, nguoiTao: f.nguoiTao || user.name }));
  }, [user]);

  const [members, setMembers] = useState<Member[]>([{ ...emptyMember }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function setField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === "ngayBatDau" || key === "soNgay") {
        next.ngayKetThuc = addDays(next.ngayBatDau, Number(next.soNgay) || 1);
      }
      return next;
    });
  }

  function updateMember(idx: number, key: keyof Member, value: string) {
    setMembers((rows) => rows.map((r, i) => (i === idx ? { ...r, [key]: value } : r)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.donViXuat || !form.khuVucId || !form.nhaMayId || !form.nguoiTao || !form.boPhanId || !form.congTacTaiId || !form.hinhThucId || !form.ngayBatDau || !form.mucDich) {
      setError("Vui lòng điền đầy đủ các trường bắt buộc (*)");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/business-trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          khuVucId: Number(form.khuVucId),
          nhaMayId: Number(form.nhaMayId),
          boPhanId: Number(form.boPhanId),
          congTacTaiId: Number(form.congTacTaiId),
          hinhThucId: Number(form.hinhThucId),
          diaChiCongTacId: form.diaChiCongTacId ? Number(form.diaChiCongTacId) : null,
          soNgay: Number(form.soNgay),
          members: members.filter((m) => m.hoTen && m.msnv),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gửi đề xuất thất bại");

      setSuccess("Đã gửi đề xuất đi công tác thành công! Đơn của bạn đang chờ Admin duyệt.");
      setForm({
        donViXuat: "",
        khuVucId: "",
        nhaMayId: "",
        nguoiTao: user?.name || "",
        boPhanId: "",
        congTacTaiId: "",
        hinhThucId: "",
        ngayBatDau: today,
        soNgay: 1,
        ngayKetThuc: addDays(today, 1),
        mucDich: "",
        diaChiCongTacId: "",
        ghiChu: "",
      });
      setMembers([{ ...emptyMember }]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/70 font-sans text-slate-900">
      <Header />
      <main className="flex-1 pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-[1100px] mx-auto w-full space-y-6">
        <div className="space-y-0">
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className="group relative w-full h-36 sm:h-44 rounded-3xl overflow-hidden cursor-zoom-in shadow-sm"
          >
            <img
              src={encodeURI(HEADER_IMAGE)}
              alt="Đăng ký đi công tác"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#08221a]/80 via-[#08221a]/50 to-[#08221a]/85" />
            <div className="relative h-full flex flex-col items-center justify-center gap-1">
              <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                Đăng ký đi công tác
              </h1>
              <span className="text-[11px] text-white/60 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                Click để xem ảnh lớn
              </span>
            </div>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-200 max-w-xs mx-auto sm:mx-0">
          <button
            onClick={() => setTab("input")}
            className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors ${
              tab === "input" ? "border-[#006838] text-[#006838]" : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            Nhập liệu
          </button>
          <button
            onClick={() => setTab("view")}
            className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors ${
              tab === "view" ? "border-[#006838] text-[#006838]" : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            Xem dữ liệu
          </button>
        </div>

        {tab === "input" ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                ⚠️ {error}
              </div>
            )}
            {success && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                ✅ {success}
              </div>
            )}

            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-7 space-y-4">
              <h2 className="text-sm font-extrabold text-slate-900">Thông tin đề xuất công tác</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Field label="Đơn vị xuất" required>
                  <input
                    required
                    value={form.donViXuat}
                    onChange={(e) => setField("donViXuat", e.target.value)}
                    placeholder="Nhập tên đề xuất công tác"
                    className="input"
                  />
                </Field>

                <Field label="Khu vực" required>
                  <select required value={form.khuVucId} onChange={(e) => setField("khuVucId", e.target.value)} className="input">
                    <option value="">-- Chọn Khu vực --</option>
                    {zones.options.map((o) => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Nhà Máy" required>
                  <select required value={form.nhaMayId} onChange={(e) => setField("nhaMayId", e.target.value)} className="input">
                    <option value="">-- Chọn Nhà Máy --</option>
                    {factories.options.map((o) => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Người tạo" required>
                  <input
                    required
                    value={form.nguoiTao}
                    onChange={(e) => setField("nguoiTao", e.target.value)}
                    className="input"
                  />
                </Field>

                <Field label="Bộ phận" required>
                  <select required value={form.boPhanId} onChange={(e) => setField("boPhanId", e.target.value)} className="input">
                    <option value="">-- Chọn bộ phận --</option>
                    {boPhanList.options.map((o) => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Công tác tại" required>
                  <select required value={form.congTacTaiId} onChange={(e) => setField("congTacTaiId", e.target.value)} className="input">
                    <option value="">-- Chọn địa điểm --</option>
                    {workLocations.options.map((o) => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Hình thức đi công tác" required>
                  <select required value={form.hinhThucId} onChange={(e) => setField("hinhThucId", e.target.value)} className="input">
                    <option value="">-- Chọn hình thức --</option>
                    {travelMethods.options.map((o) => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Ngày bắt đầu" required>
                  <input
                    required
                    type="date"
                    value={form.ngayBatDau}
                    onChange={(e) => setField("ngayBatDau", e.target.value)}
                    className="input"
                  />
                </Field>

                <Field label="Số ngày">
                  <input
                    type="number"
                    min={1}
                    value={form.soNgay}
                    onChange={(e) => setField("soNgay", Number(e.target.value) || 1)}
                    className="input"
                  />
                </Field>

                <Field label="Ngày kết thúc">
                  <input
                    type="date"
                    value={form.ngayKetThuc}
                    onChange={(e) => setField("ngayKetThuc", e.target.value)}
                    className="input"
                  />
                </Field>

                <Field label="Địa chỉ công tác" className="lg:col-span-1">
                  <select value={form.diaChiCongTacId} onChange={(e) => setField("diaChiCongTacId", e.target.value)} className="input">
                    <option value="">-- Chọn địa chỉ (nếu có) --</option>
                    {workAddresses.options.map((o) => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Mục đích công tác" required>
                  <textarea
                    required
                    rows={3}
                    value={form.mucDich}
                    onChange={(e) => setField("mucDich", e.target.value)}
                    placeholder="Nhập mục đích công tác"
                    className="input resize-none"
                  />
                </Field>
                <Field label="Ghi chú">
                  <textarea
                    rows={3}
                    value={form.ghiChu}
                    onChange={(e) => setField("ghiChu", e.target.value)}
                    placeholder="Nhập ghi chú (nếu có)"
                    className="input resize-none"
                  />
                </Field>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-7 space-y-4">
              <h2 className="text-sm font-extrabold text-slate-900">Danh sách người tham gia</h2>

              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse min-w-[720px]">
                  <thead>
                    <tr className="bg-[#08221a] text-white">
                      {["Họ tên *", "Chức vụ *", "MSNV *", "Bộ phận *", "Điện thoại *", "Địa điểm đón *", ""].map((h) => (
                        <th key={h} className="p-2.5 text-left font-semibold first:rounded-l-xl last:rounded-r-xl">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m, idx) => (
                      <tr key={idx} className="border-b border-slate-100">
                        {(["hoTen", "chucVu", "msnv", "boPhan", "dienThoai", "diaDiemDon"] as (keyof Member)[]).map((key) => (
                          <td key={key} className="p-1.5">
                            <input
                              value={m[key]}
                              onChange={(e) => updateMember(idx, key, e.target.value)}
                              placeholder={{ hoTen: "Họ tên", chucVu: "Chức vụ", msnv: "MSNV", boPhan: "Bộ phận", dienThoai: "Điện thoại", diaDiemDon: "Địa điểm đón" }[key]}
                              className="w-full px-2.5 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-[#006838] text-xs"
                            />
                          </td>
                        ))}
                        <td className="p-1.5 text-center">
                          <button
                            type="button"
                            onClick={() => setMembers((rows) => rows.filter((_, i) => i !== idx))}
                            className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                          >
                            <IconTrash size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                onClick={() => setMembers((rows) => [...rows, { ...emptyMember }])}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors"
              >
                <IconPlus size={14} /> Thêm thành viên
              </button>
            </div>

            <div className="text-center">
              <button
                type="submit"
                disabled={submitting}
                className="px-10 py-3.5 rounded-2xl bg-[#006838] text-white font-extrabold text-sm uppercase tracking-wide hover:bg-[#08522d] disabled:opacity-50 shadow-lg transition-colors inline-flex items-center gap-2"
              >
                {submitting && <IconLoader2 size={16} className="animate-spin" />}
                Gửi đề xuất
              </button>
            </div>
          </form>
        ) : (
          <TripListView />
        )}
      </main>
      <Footer />

      <Lightbox src={lightboxOpen ? HEADER_IMAGE : null} alt="Đăng ký đi công tác" onClose={() => setLightboxOpen(false)} />

      <style jsx global>{`
        .input {
          width: 100%;
          padding: 0.625rem 0.875rem;
          border-radius: 0.75rem;
          border: 1px solid #e2e8f0;
          font-size: 0.75rem;
          font-weight: 600;
          color: #1e293b;
          background: #f8fafc;
        }
        .input:focus {
          outline: none;
          border-color: #006838;
          background: white;
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  required,
  children,
  className = "",
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="text-xs font-bold text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

interface TripRow {
  id: number;
  don_vi_xuat: string;
  nguoi_tao: string;
  ngay_bat_dau: string;
  ngay_ket_thuc: string | null;
  muc_dich: string;
  status: string;
  created_at: string;
}

function TripListView() {
  const [items, setItems] = useState<TripRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/business-trips")
      .then((res) => res.json())
      .then((data) => setItems(data.items || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16 text-slate-400">
        <IconLoader2 size={22} className="animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return <div className="text-center py-16 text-slate-400 text-sm">Chưa có đơn đăng ký nào.</div>;
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-[#eef7f2] text-slate-600 uppercase font-semibold">
            <th className="p-3.5 text-left">Đơn vị xuất</th>
            <th className="p-3.5 text-left">Người tạo</th>
            <th className="p-3.5 text-left">Thời gian</th>
            <th className="p-3.5 text-left">Mục đích</th>
            <th className="p-3.5 text-left">Trạng thái</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((t) => {
            const status = STATUS_LABEL[t.status] || STATUS_LABEL.PENDING;
            const StatusIcon = status.icon;
            return (
              <tr key={t.id} className="hover:bg-slate-50/70">
                <td className="p-3.5 font-bold text-slate-900">{t.don_vi_xuat}</td>
                <td className="p-3.5 text-slate-600">{t.nguoi_tao}</td>
                <td className="p-3.5 text-slate-600">
                  {t.ngay_bat_dau} {t.ngay_ket_thuc ? `→ ${t.ngay_ket_thuc}` : ""}
                </td>
                <td className="p-3.5 text-slate-600 max-w-xs truncate">{t.muc_dich}</td>
                <td className="p-3.5">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold ${status.className}`}>
                    <StatusIcon size={12} /> {status.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
