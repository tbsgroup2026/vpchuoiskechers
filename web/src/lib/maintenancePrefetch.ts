// Âm thầm tải trước dữ liệu của MỌI trang trong /maintenance (không riêng trang đang mở) ngay khi
// vào khu vực này (xem MaintenanceShell) — để khi người dùng bấm qua 1 tab khác, kể cả lần ĐẦU
// TIÊN ghé tab đó trong phiên trình duyệt này, trang đã có sẵn dữ liệu trong cache ngay lập tức
// thay vì hiện "đang tải"/trống trang. CHỈ tải phần cache nào còn thiếu (readMaintenanceCache ===
// null) — trang nào đã có cache thì việc làm mới dữ liệu do chính trang đó tự lo (tải lại nền khi
// mount / nút Làm Mới), tránh gọi API trùng lặp không cần thiết mỗi lần chuyển trang.
//
// Mỗi khu vực (Văn phòng Chuỗi/Nhà Máy Miền Đông/Tổ Hợp Kiên Giang) có dữ liệu MMTB RIÊNG — mọi
// cache key và URL gọi API ở đây đều phải kèm scope (xem lib/equipmentScope.ts), khớp đúng cách
// từng trang con tự làm, tránh prefetch nhầm cache của khu vực này sang khu vực khác.
import { readMaintenanceCache, writeMaintenanceCache } from './maintenanceCache';
import { EquipmentScope } from './equipmentScope';

const prefetchedScopes = new Set<EquipmentScope>();

// Gộp các lượt gọi trùng URL trong CÙNG 1 lượt prefetch (VD /api/maintenance/machines cần cho cả
// cache 'machines' lẫn 'overview_machines') thành đúng 1 request thật.
const inflight = new Map<string, Promise<any>>();

// Chạy tối đa `limit` việc cùng lúc (thay vì bắn hết ~20+ request 1 lượt) — tránh dội quá nhiều
// request cùng lúc vào backend Kiên Giang thật (đã gây lỗi 500 do quá tải/đụng session đăng nhập
// ngày 2026-09-24). Mỗi "worker" tự rút việc tiếp theo từ hàng đợi cho tới khi hết.
async function runPool(fns: Array<() => Promise<void>>, limit: number): Promise<void> {
  let next = 0;
  const worker = async () => {
    while (next < fns.length) {
      const fn = fns[next++];
      try {
        await fn();
      } catch {
        // đã tự bắt lỗi ở từng task (catch(() => ({success:false})) trong getJson) — chặn ở đây
        // chỉ để 1 task lỗi bất ngờ không làm dừng cả pool.
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, fns.length) }, worker));
}

function getJson(url: string): Promise<any> {
  let p = inflight.get(url);
  if (!p) {
    p = fetch(url)
      .then((r) => r.json())
      .catch(() => ({ success: false }));
    inflight.set(url, p);
  }
  return p;
}

function categoryData(type: string, scope: EquipmentScope): Promise<any[]> {
  return getJson(`/api/maintenance/categories?type=${type}&scope=${scope}`).then((r) =>
    r.success && Array.isArray(r.data) ? r.data : []
  );
}

function mmtbKgCategoryData(type: string, scope: EquipmentScope): Promise<any[]> {
  return getJson(`/api/mmtb-kg/categories?type=${type}&scope=${scope}`).then((r) =>
    r.success && Array.isArray(r.data) ? r.data : []
  );
}

// Khớp đúng logic fetchTypes của CategoriesManager.tsx — mỗi trang Danh Mục chỉ cần 1 tổ hợp
// tabKeys cố định, xem app/maintenance/categories/*/page.tsx.
const CATEGORY_TAB_COMBOS: string[][] = [
  ['MAINTENANCE_PERIOD'],
  ['AREA', 'PRODUCTION_LINE', 'TEAM'],
  ['PART'],
  ['MACHINE_TYPE'],
  ['MACHINE_STATUS'],
];

