/**
 * taskMetrics.ts – SINGLE SOURCE OF TRUTH cho tất cả chỉ số công việc.
 *
 * Mọi màn hình (Tổng quan Dự án, Overview Phòng ban, Kanban, trang dự án)
 * phải gọi hàm trong file này. TUYỆT ĐỐI KHÔNG tự tính lại ở UI hay ở
 * bất kỳ API route nào khác.
 *
 * Múi giờ: Asia/Ho_Chi_Minh (UTC+7). Dùng Intl.DateTimeFormat chuẩn, không
 * cần thư viện bên ngoài – tương thích Cloudflare Workers runtime.
 */

/** Lấy chuỗi YYYY-MM-DD theo múi giờ Việt Nam */
function toVNDateString(d: Date): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).format(d);
}

/** Ngày hôm nay theo múi giờ VN */
function todayVN(): string {
  return toVNDateString(new Date());
}

/** Ngày mai theo múi giờ VN */
function tomorrowVN(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return toVNDateString(d);
}

// ──────────────────────────────────────────────────────────────────────────────
// ĐỊNH NGHĨA CHUẨN CHỈ SỐ
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Tập hợp chỉ số KPI chuẩn.
 * - total      : Tổng task hợp lệ (loại CANCELLED)
 * - done       : status = 'DONE'
 * - inProgress : status IN ('DOING', 'REVIEW')
 * - todo       : status = 'TO_DO'
 * - cancelled  : status = 'CANCELLED'
 * - overdue    : có deadline + chưa DONE/CANCELLED + due_date < hôm nay (VN)
 * - dueSoon    : có deadline + chưa DONE/CANCELLED + due_date ∈ [hôm nay, ngày mai] (VN)
 * - progress   : (done / total) * 100, làm tròn. total=0 → 0
 */
export interface TaskMetrics {
  total: number;
  done: number;
  inProgress: number;
  todo: number;
  cancelled: number;
  overdue: number;
  dueSoon: number;
  progress: number; // 0–100
}

/** Kết quả trả về khi tính theo SQL aggregate (server-side) */
export interface RawAggRow {
  status: string;
  due_date: string | null;
  count: number;
}

/**
 * Tính TaskMetrics từ kết quả SQL aggregate.
 *
 * SQL mẫu để lấy `rows`:
 * ```sql
 * SELECT status,
 *        CASE
 *          WHEN due_date IS NULL OR due_date = '' THEN NULL
 *          WHEN due_date LIKE '____-__-__' THEN due_date
 *          ELSE SUBSTR(due_date, 1, 10)
 *        END AS due_date,
 *        COUNT(*) AS count
 * FROM tasks
 * WHERE <điều kiện scope>
 * GROUP BY status, due_date
 * ```
 *
 * Lưu ý:
 * - Không kéo toàn bộ task về JS để tính; tính bằng GROUP BY trên DB.
 * - Hàm này chỉ TỔNG HỢP lại các aggregate row thành struct TaskMetrics.
 */
export function computeMetricsFromAgg(rows: RawAggRow[]): TaskMetrics {
  const today = todayVN();
  const tomorrow = tomorrowVN();

  let total = 0;
  let done = 0;
  let inProgress = 0;
  let todo = 0;
  let cancelled = 0;
  let overdue = 0;
  let dueSoon = 0;

  for (const row of rows) {
    const status = (row.status || 'TO_DO').toUpperCase();
    const count = Number(row.count) || 0;
    const due = row.due_date ? String(row.due_date).substring(0, 10) : null;

    // Đếm từng loại status
    if (status === 'CANCELLED') {
      cancelled += count;
      continue; // CANCELLED loại ra khỏi total
    }

    total += count;

    if (status === 'DONE') {
      done += count;
    } else if (status === 'DOING' || status === 'REVIEW') {
      inProgress += count;
    } else {
      // TO_DO, BACKLOG (được map thành TO_DO)
      todo += count;
    }

    // Tính overdue và dueSoon (chỉ cho task chưa DONE/CANCELLED)
    if (status !== 'DONE' && due) {
      if (due < today) {
        overdue += count;
      } else if (due === today || due === tomorrow) {
        dueSoon += count;
      }
    }
  }

  const progress = total === 0 ? 0 : Math.round((done / total) * 100);

  return { total, done, inProgress, todo, cancelled, overdue, dueSoon, progress };
}

// ──────────────────────────────────────────────────────────────────────────────
// SQL TEMPLATE – dùng chung cho mọi API
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Trả về SQL aggregate query và params để tính chỉ số.
 * Nhận thêm `whereClause` và `params` từ getTaskScopeFilter().
 *
 * Ví dụ dùng với D1:
 * ```ts
 * const scope = getTaskScopeFilter(user, 'READ');
 * const { sql, params } = buildMetricsQuery(scope.sql, scope.params);
 * const { results } = await db.prepare(sql).bind(...params).all();
 * const metrics = computeMetricsFromAgg(results as RawAggRow[]);
 * ```
 */
export function buildMetricsQuery(
  whereClause: string,
  params: unknown[]
): { sql: string; params: unknown[] } {
  const sql = `
    SELECT
      status,
      CASE
        WHEN due_date IS NULL OR due_date = '' THEN NULL
        WHEN due_date LIKE '____-__-__' THEN due_date
        ELSE SUBSTR(due_date, 1, 10)
      END AS due_date,
      COUNT(*) AS count
    FROM tasks
    WHERE ${whereClause || '1=1'}
    GROUP BY status, due_date
  `;
  return { sql: sql.trim(), params };
}

/**
 * Tính metrics cho một SCOPE cụ thể trực tiếp từ D1 binding.
 * Đây là hàm tiện lợi dùng trong API route handlers.
 */
export async function fetchMetrics(
  db: any,
  whereClause: string,
  params: unknown[]
): Promise<TaskMetrics> {
  const { sql, params: bindParams } = buildMetricsQuery(whereClause, params);
  try {
    const stmt = db.prepare(sql);
    // Bind params theo thứ tự
    let bound = stmt;
    for (const p of bindParams) {
      bound = bound.bind ? bound.bind(p) : bound;
    }
    // D1 chỉ nhận bind(...args) dạng spread
    const { results } = await db.prepare(sql).bind(...bindParams).all();
    return computeMetricsFromAgg((results || []) as RawAggRow[]);
  } catch {
    return { total: 0, done: 0, inProgress: 0, todo: 0, cancelled: 0, overdue: 0, dueSoon: 0, progress: 0 };
  }
}
