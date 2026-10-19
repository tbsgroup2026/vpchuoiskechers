"use client";

// Store của DEMO: giữ state trong React, lưu vào localStorage của trình duyệt, không gọi API nào.

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ACCESS, DEMO_BASE_DATE, ROLE_HOME, STATE_VERSION, STORAGE_KEY } from "./config";
import { setToday as setTodayAction, type ActionResult } from "./actions";
import { computeAll, computeBottlenecks, computeEscalations, type Bottleneck, type Escalation, type OrderView } from "./engine";
import { buildSeedState } from "./seed";
import type { Access, DemoState, RoleKey, ScreenKey } from "./types";

export interface Toast {
  id: number;
  ok: boolean;
  text: string;
}

export interface DemoStore {
  state: DemoState;
  views: OrderView[];
  bottlenecks: Bottleneck[];
  escalations: Escalation[];
  access: (screen: ScreenKey) => Access;
  canEdit: (screen: ScreenKey) => boolean;
  /** Chạy một thao tác nghiệp vụ; trả true nếu thành công */
  apply: (fn: (s: DemoState) => ActionResult, quiet?: boolean) => boolean;
  setRole: (role: RoleKey) => void;
  setScreen: (screen: ScreenKey) => void;
  setDate: (date: string) => void;
  reset: () => void;
  toasts: Toast[];
  notify: (text: string, ok?: boolean) => void;
  tourStep: number | null;
  setTourStep: (n: number | null) => void;
  /** Đơn được chọn để mở chi tiết trên Tiến độ chung */
  focusOrderId: string | null;
  setFocusOrderId: (id: string | null) => void;
}

const Ctx = createContext<DemoStore | null>(null);

function loadSaved(): DemoState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DemoState;
    return parsed && parsed.version === STATE_VERSION && Array.isArray(parsed.orders) ? parsed : null;
  } catch {
    return null;
  }
}

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DemoState>(() => buildSeedState(DEMO_BASE_DATE));
  // Ref luôn giữ state mới nhất để nhiều thao tác liên tiếp trong cùng một lần bấm (tour) không đọc state cũ
  const stateRef = useRef(state);
  const [hydrated, setHydrated] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [tourStep, setTourStep] = useState<number | null>(null);
  const [focusOrderId, setFocusOrderId] = useState<string | null>(null);
  const toastSeq = useRef(0);

  const commit = useCallback((next: DemoState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  useEffect(() => {
    const saved = loadSaved();
    if (saved) commit(saved);
    setHydrated(true);
  }, [commit]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Trình duyệt chặn lưu trữ: demo vẫn chạy, chỉ không nhớ sau khi tải lại
    }
  }, [state, hydrated]);

  const notify = useCallback((text: string, ok = true) => {
    toastSeq.current += 1;
    const id = toastSeq.current;
    setToasts((ts) => [...ts.slice(-2), { id, ok, text }]);
    window.setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), 4200);
  }, []);

  const apply = useCallback(
    (fn: (s: DemoState) => ActionResult, quiet = false) => {
      const r = fn(stateRef.current);
      if (r.ok) commit(r.state);
      if (!quiet || !r.ok) notify(r.message, r.ok);
      return r.ok;
    },
    [commit, notify],
  );

  const setRole = useCallback(
    (role: RoleKey) => {
      const s = stateRef.current;
      commit({ ...s, role, screen: role === "BDH" ? s.screen : ROLE_HOME[role] });
    },
    [commit],
  );

  const setScreen = useCallback((screen: ScreenKey) => commit({ ...stateRef.current, screen }), [commit]);

  const setDate = useCallback((date: string) => commit(setTodayAction(stateRef.current, date)), [commit]);

  const reset = useCallback(() => {
    commit(buildSeedState(DEMO_BASE_DATE));
    setTourStep(null);
    setFocusOrderId(null);
    notify("Đã khôi phục dữ liệu DEMO về trạng thái ban đầu (15/10/2026)");
  }, [commit, notify]);

  const views = useMemo(() => computeAll(state), [state]);
  const bottlenecks = useMemo(() => computeBottlenecks(views), [views]);
  const escalations = useMemo(() => computeEscalations(state, views), [state, views]);

  const access = useCallback((screen: ScreenKey) => ACCESS[screen][state.role], [state.role]);
  const canEdit = useCallback((screen: ScreenKey) => ACCESS[screen][state.role] === "edit", [state.role]);

  const value: DemoStore = {
    state,
    views,
    bottlenecks,
    escalations,
    access,
    canEdit,
    apply,
    setRole,
    setScreen,
    setDate,
    reset,
    toasts,
    notify,
    tourStep,
    setTourStep,
    focusOrderId,
    setFocusOrderId,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDemo(): DemoStore {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDemo phải nằm trong DemoProvider");
  return ctx;
}
