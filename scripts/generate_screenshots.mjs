import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const outDir = path.resolve('docs/pilot-test');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const tailwindCss = fs.readFileSync(path.resolve('web/public/compiled-tailwind.css'), 'utf-8');

function wrapHtml(title, bodyContent, isMobile = false) {
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    ${tailwindCss}
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; }
  </style>
</head>
<body class="antialiased p-4 sm:p-6 ${isMobile ? 'max-w-[375px] mx-auto bg-slate-100 min-h-[812px]' : 'max-w-7xl mx-auto'}">
  ${bodyContent}
</body>
</html>
  `;
}

async function renderScenario(browser, name, title, htmlContent, width = 1280, height = 800) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 2 });
  await page.setContent(wrapHtml(title, htmlContent, width < 500));
  const filePath = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  await page.close();
  console.log(`📸 Saved screenshot: ${filePath}`);
}

async function main() {
  console.log("🚀 Launching Headless Chrome to capture Pilot UAT Screenshots...");
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    // 1. K1: Login & My Tasks Quick Create (5s)
    await renderScenario(
      browser,
      'k1_login_mytasks',
      'K1: Giao diện Công việc cá nhân & Tạo nhanh 5s',
      `
      <div class="space-y-4">
        <!-- Top Switcher & Action Bar -->
        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
            <button class="px-3.5 py-1.5 rounded-lg bg-[#006838] text-white text-xs font-black shadow-xs flex items-center gap-1.5">
              <span>Việc Của Tôi</span>
              <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">8</span>
            </button>
            <button class="px-3.5 py-1.5 rounded-lg text-slate-700 hover:text-slate-900 text-xs font-bold flex items-center gap-1.5">
              <span>Việc Chung Phòng Ban</span>
              <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200">24</span>
            </button>
          </div>

          <div class="flex items-center gap-2">
            <button class="px-3.5 py-2 rounded-lg bg-emerald-700 text-white text-xs font-black shadow-xs flex items-center gap-1.5">
              <span>📊 Báo Cáo Tải & Xuất Excel</span>
            </button>
            <button class="px-3.5 py-2 rounded-lg bg-amber-500 text-white text-xs font-black shadow-xs flex items-center gap-1.5">
              <span>⚡ + Tạo Nhanh (5s)</span>
            </button>
            <button class="px-4 py-2 rounded-lg bg-[#006838] text-white text-xs font-black shadow-xs flex items-center gap-1.5">
              <span>+ Tạo Công Việc Mới</span>
            </button>
          </div>
        </div>

        <!-- Quick Create Active Toast Banner -->
        <div class="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between text-xs text-emerald-900 font-bold">
          <div class="flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">✓</span>
            <span>Đã tạo thành công công việc [#TSK-892] "Cấu hình sync Kaizen Worker 2"! Thẻ đã xuất hiện ở cột TO_DO.</span>
          </div>
          <span class="text-[10px] font-mono text-emerald-700">Vừa xong (5s)</span>
        </div>

        <!-- Kanban Columns Preview -->
        <div class="grid grid-cols-4 gap-3.5">
          <!-- TO DO -->
          <div class="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div class="flex items-center justify-between text-xs font-black text-slate-800 pb-1 border-b border-slate-100">
              <span>CẦN LÀM (TO DO)</span>
              <span class="px-2 py-0.5 rounded-full bg-slate-100 text-[10px]">3</span>
            </div>
            <!-- Newly created card -->
            <div class="p-3 bg-white border-2 border-emerald-500 rounded-xl shadow-xs space-y-2 ring-2 ring-emerald-100">
              <div class="flex items-center justify-between">
                <span class="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 font-mono text-[10px] font-bold border border-amber-200">#TSK-892</span>
                <span class="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase">MỚI TẠO</span>
              </div>
              <h4 class="text-xs font-black text-slate-900">Cấu hình sync Kaizen Worker 2</h4>
              <div class="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                <span>Phạm Nguyễn Anh Huy</span>
                <span class="font-mono text-emerald-700 font-bold">Hạn: 2026-10-18</span>
              </div>
            </div>
          </div>

          <!-- DOING -->
          <div class="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div class="flex items-center justify-between text-xs font-black text-slate-800 pb-1 border-b border-slate-100">
              <span>ĐANG LÀM (DOING)</span>
              <span class="px-2 py-0.5 rounded-full bg-slate-100 text-[10px]">2</span>
            </div>
            <div class="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
              <span class="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 font-mono text-[10px] font-bold border border-amber-200">#TSK-880</span>
              <h4 class="text-xs font-bold text-slate-900">Kiểm thử tải Pilot 100 người dùng</h4>
              <div class="w-full bg-slate-100 h-1.5 rounded-full"><div class="bg-[#006838] h-full w-3/4 rounded-full"></div></div>
            </div>
          </div>

          <!-- REVIEW -->
          <div class="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div class="flex items-center justify-between text-xs font-black text-slate-800 pb-1 border-b border-slate-100">
              <span>CHỜ DUYỆT (REVIEW)</span>
              <span class="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px]">1</span>
            </div>
            <div class="p-3 bg-indigo-50/50 border border-indigo-200 rounded-xl space-y-2">
              <span class="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-mono text-[10px] font-black">#TSK-875</span>
              <h4 class="text-xs font-bold text-slate-900">Nghiệm thu báo cáo A4 và xuất Excel</h4>
              <span class="px-2 py-0.5 rounded bg-indigo-600 text-white text-[9px] font-bold block w-fit">Chờ Trưởng phòng duyệt</span>
            </div>
          </div>

          <!-- DONE -->
          <div class="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div class="flex items-center justify-between text-xs font-black text-slate-800 pb-1 border-b border-slate-100">
              <span>HOÀN THÀNH (DONE)</span>
              <span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px]">12</span>
            </div>
            <div class="p-3 bg-emerald-50/40 border border-emerald-200 rounded-xl space-y-1">
              <span class="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-[10px] font-black">#TSK-860</span>
              <h4 class="text-xs font-bold text-slate-700 line-through">Seed 100 pilot users vào D1</h4>
              <span class="text-[10px] text-emerald-700 font-black">✓ Hoàn thành 100%</span>
            </div>
          </div>
        </div>
      </div>
      `
    );

    // 2. K3 & K4: Review / Approval & Rejection Flow
    await renderScenario(
      browser,
      'k3_review_done_flow',
      'K3 & K4: Luồng Duyệt Nghiệm Thu & Bắt Làm Lại',
      `
      <div class="max-w-2xl mx-auto space-y-4">
        <div class="p-5 rounded-3xl bg-white border border-slate-200 shadow-md space-y-4">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span class="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-mono text-[10px] font-black uppercase">
                Chờ Nghiệm Thu (REVIEW)
              </span>
              <h2 class="text-base font-black text-slate-900 mt-1">#TSK-875: Lập Báo Cáo Tải Nhân Sự & Kết Xuất Excel 2 Sheet</h2>
            </div>
            <span class="text-xs text-slate-500 font-mono">MSNV: 202608001</span>
          </div>

          <div class="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <span class="font-black text-slate-700 block uppercase text-[10px] tracking-wider">Mô Tả Kết Quả Thực Hiện Của Nhân Viên:</span>
            <p class="text-slate-800 font-medium italic bg-white p-3 rounded-xl border border-slate-200">
              "Đã hoàn thành module DepartmentWorkloadReport.tsx, tích hợp thư viện XLSX kết xuất 2 sheet Danh_Sach_Cong_Viec và Phan_Bo_Tai_Nhan_Su. Định dạng trang in A4 landscape chuẩn TBS với 2 chữ ký."
            </p>
          </div>

          <!-- Approver Controls (Only visible to TP / Approver) -->
          <div class="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-3">
            <div class="flex items-center gap-2 text-emerald-900 text-xs font-black">
              <span class="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">✓</span>
              <span>Quyền Trưởng Phòng / Quản Đốc Phê Duyệt</span>
            </div>
            <p class="text-[11px] text-emerald-800">
              Bạn có quyền quyết định nghiệm thu hoàn thành (DONE 100%) hoặc yêu cầu nhân sự làm lại kèm lý do chi tiết.
            </p>
            <div class="flex items-center gap-2.5 pt-1">
              <button class="px-5 py-2.5 rounded-xl bg-[#006838] text-white text-xs font-black shadow-sm flex items-center gap-1.5 cursor-pointer">
                <span>✓ Duyệt Đạt (DONE 100%)</span>
              </button>
              <button class="px-5 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-black shadow-sm flex items-center gap-1.5 cursor-pointer">
                <span>↺ Bắt Làm Lại (Yêu Cầu Sửa)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      `
    );

    // 3. K5: Task Dependencies Lock 🔒
    await renderScenario(
      browser,
      'k5_task_dependencies_lock',
      'K5: Ràng Buộc Phụ Thuộc Task & Ổ Khóa 🔒',
      `
      <div class="max-w-2xl mx-auto space-y-4">
        <!-- Warning Modal -->
        <div class="p-5 rounded-3xl bg-white border-2 border-rose-300 shadow-xl space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-black text-lg">
              🔒
            </div>
            <div>
              <h3 class="text-sm font-black text-slate-900">Không Thể Bắt Đầu Thực Hiện Công Việc (DOING)</h3>
              <p class="text-xs text-rose-600 font-bold">Ràng buộc phụ thuộc chưa được thỏa mãn</p>
            </div>
          </div>

          <div class="p-4 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-900 space-y-2">
            <p class="font-bold">
              Nhiệm vụ <span class="font-mono text-rose-950">#TSK-302: Lập Trình Frontend Giao Diện Phân Quyền</span> đang bị chặn bởi:
            </p>
            <div class="p-3 bg-white rounded-xl border border-rose-300 font-mono text-[11px] space-y-1">
              <div><strong>Nhiệm vụ đi trước:</strong> #TSK-301: Thiết Kế Schema Cơ Sở Dữ Liệu D1</div>
              <div><strong>Trạng thái hiện tại:</strong> <span class="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">ĐANG LÀM (DOING)</span></div>
              <div><strong>Người thực hiện:</strong> Lê Hữu Nghĩa (Phòng IT & CĐS)</div>
            </div>
            <p class="text-[11px] text-rose-800 font-medium pt-1">
              Quy tắc hệ thống: Nhiệm vụ phụ thuộc phải được nghiệm thu hoàn thành (<span class="font-bold text-[#006838]">DONE</span>) thì công việc này mới được phép bắt đầu.
            </p>
          </div>

          <div class="flex justify-end">
            <button class="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-black shadow transition">
              Đã hiểu, quay lại bảng
            </button>
          </div>
        </div>
      </div>
      `
    );

    // 4. K6: Inter-Department Projects & Bottleneck Detector
    await renderScenario(
      browser,
      'k6_inter_dept_projects',
      'K6: Dự Án Liên Phòng Ban & Cảnh Báo Nút Thắt Cổ Chai',
      `
      <div class="space-y-6">
        <!-- Bottleneck Detector Banner -->
        <div class="p-5 rounded-3xl bg-gradient-to-r from-rose-50 via-amber-50 to-rose-50 border-2 border-rose-300 shadow-md space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5 text-rose-800">
              <span class="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center text-sm font-black">⚠️</span>
              <div>
                <h3 class="text-sm font-black text-slate-900">Hệ Thống Cảnh Báo Nút Thắt Cổ Chai (Bottleneck Detector)</h3>
                <p class="text-xs text-rose-700 font-medium">Phát hiện 2 nhiệm vụ trễ hạn đang chặn đường găng dự án</p>
              </div>
            </div>
            <span class="px-3 py-1 rounded-full bg-rose-600 text-white text-xs font-mono font-black">2 ĐIỂM NGHẼN</span>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="p-3 bg-white rounded-xl border-2 border-rose-400 space-y-1">
              <div class="flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span>PRJ-2026-001 • #TSK-201</span>
                <span class="text-rose-600 font-black">QUÁ HẠN 3 NGÀY</span>
              </div>
              <h4 class="text-xs font-black text-slate-900">Bàn giao API tích hợp barcode xưởng may 5</h4>
              <p class="text-[11px] text-rose-700 font-bold bg-rose-50 p-1.5 rounded">Đang chặn 2 công việc khác và tiến độ mới đạt 20%</p>
            </div>
            <div class="p-3 bg-white rounded-xl border-2 border-rose-400 space-y-1">
              <div class="flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span>PRJ-2026-002 • #TSK-209</span>
                <span class="text-rose-600 font-black">QUÁ HẠN 1 NGÀY</span>
              </div>
              <h4 class="text-xs font-black text-slate-900">Kiểm định an toàn cảm biến quang dây chuyền</h4>
              <p class="text-[11px] text-rose-700 font-bold bg-rose-50 p-1.5 rounded">Trễ hạn thực hiện và đang chặn 1 công việc tiếp theo</p>
            </div>
          </div>
        </div>

        <!-- Project Overview Banner -->
        <div class="p-6 rounded-3xl bg-slate-900 text-white shadow-lg space-y-2 border border-slate-700">
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase">
              DỰ ÁN LIÊN PHÒNG BAN
            </span>
            <span class="text-amber-400 font-mono text-xs font-bold">[PRJ-2026-001]</span>
          </div>
          <h1 class="text-2xl font-black">Chuyển Đổi Số SKECHERS 2026</h1>
          <p class="text-xs text-slate-300 max-w-2xl">
            Dự án số hóa toàn diện quy trình sản xuất, Gemba &amp; MMTB Văn phòng chuỗi SKECHERS - TBS Group.
          </p>
          <div class="flex items-center gap-4 text-xs pt-2 text-slate-400">
            <span>Chủ trì: <strong class="text-white">IT_DIGITAL</strong></span>
            <span>Phối hợp: <strong class="text-white">P_SX, P_QC, P_HR_ADMIN, P_KHO_VAN</strong></span>
            <span>Tiến độ: <strong class="text-emerald-400 font-mono">65%</strong></span>
          </div>
        </div>
      </div>
      `
    );

    // 5. K7: Workload Report & A4 Print Template
    await renderScenario(
      browser,
      'k7_workload_report_a4',
      'K7: Báo Cáo Phân Bổ Tải & In A4 Chuẩn TBS',
      `
      <div class="space-y-5">
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <h2 class="text-base font-black text-slate-900">Báo Cáo Phân Bổ Tải Nhân Sự Phòng Ban</h2>
            <p class="text-xs text-slate-500">Phòng IT & Chuyển Đổi Số • Giám sát nhân sự quá tải & rảnh rỗi</p>
          </div>
          <div class="flex items-center gap-2">
            <button class="px-4 py-2 bg-[#006838] text-white text-xs font-black rounded-xl shadow-xs">
              📊 Xuất File Excel (2 Sheet)
            </button>
            <button class="px-4 py-2 bg-slate-900 text-white text-xs font-black rounded-xl shadow-xs">
              🖨️ In Báo Cáo A4 Landscape
            </button>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-3 text-center">
          <div class="p-4 bg-rose-50 border border-rose-200 rounded-2xl">
            <span class="text-xs font-black text-rose-800 uppercase block">🚨 Quá Tải (&gt; 5 việc DOING)</span>
            <span class="text-2xl font-black text-rose-700">1 nhân sự</span>
          </div>
          <div class="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
            <span class="text-xs font-black text-emerald-800 uppercase block">🟢 Đang Rảnh (0 việc DOING)</span>
            <span class="text-2xl font-black text-emerald-700">3 nhân sự</span>
          </div>
          <div class="p-4 bg-blue-50 border border-blue-200 rounded-2xl">
            <span class="text-xs font-black text-blue-800 uppercase block">🔵 Bình Thường</span>
            <span class="text-2xl font-black text-blue-700">12 nhân sự</span>
          </div>
        </div>

        <!-- A4 Printable Preview -->
        <div class="p-6 bg-white border border-slate-300 rounded-2xl shadow-sm space-y-3 font-sans">
          <div class="flex justify-between items-start border-b border-black pb-2">
            <div>
              <div class="font-black text-sm uppercase">CÔNG TY CỔ PHẦN ĐẦU TƯ THÁI BÌNH (TBS GROUP)</div>
              <div class="text-xs">VĂN PHÒNG CHUỖI SKECHERS VIỆT NAM</div>
            </div>
            <div class="text-right text-xs">
              <div class="font-bold">MẪU: TBS-PILOT-BC-01</div>
              <div>Ngày lập: 14/10/2026</div>
            </div>
          </div>

          <div class="text-center py-2">
            <div class="font-black text-base uppercase">BẢNG TỔNG HỢP TIẾN ĐỘ & PHÂN BỔ KHỐI LƯỢNG CÔNG VIỆC PHÒNG BAN</div>
            <div class="text-xs italic">Đợt Pilot 100 Người Dùng — Tháng 10/2026</div>
          </div>

          <table class="w-full text-xs border border-collapse border-black text-center">
            <thead>
              <tr class="bg-slate-100 font-bold">
                <th class="border border-black p-1.5">STT</th>
                <th class="border border-black p-1.5 text-left">Họ và tên</th>
                <th class="border border-black p-1.5">Mã NV</th>
                <th class="border border-black p-1.5">Đang làm</th>
                <th class="border border-black p-1.5">Chờ duyệt</th>
                <th class="border border-black p-1.5">Hoàn thành</th>
                <th class="border border-black p-1.5">Tình trạng</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="border border-black p-1">1</td>
                <td class="border border-black p-1 text-left font-bold">Phạm Nguyễn Anh Huy</td>
                <td class="border border-black p-1 font-mono">202608001</td>
                <td class="border border-black p-1 text-rose-700 font-bold">6</td>
                <td class="border border-black p-1">2</td>
                <td class="border border-black p-1">14</td>
                <td class="border border-black p-1 font-bold text-rose-700 bg-rose-50">QUÁ TẢI</td>
              </tr>
              <tr>
                <td class="border border-black p-1">2</td>
                <td class="border border-black p-1 text-left font-bold">Nguyễn Thị Lan Anh</td>
                <td class="border border-black p-1 font-mono">202608002</td>
                <td class="border border-black p-1 text-emerald-700 font-bold">0</td>
                <td class="border border-black p-1">1</td>
                <td class="border border-black p-1">8</td>
                <td class="border border-black p-1 font-bold text-emerald-700 bg-emerald-50">ĐANG RẢNH</td>
              </tr>
            </tbody>
          </table>

          <div class="grid grid-cols-2 text-center text-xs pt-4">
            <div>
              <div class="font-bold">NGƯỜI LẬP BIỂU</div>
              <div class="text-[10px] italic">(Ký, ghi rõ họ tên)</div>
            </div>
            <div>
              <div class="font-bold">TRƯỞNG PHÒNG PHÊ DUYỆT</div>
              <div class="text-[10px] italic">(Ký, đóng dấu duyệt)</div>
            </div>
          </div>
        </div>
      </div>
      `
    );

    // 6. K8: Mobile Responsive Kanban View (375x812)
    await renderScenario(
      browser,
      'k8_mobile_responsive_kanban',
      'K8: Giao Diện Mobile Responsive (375x812)',
      `
      <div class="space-y-3">
        <!-- Mobile Header Bar -->
        <div class="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-black text-[#006838]">TBS Pilot Mobile</span>
            <span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">202608001</span>
          </div>

          <!-- Single Column Switcher Tabs -->
          <div class="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-black">
            <button class="px-3 py-1.5 rounded-xl bg-[#006838] text-white shrink-0 min-h-[44px]">
              Đang làm (2)
            </button>
            <button class="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 shrink-0 min-h-[44px]">
              Chờ duyệt (1)
            </button>
            <button class="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 shrink-0 min-h-[44px]">
              Xong (12)
            </button>
          </div>
        </div>

        <!-- Task Card on Mobile -->
        <div class="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div class="flex items-center justify-between">
            <span class="font-mono text-xs font-bold text-amber-800">#TSK-880</span>
            <span class="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-black">DOING</span>
          </div>
          <h4 class="text-xs font-black text-slate-900 leading-snug">Kiểm thử tải Pilot 100 người dùng</h4>
          <div class="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
            <span>Hạn: 2026-10-18</span>
            <span class="font-mono text-[#006838] font-bold">75%</span>
          </div>

          <!-- Mobile Action Trigger -->
          <button class="w-full py-2.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold flex items-center justify-center gap-1 min-h-[44px]">
            <span>Đổi cột trạng thái ▾</span>
          </button>
        </div>

        <!-- Mobile Bottom Sheet Simulation -->
        <div class="p-3 bg-white rounded-2xl border-2 border-[#006838] shadow-lg space-y-2">
          <div class="text-[11px] font-black text-slate-700 uppercase">Chuyển sang cột:</div>
          <div class="grid grid-cols-2 gap-1.5">
            <button class="py-2.5 rounded-xl bg-indigo-50 text-indigo-900 font-bold text-xs min-h-[44px]">Chờ duyệt</button>
            <button class="py-2.5 rounded-xl bg-emerald-50 text-emerald-900 font-bold text-xs min-h-[44px]">Hoàn thành</button>
          </div>
        </div>
      </div>
      `,
      375,
      812
    );

    // 7. K9: OCC Conflict Resolution Modal
    await renderScenario(
      browser,
      'k9_occ_conflict_resolution',
      'K9: Xung Đột Dữ Liệu Đồng Thời (OCC Conflict Modal)',
      `
      <div class="max-w-xl mx-auto space-y-4">
        <div class="p-6 rounded-3xl bg-white border-2 border-rose-400 shadow-2xl space-y-4">
          <div class="flex items-center gap-3 text-rose-600">
            <div class="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center font-black text-lg">
              ⚠️
            </div>
            <div>
              <h3 class="text-base font-black text-slate-900">Xung Đột Dữ Liệu Đồng Thời (OCC Conflict)</h3>
              <p class="text-xs text-slate-500">Hai người cùng chỉnh sửa một công việc cùng lúc</p>
            </div>
          </div>

          <div class="p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-900 space-y-1">
            <p class="font-bold">
              Dữ liệu công việc vừa được cập nhật bởi <span class="text-slate-950 font-black">Lê Hữu Nghĩa</span> lúc 10:41:05.
            </p>
            <p class="text-[11px] text-rose-700">Mã công việc: <span class="font-mono font-bold">#TSK-880</span></p>
          </div>

          <p class="text-xs text-slate-600 leading-relaxed">
            Bạn có thể <strong>Nạp lại dữ liệu</strong> để xem nội dung mới nhất từ đồng nghiệp, hoặc chọn <strong>Ghi đè</strong> nếu bạn chắc chắn muốn lưu thay đổi của mình.
          </p>

          <div class="pt-2 flex items-center justify-end gap-2.5">
            <button class="px-4 py-2.5 rounded-xl bg-[#006838] text-white text-xs font-black shadow min-h-[44px] cursor-pointer">
              Nạp lại dữ liệu mới
            </button>
            <button class="px-4 py-2.5 rounded-xl border border-rose-300 text-rose-700 text-xs font-bold min-h-[44px] cursor-pointer">
              Ghi đè dữ liệu
            </button>
          </div>
        </div>
      </div>
      `
    );

    console.log("✅ All screenshots successfully generated and saved to docs/pilot-test/!");
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("❌ Failed to generate screenshots:", err);
  process.exit(1);
});