function categoryFetchTypes(tabKeys: string[]): string[] {
  const set = new Set<string>(['FACTORY', ...tabKeys]);
  if (tabKeys.includes('PRODUCTION_LINE') || tabKeys.includes('TEAM')) set.add('AREA');
  if (tabKeys.includes('TEAM')) set.add('PRODUCTION_LINE');
  return Array.from(set);
}

// Tính KPI gọn (MTTA/MTTR/MTTD/Số Sự Cố/Downtime) từ danh sách sự cố thô — khớp đúng
// computeScopeKpi trong app/maintenance/page.tsx (không import chéo được vì đó là 'use client'
// page, nên lặp lại công thức thuần này ở đây).
function minutesBetween(a: string, b: string): number {
  return (new Date(b).getTime() - new Date(a).getTime()) / 60000;
}
function computeScopeKpi(rawIncidents: { acceptedAt: string | null; completedAt: string | null; createdAt: string }[]) {
  const enriched = rawIncidents.map((i) => ({
    mtta: i.acceptedAt ? minutesBetween(i.createdAt, i.acceptedAt) : null,
    mttr: i.acceptedAt && i.completedAt ? minutesBetween(i.acceptedAt, i.completedAt) : null,
    mttd: i.completedAt ? minutesBetween(i.createdAt, i.completedAt) : null,
  }));
  const mttaVals = enriched.filter((i) => i.mtta != null).map((i) => i.mtta as number);
  const mttrVals = enriched.filter((i) => i.mttr != null).map((i) => i.mttr as number);
  const mttdVals = enriched.filter((i) => i.mttd != null).map((i) => i.mttd as number);
  const avg = (arr: number[]) => (arr.length ? arr.reduce((s, n) => s + n, 0) / arr.length : 0);
  return {
    mtta: avg(mttaVals),
    mttr: avg(mttrVals),
    mttd: avg(mttdVals),
    count: rawIncidents.length,
    downtime: mttdVals.reduce((s, n) => s + n, 0),
  };
}

