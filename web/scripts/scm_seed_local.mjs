// Seed 24 đơn demo cho module SCM, CHỈ dùng trên D1 local (không áp vào production).
// Cách dùng:
//   node web/scripts/scm_seed_local.mjs > scm_seed_local.sql
//   npx wrangler d1 execute <db> --local --file scm_seed_local.sql
// Ngày được tính tương đối so với hôm nay (giờ Việt Nam) để luôn có đủ trạng thái:
// hoàn thành, đúng tiến độ, trễ hạn, bị chặn ở nhiều bộ phận khác nhau.

const DAY = 86400000;
const today = new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10);
const add = (d, n) => new Date(Date.parse(`${d}T00:00:00Z`) + n * DAY).toISOString().slice(0, 10);
const q = (v) => (v === null || v === undefined ? "NULL" : typeof v === "number" ? String(v) : `'${String(v).replace(/'/g, "''")}'`);
const OWNER = { 1: "KD", 2: "CN", 3: "KH", 4: "KH", 5: "KH", 6: "MH", 7: "MH", 8: "KHO", 9: "QC", 10: "KHO" };

const SITES = [
  ["VPC", "Văn phòng chuỗi"],
  ["PXM", "Phân xưởng mẫu"],
  ["NMMD", "NM Miền Đông"],
  ["KG1", "NM Kiên Giang 1"],
  ["KG2", "NM Kiên Giang 2"],
  ["KG3", "NM Kiên Giang 3"],
  ["HTD", "Hoàn thiện đế"],
];
const STYLES = ["SK-232045", "SK-149710", "SK-117015", "SK-216101", "SK-150043", "SK-405231", "SK-896112", "SK-104201"];

// [ship sau N ngày, lead time, vận chuyển, nguồn, các bước đã xong, xong cách đây N ngày, có No Silent]
const SCENARIOS = [
  // Hoàn thành
  [12, 30, 7, "NOI_DIA", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 20, 1],
  [20, 35, 10, "NHAP_KHAU", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 25, 1],
  [28, 25, 5, "NOI_DIA", [1, 2, 3, 4, 6, 7, 8, 9, 10], 30, 0],
  [35, 40, 12, "NHAP_KHAU", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 35, 1],
  // Đúng tiến độ
  [160, 30, 7, "NOI_DIA", [], 0, 1],
  [175, 35, 10, "NHAP_KHAU", [], 0, 1],
  [190, 28, 6, "NOI_DIA", [1], 1, 1],
  [205, 30, 7, "NHAP_KHAU", [1], 1, 1],
  [220, 45, 14, "NHAP_KHAU", [], 0, 1],
  [140, 25, 5, "NOI_DIA", [1, 2, 3, 4, 5, 6, 7], 2, 1],
  // Trễ hạn (chưa kéo theo bước bị chặn)
  [95, 30, 7, "NOI_DIA", [1, 2, 3, 4, 5], 6, 1],
  [110, 35, 10, "NHAP_KHAU", [1, 2, 3, 4, 5], 8, 1],
  [100, 28, 6, "NOI_DIA", [1, 2, 3, 4, 5], 7, 1],
  [120, 32, 8, "NHAP_KHAU", [1, 2, 3, 4, 5, 6, 7], 40, 1],
  // Bị chặn: Kinh doanh chưa bàn giao (bước 1 quá hạn)
  [60, 35, 10, "NHAP_KHAU", [], 0, 1],
  [70, 40, 12, "NHAP_KHAU", [], 0, 1],
  [55, 30, 7, "NOI_DIA", [], 0, 1],
  // Bị chặn: Công nghệ chưa giao rập/định mức (bước 2 quá hạn)
  [25, 30, 7, "NOI_DIA", [1, 3, 4, 5], 20, 1],
  [22, 35, 10, "NHAP_KHAU", [1, 3, 4, 5], 25, 1],
  // Bị chặn: Kế hoạch chưa phân bổ (bước 3 quá hạn)
  [85, 30, 7, "NOI_DIA", [1, 2], 12, 1],
  [90, 33, 9, "NHAP_KHAU", [1, 2], 15, 1],
  // Bị chặn: Mua hàng chưa đặt hàng lâu (bước 6 trễ kéo theo bước 8)
  [45, 20, 5, "NOI_DIA", [1, 2, 3, 4, 5, 7], 30, 1],
  // Bị chặn: Kho chưa tiếp nhận xong (bước 8 trễ, bước 9-10 chờ)
  [30, 15, 3, "NOI_DIA", [1, 2, 3, 4, 5, 6, 7], 40, 1],
  [26, 15, 3, "NOI_DIA", [1, 2, 3, 4, 5, 6, 7], 45, 0],
];

const lines = ["-- Seed SCM demo cho D1 local (sinh lúc " + new Date().toISOString() + ", hôm nay = " + today + ")"];
lines.push("DELETE FROM scm_order_steps WHERE order_id LIKE 'seed_%';");
lines.push("DELETE FROM scm_orders WHERE id LIKE 'seed_%';");
lines.push(
  "INSERT OR IGNORE INTO scm_suppliers (id, name, origin, lead_time_avg, transport_days, created_by) VALUES " +
    [
      ["sup_hd", "Công ty Da Hưng Đạt", "NOI_DIA", 25, 5],
      ["sup_vt", "Việt Thắng Textile", "NOI_DIA", 30, 7],
      ["sup_ty", "Tianyu Materials (CN)", "NHAP_KHAU", 35, 10],
      ["sup_kp", "KP Chemical (KR)", "NHAP_KHAU", 40, 12],
    ]
      .map((s) => `(${s.map(q).join(", ")}, 'SEED')`)
      .join(", ") +
    ";",
);

SCENARIOS.forEach(([shipIn, lead, transport, origin, doneSteps, doneAgo, noSilent], i) => {
  const [site, plant] = SITES[i % SITES.length];
  const id = `seed_${String(i + 1).padStart(2, "0")}`;
  const code = `SO-26${String(101 + i)}`;
  const ship = add(today, shipIn);
  lines.push(
    `INSERT INTO scm_orders (id, code, site, plant, line, style, qty, ship_date, supplier_lead_time, transport_days, origin, no_silent, created_by, updated_by) VALUES (${[
      id,
      code,
      site,
      plant,
      `Chuyền ${String((i % 6) + 1).padStart(2, "0")}`,
      STYLES[i % STYLES.length],
      1200 + ((i * 737) % 4800),
      ship,
      lead,
      transport,
      origin,
      noSilent,
      "SEED",
      "SEED",
    ]
      .map(q)
      .join(", ")});`,
  );
  for (let k = 1; k <= 10; k++) {
    const idx = doneSteps.indexOf(k);
    const doneAt = idx >= 0 ? `${add(today, -doneAgo + idx)} 09:00:00` : null;
    lines.push(`INSERT INTO scm_order_steps (order_id, step_no, owner_dept, done_at, done_by, created_by) VALUES (${[id, k, OWNER[k], doneAt, doneAt ? "SEED" : null, "SEED"].map(q).join(", ")});`);
  }
});

process.stdout.write(lines.join("\n") + "\n");
