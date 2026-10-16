import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../config";
import { canIssue, capacityByWeek, mondayOf, planWeeks, rankPriority, rollForward, validatePlan, type AllocLine } from "../planning";
import { canEscalateIncident, etaImpact, expectedArrival, incidentDay, nextIncidentStage, orderConditions, parseProcurementForm, poNumber } from "../purchasing";

const S = DEFAULT_SETTINGS;

describe("Kế hoạch cuốn chiếu 4 tuần", () => {
  it("tuần bắt đầu thứ Hai, đủ 4 tuần liên tục", () => {
    expect(mondayOf("2026-10-16")).toBe("2026-10-12");
    expect(mondayOf("2026-10-12")).toBe("2026-10-12");
    expect(mondayOf("2026-10-18")).toBe("2026-10-12");
    expect(planWeeks("2026-10-12")).toEqual(["2026-10-12", "2026-10-19", "2026-10-26", "2026-11-02"]);
    expect(validatePlan(planWeeks("2026-10-12"), [])).toEqual([]);
    expect(validatePlan(["2026-10-12", "2026-10-26"], []).length).toBeGreaterThan(0);
  });

  it("ưu tiên 312 tự xếp theo ngày xuất, mỗi đơn một thứ tự duy nhất", () => {
    const r = rankPriority([
      { id: "a", code: "SO-3", qty: 1, ship_date: "2026-12-20" },
      { id: "b", code: "SO-1", qty: 1, ship_date: "2026-11-01" },
      { id: "c", code: "SO-2", qty: 1, ship_date: "2026-12-20" },
    ]);
    expect([r.get("b"), r.get("c"), r.get("a")]).toEqual([1, 2, 3]);
    expect(new Set(r.values()).size).toBe(3);
  });

  it("mỗi đơn chỉ một nhà máy·chuyền trong mỗi tuần; tuần ngoài kế hoạch bị báo lỗi", () => {
    const weeks = planWeeks("2026-10-12");
    const lines: AllocLine[] = [
      { order_id: "a", week_start: "2026-10-12", plant: "KG1", line: "L1" },
      { order_id: "a", week_start: "2026-10-12", plant: "KG1", line: "L2" },
      { order_id: "b", week_start: "2026-12-07", plant: "KG1", line: "L1" },
    ];
    const errs = validatePlan(weeks, lines);
    expect(errs.some((e) => e.includes("hơn một"))).toBe(true);
    expect(errs.some((e) => e.includes("ngoài kế hoạch"))).toBe(true);
  });

  it("tính tải so với năng lực, đánh dấu tuần vượt theo từng chuyền", () => {
    const weeks = planWeeks("2026-10-12");
    const orders = [
      { id: "a", code: "A", qty: 6000, ship_date: "2026-12-01" },
      { id: "b", code: "B", qty: 5000, ship_date: "2026-12-02" },
      { id: "c", code: "C", qty: 2000, ship_date: "2026-12-03" },
    ];
    const lines: AllocLine[] = [
      { order_id: "a", week_start: weeks[0], plant: "KG1", line: "L1" },
      { order_id: "b", week_start: weeks[0], plant: "KG1", line: "L1" },
      { order_id: "c", week_start: weeks[1], plant: "KG1", line: "L2" },
    ];
    const loads = capacityByWeek(weeks, lines, orders, () => S.line_capacity_week);
    expect(loads[0]).toMatchObject({ load: 11000, capacity: 9000, over: true });
    expect(loads[0].overLines).toEqual(["KG1 · L1"]);
    expect(loads[1]).toMatchObject({ load: 2000, over: false });
    expect(loads[2]).toMatchObject({ load: 0, capacity: 0, over: false });
  });

  it("không ban hành khi chưa duyệt hoặc có tuần vượt năng lực", () => {
    const ok = [{ week: "w", load: 1, capacity: 2, over: false, overLines: [] }];
    const over = [{ week: "w", load: 3, capacity: 2, over: true, overLines: ["KG1 · L1"] }];
    expect(canIssue("DRAFT", ok, []).ok).toBe(false);
    expect(canIssue("PENDING", ok, []).ok).toBe(false);
    expect(canIssue("APPROVED", over, []).ok).toBe(false);
    expect(canIssue("APPROVED", ok, ["lỗi"]).ok).toBe(false);
    expect(canIssue("APPROVED", ok, []).ok).toBe(true);
  });

  it("thêm tuần mới giữ đủ 4 tuần, tuần cũ nhất chuyển sang sản xuất", () => {
    const lines: AllocLine[] = [
      { order_id: "a", week_start: "2026-10-12", plant: "KG1", line: "L1" },
      { order_id: "b", week_start: "2026-10-19", plant: "KG1", line: "L1" },
    ];
    const r = rollForward("2026-10-12", lines);
    expect(r.weekStart).toBe("2026-10-19");
    expect(r.carried.map((l) => l.order_id)).toEqual(["b"]);
    expect(r.released.map((l) => l.order_id)).toEqual(["a"]);
    expect(planWeeks(r.weekStart)[3]).toBe("2026-11-09");
  });
});