// scope: khu vực NGƯỜI DÙNG đang xem (từ MaintenanceShell) — chỉ pre-warm cache của các trang
// CÙNG khu vực này (không tải trước cả 3 khu vực, tránh gọi API thừa cho khu vực người dùng chưa
// hề ghé). Riêng bảng "So Sánh Giữa Các Nhà Máy" ở trang Tổng Quan luôn cần cả 3 khu vực nên được
// pre-warm không điều kiện theo scope hiện tại.
export function prefetchMaintenanceData(scope: EquipmentScope): void {
  if (prefetchedScopes.has(scope) || typeof window === 'undefined') return;
  prefetchedScopes.add(scope);

  const need = (key: string) => readMaintenanceCache(key) === null;
  // Mỗi phần tử là 1 HÀM (chưa chạy) — chỉ thực sự gọi fetch khi runPool() rút nó ra khỏi hàng đợi,
  // nhờ vậy giới hạn được số request thật gửi đi cùng lúc (xem runPool ở trên).
  const taskFns: Array<() => Promise<void>> = [];

  // ---- Danh Sách MMTB (machines) ----
  if (need(`machines_${scope}`)) {
    taskFns.push(() =>
      getJson(`/api/maintenance/machines?scope=${scope}`).then((r) => {
        if (r.success && Array.isArray(r.data)) writeMaintenanceCache(`machines_${scope}`, r.data);
      })
    );
  }

  // ---- Bộ lọc trang Danh Sách MMTB ----
  if (need(`machines_filters_${scope}`)) {
    taskFns.push(() =>
      Promise.all([
        categoryData('FACTORY', scope),
        categoryData('AREA', scope),
        categoryData('PRODUCTION_LINE', scope),
        categoryData('TEAM', scope),
        categoryData('MACHINE_TYPE', scope),
        categoryData('MACHINE_STATUS', scope),
      ]).then(([factories, areas, productionLines, teams, machineTypes, statuses]) => {
        writeMaintenanceCache(`machines_filters_${scope}`, { factories, areas, productionLines, teams, machineTypes, statuses });
      })
    );
  }

  // ---- Máy đã kiểm kê (dùng chung giữa trang Danh Sách MMTB và Bảo Dưỡng MMTB) ----
  if (need(`machines_verified_${scope}`)) {
    taskFns.push(() =>
      getJson(`/api/maintenance/inventory-log?scope=${scope}`).then((r) => {
        if (r.success && Array.isArray(r.rows)) {
          const codes = Array.from(new Set<string>(r.rows.map((row: any) => row.machine?.code).filter(Boolean)));
          writeMaintenanceCache(`machines_verified_${scope}`, codes);
        }
      })
    );
  }

  // ---- Bảo Dưỡng MMTB (schedule_*) ----
  if (need(`schedule_machines_${scope}`) || need(`schedule_periods_${scope}`) || need(`schedule_completed_${scope}`)) {
    taskFns.push(() =>
      getJson(`/api/maintenance/schedule?scope=${scope}`).then((r) => {
        if (r.success) {
          writeMaintenanceCache(`schedule_machines_${scope}`, r.machines || []);
          writeMaintenanceCache(`schedule_periods_${scope}`, r.periods || []);
          writeMaintenanceCache(`schedule_completed_${scope}`, r.completedThisMonth || 0);
        }
      })
    );
  }
  if (need(`schedule_logs_${scope}`)) {
    taskFns.push(() =>
      getJson(`/api/maintenance/logs?scope=${scope}`).then((r) => {
        if (r.success) writeMaintenanceCache(`schedule_logs_${scope}`, r.data || []);
      })
    );
  }

  // ---- Nhu Cầu Sửa Chữa (tickets, tickets_counts) ----
  if (need(`tickets_${scope}`) || need(`tickets_counts_${scope}`)) {
    taskFns.push(() =>
      getJson(`/api/maintenance/tickets?scope=${scope}`).then((r) => {
        if (r.success && Array.isArray(r.data)) {
          writeMaintenanceCache(`tickets_${scope}`, r.data);
          writeMaintenanceCache(`tickets_counts_${scope}`, r.counts || null);
        }
      })
    );
  }
  if (need(`tickets_factories_${scope}`)) {
    taskFns.push(() => categoryData('FACTORY', scope).then((factories) => writeMaintenanceCache(`tickets_factories_${scope}`, factories)));
  }
  if (need(`tickets_work_requests_${scope}`)) {
    taskFns.push(() =>
      getJson(`/api/maintenance/work-requests?scope=${scope}`).then((r) => {
        if (r.success) writeMaintenanceCache(`tickets_work_requests_${scope}`, r.data?.items || []);
      })
    );
  }

  // ---- Đề Xuất (proposals) ----
  if (need(`proposals_${scope}`)) {
    taskFns.push(() =>
      getJson(`/api/maintenance/proposals?scope=${scope}`).then((r) => {
        if (r.success && Array.isArray(r.data)) writeMaintenanceCache(`proposals_${scope}`, r.data);
      })
    );
  }
  if (need(`proposals_factories_${scope}`)) {
    taskFns.push(() => categoryData('FACTORY', scope).then((factories) => writeMaintenanceCache(`proposals_factories_${scope}`, factories)));
  }

  // ---- Nhân Sự (employees) ----
  if (need(`employees_${scope}`)) {
    taskFns.push(() =>
      getJson(`/api/maintenance/employees?scope=${scope}`).then((r) => {
        if (r.success && Array.isArray(r.data)) writeMaintenanceCache(`employees_${scope}`, r.data);
      })
    );
  }
  if (need(`employees_factories_${scope}`) || need(`employees_areas_${scope}`)) {
    taskFns.push(() =>
      Promise.all([categoryData('FACTORY', scope), categoryData('AREA', scope)]).then(([factories, areas]) => {
        writeMaintenanceCache(`employees_factories_${scope}`, factories);
        writeMaintenanceCache(`employees_areas_${scope}`, areas);
      })
    );
  }

  // ---- Danh Mục Hư (failure_categories) ----
  if (need(`failure_categories_${scope}`)) {
    taskFns.push(() =>
      getJson(`/api/maintenance/failure-categories?scope=${scope}`).then((r) => {
        if (r.success && Array.isArray(r.data)) writeMaintenanceCache(`failure_categories_${scope}`, r.data);
      })
    );
  }

  // ---- 5 trang Danh Mục (Quản Lý Khu Vực, Bảo Trì, Trạng Thái Máy, Phân Loại Máy, Phụ Tùng) ----
  for (const combo of CATEGORY_TAB_COMBOS) {
    const cacheKey = `categories_${combo.join('_')}_${scope}`;
    if (!need(cacheKey)) continue;
    const types = categoryFetchTypes(combo);
    taskFns.push(() =>
      Promise.all(types.map((t) => mmtbKgCategoryData(t, scope))).then((results) => {
        const next: Record<string, any[]> = {
          FACTORY: [], AREA: [], PRODUCTION_LINE: [], TEAM: [], MACHINE_TYPE: [], PART: [], MAINTENANCE_PERIOD: [], MACHINE_STATUS: [],
        };
        types.forEach((t, i) => { next[t] = results[i]; });
        writeMaintenanceCache(cacheKey, next);
      })
    );
  }

  // ---- Trang Tổng Quan (scope=ALL) — Kiên Giang chi tiết + so sánh 3 khu vực ----
  if (scope === 'ALL') {
    if (need('overview_incidents') || need('overview_logs')) {
      taskFns.push(() =>
        getJson('/api/maintenance/overview-report?scope=KIEN_GIANG').then((r) => {
          if (r.success) {
            writeMaintenanceCache('overview_incidents', r.incidents || []);
            writeMaintenanceCache('overview_logs', r.logs || []);
          }
        })
      );
    }
    if (need('overview_machines')) {
      taskFns.push(() =>
        getJson('/api/maintenance/machines?scope=KIEN_GIANG').then((r) => {
          if (r.success && Array.isArray(r.data)) writeMaintenanceCache('overview_machines', r.data);
        })
      );
    }
    if (need('overview_schedule')) {
      taskFns.push(() =>
        getJson('/api/maintenance/schedule?scope=KIEN_GIANG').then((r) => {
          if (r.success) writeMaintenanceCache('overview_schedule', r.machines || []);
        })
      );
    }
    if (need('overview_proposals')) {
      taskFns.push(() =>
        getJson('/api/maintenance/proposals?scope=KIEN_GIANG').then((r) => {
          if (r.success && Array.isArray(r.data)) writeMaintenanceCache('overview_proposals', r.data);
        })
      );
    }
    if (need('overview_factories') || need('overview_areas') || need('overview_lines')) {
      taskFns.push(() =>
        Promise.all([
          categoryData('FACTORY', 'KIEN_GIANG'),
          categoryData('AREA', 'KIEN_GIANG'),
          categoryData('PRODUCTION_LINE', 'KIEN_GIANG'),
        ]).then(([factories, areas, lines]) => {
          writeMaintenanceCache('overview_factories', factories);
          writeMaintenanceCache('overview_areas', areas);
          writeMaintenanceCache('overview_lines', lines);
        })
      );
    }
    (['OFFICE', 'EAST'] as EquipmentScope[]).forEach((s) => {
      if (!need(`overview_kpi_${s}`)) return;
      taskFns.push(() =>
        getJson(`/api/maintenance/overview-report?scope=${s}`).then((r) => {
          if (r.success) writeMaintenanceCache(`overview_kpi_${s}`, computeScopeKpi(r.incidents || []));
        })
      );
    });
  }

  // Chạy nền tối đa 4 request cùng lúc — không await, không chặn UI trang hiện tại đang hiện (cache
  // của nó, nếu có, đã hiện ngay từ useState initializer rồi).
  runPool(taskFns, 4).catch(() => {});
}
