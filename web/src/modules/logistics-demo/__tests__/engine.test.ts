import { describe, expect, it } from "vitest";
import {
  activateOrder,
  agreeIncidentPlan,
  allocateOrder,
  approvePlan,
  confirmIncident,
  confirmProductionReceipt,
  handoverDoc,
  handoverTech,
  issuePlan312,
  receiveGoods,
  recordLabResult,
  sendNoSilent,
  setThreshold,
  setToday,
  signColor,
  supplyToProduction,
} from "../actions";
import { DEFAULT_THRESHOLDS, STEPS, STEP_NOS } from "../config";
import { isoWeek, weekStart } from "../dates";
import {
  computeAll,
  computeBottlenecks,
  computeEscalations,
  computeOrderView,
  escalationLevel,
  infoDeadline,
  isStepDone,
  supplyDeadline,
  sewDate,
} from "../engine";
import { HERO_ORDER_ID, buildSeedState } from "../seed";
import type { DemoState, Order } from "../types";

const hero = (s: DemoState): Order => s.orders.find((o) => o.id === HERO_ORDER_ID)!;

function must(r: { ok: boolean; message: string; state: DemoState }): DemoState {
  if (!r.ok) throw new Error(r.message);
  return r.state;
}

describe("hạn chót tính ngược (mục 2.1)", () => {
  it("ví dụ trong tài liệu: xuất 18/12/2026, LT 35, VC 10 → 01/10/2026", () => {
    expect(infoDeadline("2026-12-18", 35, 10, DEFAULT_THRESHOLDS)).toBe("2026-10-01");
  });

  it("ngày cấp = ngày may − 14 ngày", () => {
    const o = { exportDate: "2026-12-18" } as Order;
    expect(sewDate(o, DEFAULT_THRESHOLDS)).toBe("2026-12-11");
    expect(supplyDeadline(o, DEFAULT_THRESHOLDS)).toBe("2026-11-27");
  });

  it("tuần dự án T1 = tuần 42/2026", () => {
    expect(isoWeek("2026-10-15")).toBe(42);
    expect(weekStart("2026-10-15")).toBe("2026-10-12");
    expect(isoWeek("2027-01-04")).toBe(1);
  });
});

describe("dữ liệu mẫu", () => {
  it("cố định: sinh hai lần ra cùng dữ liệu", () => {
    expect(JSON.stringify(buildSeedState())).toBe(JSON.stringify(buildSeedState()));
  });

  it("có 40 đơn, có đơn chính cho tour", () => {
    const s = buildSeedState();
    expect(s.orders).toHaveLength(40);
    expect(hero(s)).toBeDefined();
  });

  it("không bước nào hoàn thành khi bước phụ thuộc chưa xong", () => {
    const s = buildSeedState();
    for (const o of s.orders) {
      for (const k of STEP_NOS) {
        if (o.steps[k].doneAt) {
          for (const d of STEPS[k].deps) expect(isStepDone(o, d), `${o.code} bước ${k} phụ thuộc ${d}`).toBe(true);
          expect(o.steps[k].doneAt! <= s.today).toBe(true);
        }
      }
    }
  });

  it("dữ liệu có đủ các tình huống: hoàn thành, đang làm, trễ, bị chặn", () => {
    const views = computeAll(buildSeedState());
    const statuses = new Set(views.flatMap((v) => STEP_NOS.map((k) => v.steps[k].status)));
    for (const st of ["done", "doing", "late", "blocked", "pending", "na"]) expect(statuses.has(st as never)).toBe(true);
    expect(views.some((v) => v.complete)).toBe(true);
  });
});

