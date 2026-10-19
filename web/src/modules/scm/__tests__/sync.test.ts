import { describe, expect, it } from "vitest";
import { khsxWarnings, syncCellStatus } from "../server-step3";

const today = "2026-11-10";
const base = { due: "2026-11-20", planDate: null as string | null, resultDate: null as string | null, result: null as string | null };

describe("syncCellStatus — trạng thái ô đồng bộ vật tư", () => {
  it("cấp đủ trước / đúng hạn → DONE", () => {
    expect(syncCellStatus({ ...base, result: "DU", resultDate: "2026-11-20" }, today)).toBe("DONE");
  });
  it("cấp đủ sau hạn → DONE_LATE", () => {
    expect(syncCellStatus({ ...base, result: "DU", resultDate: "2026-11-21" }, "2026-11-22")).toBe("DONE_LATE");
  });
  it("cấp thiếu → SHORT dù còn hạn", () => {
    expect(syncCellStatus({ ...base, result: "THIEU", resultDate: "2026-11-09" }, today)).toBe("SHORT");
  });
  it("quá hạn chưa cấp → OVERDUE", () => {
    expect(syncCellStatus({ ...base, planDate: "2026-11-18" }, "2026-11-21")).toBe("OVERDUE");
  });
  it("còn ≤ 3 ngày → DUE_SOON", () => {
    expect(syncCellStatus({ ...base, planDate: "2026-11-19" }, "2026-11-17")).toBe("DUE_SOON");
  });
  it("chưa có kế hoạch → NO_PLAN", () => {
    expect(syncCellStatus(base, today)).toBe("NO_PLAN");
  });
  it("kế hoạch cấp sau hạn → PLAN_LATE", () => {
    expect(syncCellStatus({ ...base, planDate: "2026-11-22" }, today)).toBe("PLAN_LATE");
  });
  it("kế hoạch trước hạn → OPEN", () => {
    expect(syncCellStatus({ ...base, planDate: "2026-11-15" }, today)).toBe("OPEN");
  });
});

describe("khsxWarnings — kiểm tra KHSX", () => {
  it("thiếu ngày", () => {
    expect(khsxWarnings({ sewStart: null, lastStart: null, shipDate: "2026-12-30" })).toEqual(["Chưa có ngày may", "Chưa có ngày gò"]);
  });
  it("gò trước may và sau ngày xuất", () => {
    expect(khsxWarnings({ sewStart: "2026-12-10", lastStart: "2026-12-05", shipDate: "2026-12-30" })).toContain("Ngày gò trước ngày may");
    expect(khsxWarnings({ sewStart: "2026-12-10", lastStart: "2027-01-05", shipDate: "2026-12-30" })).toContain("Ngày gò sau ngày xuất hàng");
  });
  it("đủ và hợp lệ → không cảnh báo", () => {
    expect(khsxWarnings({ sewStart: "2026-12-01", lastStart: "2026-12-05", shipDate: "2026-12-30" })).toEqual([]);
  });
});
