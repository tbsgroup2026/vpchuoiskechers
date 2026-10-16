import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, STEP_NOS, type StepNo } from "../config";
import {
  addDays,
  canComplete,
  computeBottlenecks,
  computeDueDates,
  computeOrderView,
  escalationLevel,
  infoDeadline,
  infoDeadlineFormula,
  undoCascade,
  type DoneMap,
  type OrderInput,
} from "../engine";

const S = DEFAULT_SETTINGS;
const order: OrderInput = { ship_date: "2026-12-18", supplier_lead_time: 35, transport_days: 10, no_silent: true, origin: "NHAP_KHAU" };
const statusOf = (v: ReturnType<typeof computeOrderView>, k: StepNo) => v.steps[k - 1].status;

describe("Hạn chót tính ngược", () => {
  it("ví dụ trong yêu cầu: xuất 18/12/2026, lead time 35, vận chuyển 10 → 01/10/2026", () => {
    expect(infoDeadline("2026-12-18", 35, 10, S)).toBe("2026-10-01");
    expect(infoDeadlineFormula(35, 10, S)).toBe("35 + 10 + 30 + 3 = 78 ngày");
  });

  it("dùng ngưỡng cấu hình, không viết cứng 30 và 3", () => {
    expect(infoDeadline("2026-12-18", 35, 10, { ...S, production_days: 20, bom_days: 5 })).toBe("2026-10-09");
  });

  it("bước 10 = ngày may − ngày cấp trước; ngày may = ngày xuất − cấu hình", () => {
    const due = computeDueDates(order, {}, S);
    expect(due[10]).toBe(addDays("2026-12-18", -(S.sew_to_export_days + S.supply_lead_days)));
  });

  it("đổi ngày xuất thì mọi hạn tính lại", () => {
    const a = computeDueDates(order, {}, S);
    const b = computeDueDates({ ...order, ship_date: "2026-12-28" }, {}, S);
    for (const k of STEP_NOS) expect(b[k] >= a[k]).toBe(true);
    expect(b[1]).toBe("2026-10-11");
  });
});

describe("Trạng thái và phụ thuộc", () => {
  it("đơn mới, chưa tới hạn: bước 1 Đang làm, các bước sau Chưa tới", () => {
    const v = computeOrderView(order, {}, "2026-09-20", S);
    expect(statusOf(v, 1)).toBe("doing");
    for (const k of [2, 3, 4, 5, 6, 7, 8, 9, 10] as StepNo[]) expect(statusOf(v, k)).toBe("pending");
    expect(v.state).toBe("on_track");
    expect(v.progress).toBe(0);
  });

  it("bước 1 quá hạn: Trễ hạn; bước sau đã đến hạn thì Bị chặn và ghi rõ đang chờ bước 1 của Kinh doanh", () => {
    const v = computeOrderView(order, {}, "2026-10-05", S);
    expect(statusOf(v, 1)).toBe("late");
    expect(v.steps[0].daysLate).toBe(4);
    const s3 = v.steps[2];
    expect(s3.status).toBe("blocked");
    expect(s3.waitingOn).toMatchObject({ step: 1, owner: "KD" });
    expect(v.state).toBe("blocked");
    expect(v.stuck?.step).toBe(1);
  });

  it("bước bị chặn chỉ ra bước gốc qua nhiều tầng phụ thuộc", () => {
    // Bước 1, 2 xong, bước 3 trễ → bước 5 rồi bước 6 (qua bước 5) đều chờ bước 3 (Kế hoạch)
    const v = computeOrderView(order, { 1: "2026-09-25", 2: "2026-09-28" }, "2026-11-20", S);
    expect(statusOf(v, 3)).toBe("late");
    expect(v.steps[5].waitingOn?.step).toBe(3);
    expect(v.steps[5].waitingOn?.owner).toBe("KH");
  });

  it("phụ thuộc đã xong và chưa quá hạn thì Đang làm", () => {
    const v = computeOrderView(order, { 1: "2026-09-25" }, "2026-09-25", S);
    expect(statusOf(v, 1)).toBe("done");
    expect(statusOf(v, 2)).toBe("doing");
    expect(statusOf(v, 3)).toBe("doing");
  });

  it("xong sau hạn được đánh dấu hoàn thành trễ", () => {
    const v = computeOrderView(order, { 1: "2026-10-04" }, "2026-10-04", S);
    expect(v.steps[0]).toMatchObject({ status: "done", doneLate: true, daysLate: 3 });
  });

  it("không cho Hoàn thành khi còn bước phụ thuộc chưa xong", () => {
    expect(canComplete(order, {}, 6)).toEqual({ ok: false, missing: [2, 5] });
    expect(canComplete(order, { 1: "2026-09-25" }, 3).ok).toBe(true);
  });

  it("đơn không có No Silent: bước 5 Không áp dụng và không chặn bước 6", () => {
    const o = { ...order, no_silent: false };
    expect(canComplete(o, { 1: "x", 2: "x" }, 6).ok).toBe(true);
    const v = computeOrderView(o, {}, "2026-09-20", S);
    expect(statusOf(v, 5)).toBe("na");
  });

  it("hoàn tác một bước kéo theo các bước đã xong phụ thuộc vào nó", () => {
    const m: DoneMap = { 1: "2026-09-25", 2: "2026-09-26", 3: "2026-09-26", 4: "2026-09-28", 5: "2026-09-30" };
    expect(undoCascade(m, 3)).toEqual([4, 5]);
    expect(undoCascade(m, 1)).toEqual([2, 3, 4, 5]);
    expect(undoCascade(m, 9)).toEqual([]);
  });

  it("đủ 10 bước thì Hoàn thành 100%", () => {
    const m = Object.fromEntries(STEP_NOS.map((k) => [k, "2026-09-25"])) as DoneMap;
    const v = computeOrderView(order, m, "2026-12-01", S);
    expect(v.state).toBe("complete");
    expect(v.progress).toBe(100);
    expect(v.stuck).toBeNull();
  });
});

describe("Điểm nghẽn và leo thang", () => {
  it("đếm bước trễ của phòng + bước bị chặn vì chờ phòng đó", () => {
    const late = computeOrderView(order, {}, "2026-10-05", S);
    const ok = computeOrderView(order, {}, "2026-09-20", S);
    const b = computeBottlenecks([late, ok]);
    const kd = b.find((x) => x.owner === "KD")!;
    expect(kd.late).toBe(1);
    expect(kd.blocking).toBe(late.steps.filter((s) => s.status === "blocked").length);
    expect(kd.total).toBe(kd.late + kd.blocking);
  });

  it("cấp 1 khi sắp tới hạn, cấp 2 khi quá hạn, cấp 3 khi quá hạn từ ngưỡng cấu hình", () => {
    const base = computeOrderView(order, {}, "2026-09-30", S).steps[0];
    expect(base.status).toBe("doing");
    expect(escalationLevel(base, S)).toBe(1);
    expect(escalationLevel(computeOrderView(order, {}, "2026-10-02", S).steps[0], S)).toBe(2);
    expect(escalationLevel(computeOrderView(order, {}, "2026-10-04", S).steps[0], S)).toBe(3);
    expect(escalationLevel(computeOrderView(order, {}, "2026-10-04", S).steps[0], { ...S, escalate_l3_days: 5 })).toBe(2);
    expect(escalationLevel(computeOrderView(order, {}, "2026-10-05", S).steps[2], S)).toBe(0);
  });
});