describe("trạng thái, điểm nghẽn và leo thang", () => {
  it("đơn chính: bước 1 còn 1 ngày → cảnh báo cấp 1, bước 6 chưa đủ điều kiện vì thiếu Wink", () => {
    const s = buildSeedState();
    const v = computeOrderView(s, hero(s));
    expect(v.steps[1].status).toBe("doing");
    expect(v.steps[1].daysLeft).toBe(1);
    expect(v.steps[6].reason).toContain("Wink");
    const esc = computeEscalations(s, computeAll(s)).find((e) => e.orderCode === hero(s).code);
    expect(esc?.level).toBe(1);
  });

  it("mức leo thang theo số ngày trễ", () => {
    const t = DEFAULT_THRESHOLDS;
    expect(escalationLevel("doing", 1, 0, t)).toBe(1);
    expect(escalationLevel("doing", 4, 0, t)).toBe(0);
    expect(escalationLevel("late", null, 1, t)).toBe(2);
    expect(escalationLevel("late", null, 3, t)).toBe(3);
  });

  it("tua thời gian qua hạn → bước 1 của đơn chính trễ và chặn bước sau", () => {
    const s = setToday(buildSeedState(), "2026-10-19");
    const v = computeOrderView(s, hero(s));
    expect(v.steps[1].status).toBe("late");
    expect(v.steps[1].daysLate).toBe(3);
    expect(v.steps[3].status).toBe("blocked");
    expect(v.steps[3].waitingOn?.dept).toBe("KD");
    const b = computeBottlenecks(computeAll(s)).find((x) => x.orders.includes(hero(s).code));
    expect(b?.dept).toBe("KD");
    expect(b!.blockedDownstream).toBeGreaterThan(0);
  });

  it("đổi ngưỡng No Silent làm đổi hạn bước 5", () => {
    let s = buildSeedState();
    s = must(handoverDoc(s, HERO_ORDER_ID, "wink"));
    s = must(allocateOrder(s, HERO_ORDER_ID));
    const before = computeOrderView(s, hero(s)).steps[5].deadline;
    s = must(setThreshold(s, "noSilentDays", 2, "No Silent"));
    const after = computeOrderView(s, hero(s)).steps[5].deadline;
    expect(before).not.toBe(after);
  });
});

describe("luồng đơn chính từ thiếu Wink đến sản xuất nhận vật tư", () => {
  it("chạy hết 10 bước và cấp vật tư đúng hạn", () => {
    let s = buildSeedState();
    const id = HERO_ORDER_ID;

    expect(activateOrder(s, id).ok).toBe(false);
    s = must(handoverDoc(s, id, "wink"));
    s = must(handoverTech(s, id, "rap"));
    s = must(handoverTech(s, id, "dinhMuc"));
    s = must(allocateOrder(s, id));
    expect(issuePlan312(s).ok).toBe(false);
    s = must(approvePlan(s));
    s = must(issuePlan312(s));
    s = must(sendNoSilent(s, id));
    s = must(activateOrder(s, id));
    expect(hero(s).eta).toBe("2026-10-21");

    s = setToday(s, "2026-10-21");
    s = must(receiveGoods(s, id));
    s = setToday(s, "2026-10-22");
    s = must(signColor(s, id));
    s = must(recordLabResult(s, id, false));
    const inc = s.incidents[s.incidents.length - 1];
    expect(computeOrderView(s, hero(s)).steps[9].status).toBe("blocked");

    s = must(agreeIncidentPlan(s, inc.id, "DOI_HANG"));
    s = setToday(s, "2026-10-25");
    expect(s.incidents.find((i) => i.id === inc.id)!.status).toBe("AWAITING_CONFIRM");
    expect(confirmIncident(s, inc.id, "KHO").ok).toBe(false);
    s = must(confirmIncident(s, inc.id, "KDCNQC"));
    s = must(supplyToProduction(s, id));
    s = must(confirmProductionReceipt(s, id));

    const v = computeOrderView(s, hero(s));
    expect(v.steps[10].status).toBe("done");
    expect(v.steps[10].doneLate).toBe(false);
    expect(hero(s).prodConfirmedAt).toBe("2026-10-25");
  });
});
