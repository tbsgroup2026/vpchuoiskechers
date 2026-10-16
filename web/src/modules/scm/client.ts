// Gọi /api/scm/* từ giao diện (cookie đăng nhập gửi kèm cùng origin).

import type { OwnerDept, ScmDept, StepNo } from "./config";
import type { OrderState, StepStatus } from "./engine";
import type { Access, ScreenKey } from "./permissions";

export class ScmApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function scmApi<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(`/api/scm/${path}`, {
    method: init?.method || "GET",
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
    body: init?.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) throw new ScmApiError(json.message || json.error || `Lỗi máy chủ (${res.status})`, res.status);
  return json as T;
}

export interface ScmMe {
  empCode: string;
  name: string;
  depts: ScmDept[];
  isHead: boolean;
  bypass: boolean;
  access: Record<ScreenKey, Access>;
  canApprovePermissions: boolean;
  site: string;
  today: string;
}

export interface Overview {
  today: string;
  cards: { tracking: number; onTrack: number; withLate: number; withBlocked: number; shipIn45: number; complete: number };
  bottlenecks: { owner: OwnerDept; name: string; late: number; blocking: number; total: number }[];
  plants: string[];
}

export interface OrderItem {
  id: string;
  code: string;
  site: string;
  plant: string | null;
  line: string | null;
  style: string | null;
  qty: number;
  shipDate: string;
  daysToShip: number;
  state: OrderState;
  progress: number;
  stuck: { step: StepNo; owner: OwnerDept; ownerName: string; text: string } | null;
  steps: { no: StepNo; status: StepStatus; due: string; doneAt: string | null; reason: string }[];
}

export interface OrderPage {
  items: OrderItem[];
  total: number;
  page: number;
  pageSize: number;
  today: string;
}

export interface OrderDetail {
  order: OrderItem;
  detail: {
    supplierLeadTime: number;
    transportDays: number;
    origin: string;
    noSilent: boolean;
    infoDeadline: string;
    formula: string;
    steps: {
      no: StepNo;
      owner: OwnerDept;
      ownerName: string;
      status: StepStatus;
      due: string;
      doneAt: string | null;
      daysLeft: number;
      daysLate: number;
      reason: string;
      title: string;
      sla: string;
      waitingOnName: string | null;
      escalation: 0 | 1 | 2 | 3;
      canEdit: boolean;
    }[];
  };
}