describe("Điều kiện đặt hàng", () => {
  it("thiếu BOM/Wink/Giày mẫu thuộc Kinh doanh, thiếu No Silent thuộc Kế hoạch", () => {
    const r = orderConditions({ handover: { bom: "2026-10-01" }, noSilent: true, noSilentAt: null }, "2026-10-16", S);
    expect(r.status).toBe("missing");
    expect(r.missing).toEqual([
      { label: "Wink", dept: "Kinh doanh" },
      { label: "Giày mẫu", dept: "Kinh doanh" },
      { label: "No Silent", dept: "Kế hoạch" },
    ]);
  });

  it("đủ điều kiện → sẵn sàng kích hoạt; đếm ngày x/3 từ khi có No Silent", () => {
    const h = { bom: "2026-10-01", wink: "2026-10-01", giay_mau: "2026-10-02" };
    const r = orderConditions({ handover: h, noSilent: true, noSilentAt: "2026-10-15 09:00:00" }, "2026-10-16", S);
    expect(r.status).toBe("ready");
    expect(r.noSilent).toMatchObject({ day: 2, of: 3, overdue: false });
    const late = orderConditions({ handover: h, noSilent: true, noSilentAt: "2026-10-10" }, "2026-10-16", S);
    expect(late.noSilent.overdue).toBe(true);
    expect(orderConditions({ handover: h, noSilent: true, noSilentAt: "2026-10-15", activatedAt: "x" }, "2026-10-16", S).status).toBe("activated");
    expect(orderConditions({ handover: h, noSilent: true, noSilentAt: "2026-10-15", issuedAt: "x" }, "2026-10-16", S).status).toBe("issued");
  });

  it("đơn không có No Silent không bị đòi No Silent", () => {
    const h = { bom: "x", wink: "x", giay_mau: "x" };
    expect(orderConditions({ handover: h, noSilent: false, noSilentAt: null }, "2026-10-16", S).status).toBe("ready");
  });

  it("số PO tự sinh theo tháng", () => {
    expect(poNumber(7, "2026-10-16")).toBe("PO-2610-0007");
  });

  it("ETA: NCC báo ngày thì dùng ngày đó, chưa báo thì phát hành PO + lead time + vận chuyển", () => {
    expect(expectedArrival("2026-10-16 10:00:00", 35, 10, null)).toBe("2026-11-30");
    expect(expectedArrival("2026-10-16", 35, 10, "2026-11-20")).toBe("2026-11-20");
    expect(expectedArrival(null, 35, 10, null)).toBeNull();
  });

  it("NCC đổi ngày: báo ảnh hưởng tới ngày cấp vật tư", () => {
    expect(etaImpact("2026-11-20", 7, "2026-12-01")).toEqual({ readyBy: "2026-11-27", slackDays: 4, late: false });
    expect(etaImpact("2026-11-28", 7, "2026-12-01")).toMatchObject({ slackDays: -4, late: true });
  });
});

describe("Sự cố NCC", () => {
  it("đếm ngày x/14 và chỉ hiện leo thang từ ngày cấu hình", () => {
    expect(incidentDay("2026-10-16", "2026-10-16")).toBe(1);
    expect(incidentDay("2026-10-07 08:00:00", "2026-10-16")).toBe(10);
    expect(canEscalateIncident(9, S)).toBe(false);
    expect(canEscalateIncident(10, S)).toBe(true);
  });

  it("đi đúng giai đoạn; phải chọn phương án; chỉ đóng khi Kho/QC đã xác nhận", () => {
    expect(nextIncidentStage("CONTACT", { plan: null, confirmed: false }).next).toBe("PLAN");
    expect(nextIncidentStage("PLAN", { plan: null, confirmed: false }).next).toBeNull();
    expect(nextIncidentStage("PLAN", { plan: "DOI_HANG", confirmed: false }).next).toBe("AWAIT_CONFIRM");
    expect(nextIncidentStage("AWAIT_CONFIRM", { plan: "DOI_HANG", confirmed: false }).next).toBeNull();
    expect(nextIncidentStage("AWAIT_CONFIRM", { plan: "DOI_HANG", confirmed: true }).next).toBe("CLOSED");
    expect(nextIncidentStage("CLOSED", { plan: "DOI_HANG", confirmed: true }).next).toBeNull();
  });

  it("form Mua hàng chưa đọc nội dung (chờ mẫu)", () => {
    expect(parseProcurementForm("x.xlsx").status).toBe("not_implemented");
  });
});
