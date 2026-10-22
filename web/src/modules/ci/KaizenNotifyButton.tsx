"use client";

import React, { useEffect, useState } from "react";
import { IconBell, IconBellOff, IconBellRinging, IconLoader2, IconShieldCheck } from "@tabler/icons-react";
import { normalizeVnPhone } from "@/lib/kaizenPublicHelper";

// Phải trùng VAPID_PUBLIC_KEY trong wrangler.jsonc — worker ký push bằng cặp khoá này
const KAIZEN_VAPID_PUBLIC_KEY = "BO2jkziEEK_t-ex0cLOzysw45I0mm2_g6iwA1CsdDep9nAoDVYmlqTjep7rHWtC-OHu8JWDQr-Ugh7LQMRGbc44";

type NotifyState = "checking" | "unsupported" | "off" | "on" | "denied" | "busy";

/**
 * Bằng chứng quyền nhận thông báo (máy chủ xác minh):
 * - token: mã bí mật máy chủ trả về ngay sau khi gửi sáng kiến (chỉ thiết bị vừa gửi có)
 * - hoặc msnv + phone: phải khớp với ít nhất một sáng kiến đã khai báo SĐT
 */
export interface KaizenNotifyProof {
  token?: string | null;
  msnv?: string;
  phone?: string;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i);
  return out;
}

function storageKey(type: "msnv" | "phone", value: string) {
  return `kz_notify:${type}:${value}`;
}

function readFlag(key: string): boolean {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function writeFlag(key: string, on: boolean) {
  try {
    if (on) localStorage.setItem(key, "1");
    else localStorage.removeItem(key);
  } catch {}
}

async function getRegistration(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration("/");
  if (existing) return existing;
  await navigator.serviceWorker.register("/sw.js");
  return navigator.serviceWorker.ready;
}

const CHANGE_EVENT = "kz-notify-changed";

export function isKaizenNotifySupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

/**
 * Xin quyền thông báo — PHẢI gọi đồng bộ trong thao tác bấm của người dùng (Safari/iOS chặn nếu gọi sau await).
 * Trả về promise kết quả quyền.
 */
export function requestKaizenNotifyPermission(): Promise<NotificationPermission> {
  if (!isKaizenNotifySupported()) return Promise.resolve("denied");
  if (Notification.permission !== "default") return Promise.resolve(Notification.permission);
  return Notification.requestPermission();
}

/** Đăng ký Web Push (yêu cầu quyền đã được cấp). Trả về MSNV chủ sáng kiến do máy chủ xác minh. */
export async function enableKaizenNotify(proof: KaizenNotifyProof): Promise<string> {
  if (!isKaizenNotifySupported() || Notification.permission !== "granted") throw new Error("Chưa được cấp quyền thông báo.");
  const reg = await getRegistration();
  let sub = await reg.pushManager.getSubscription();
  const wantKey = urlBase64ToUint8Array(KAIZEN_VAPID_PUBLIC_KEY);
  // Subscription cũ tạo bằng khoá VAPID khác sẽ không nhận được push → tạo lại
  const currentKey = sub?.options?.applicationServerKey ? new Uint8Array(sub.options.applicationServerKey as ArrayBuffer) : null;
  if (sub && currentKey && (currentKey.length !== wantKey.length || currentKey.some((b, i) => b !== wantKey[i]))) {
    await sub.unsubscribe();
    sub = null;
  }
  if (!sub) {
    sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: wantKey as unknown as BufferSource });
  }
  const body = proof.token
    ? { token: proof.token, subscription: sub.toJSON() }
    : { msnv: (proof.msnv || "").trim().toUpperCase(), phone: proof.phone || "", subscription: sub.toJSON() };
  const res = await fetch("/api/public/kaizen/notify/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) throw new Error(json.message || "Không bật được thông báo.");
  const msnv = String(json.msnv || proof.msnv || "").toUpperCase();
  if (msnv) writeFlag(storageKey("msnv", msnv), true);
  const phone = normalizeVnPhone(proof.phone);
  if (phone) writeFlag(storageKey("phone", phone), true);
  window.dispatchEvent(new Event(CHANGE_EVENT));
  return msnv;
}

/** Bật/tắt Web Push báo khi sáng kiến đổi trạng thái (không cần đăng nhập, có xác minh chủ sáng kiến). */
export default function KaizenNotifyButton({
  msnv: msnvProp = "",
  phone: phoneProp = "",
  token = null,
  compact = false,
}: {
  msnv?: string;
  phone?: string;
  token?: string | null;
  compact?: boolean;
}) {
  const [state, setState] = useState<NotifyState>("checking");
  const [msg, setMsg] = useState<string | null>(null);
  const [askProof, setAskProof] = useState(false);
  const [msnvIn, setMsnvIn] = useState(msnvProp.toUpperCase());
  const [phoneIn, setPhoneIn] = useState(phoneProp);
  const [ownerMsnv, setOwnerMsnv] = useState(msnvProp.toUpperCase());

  const flagKey = msnvProp ? storageKey("msnv", msnvProp.toUpperCase()) : storageKey("phone", normalizeVnPhone(phoneProp) || phoneProp);

  useEffect(() => {
    const sync = () => {
      if (!isKaizenNotifySupported()) {
        setState("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        setState("denied");
        return;
      }
      setState(readFlag(flagKey) && Notification.permission === "granted" ? "on" : "off");
    };
    sync();
    // Form đăng ký tự bật thông báo sau khi gửi → cập nhật lại trạng thái nút
    window.addEventListener(CHANGE_EVENT, sync);
    return () => window.removeEventListener(CHANGE_EVENT, sync);
  }, [flagKey]);

  const runEnable = async (proof: KaizenNotifyProof) => {
    setMsg(null);
    setState("busy");
    try {
      const permission = await requestKaizenNotifyPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "off");
        return;
      }
      const owner = await enableKaizenNotify(proof);
      setOwnerMsnv(owner);
      setAskProof(false);
      setState("on");
      setMsg("Đã bật! Bạn sẽ nhận thông báo khi sáng kiến được duyệt, chấm điểm hoặc cần chỉnh sửa.");
    } catch (e: any) {
      setState("off");
      setMsg(e?.message || "Không bật được thông báo trên thiết bị này.");
    }
  };

  const onEnableClick = () => {
    if (token) {
      runEnable({ token });
      return;
    }
    // Chưa đủ MSNV + SĐT → hiện ô nhập để xác minh chủ sáng kiến
    if (!msnvIn.trim() || !normalizeVnPhone(phoneIn)) {
      setAskProof(true);
      setMsg(null);
      return;
    }
    runEnable({ msnv: msnvIn, phone: phoneIn });
  };

  const onConfirmProof = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[A-Za-z0-9_-]{3,20}$/.test(msnvIn.trim())) {
      setMsg("MSNV không hợp lệ.");
      return;
    }
    if (!normalizeVnPhone(phoneIn)) {
      setMsg("SĐT gồm 10 số, bắt đầu bằng 0 (chấp nhận +84).");
      return;
    }
    runEnable({ msnv: msnvIn, phone: phoneIn });
  };

  const disable = async () => {
    setMsg(null);
    setState("busy");
    try {
      const reg = await navigator.serviceWorker.getRegistration("/");
      const sub = await reg?.pushManager.getSubscription();
      const owner = ownerMsnv || msnvIn;
      if (sub && owner) {
        await fetch("/api/public/kaizen/notify/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ msnv: owner, endpoint: sub.endpoint }),
        });
      }
    } catch {}
    writeFlag(flagKey, false);
    setState("off");
  };

  if (state === "checking") return null;

  if (state === "unsupported") {
    return compact ? null : (
      <p className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-500">
        Thiết bị/trình duyệt này chưa hỗ trợ thông báo. Trên iPhone: bấm Chia sẻ → “Thêm vào MH chính”, mở từ biểu tượng đó rồi bật lại.
      </p>
    );
  }

  const on = state === "on";
  const inputCls = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-[#006838] focus:ring-2 focus:ring-[#006838]/20";
  return (
    <div className="space-y-1.5">
      <div className={`rounded-2xl border p-3 ${on ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
        <div className="flex items-center gap-3">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${on ? "bg-emerald-600 text-white" : "bg-amber-400 text-white"}`}>
            {on ? <IconBellRinging size={20} /> : <IconBell size={20} />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-900">{on ? "Đang bật thông báo" : "Nhận thông báo khi đổi trạng thái"}</p>
            <p className="text-xs text-slate-600">
              {state === "denied"
                ? "Bạn đã chặn thông báo — mở cài đặt trình duyệt để cho phép lại."
                : on
                ? "Thiết bị này sẽ được báo khi sáng kiến được duyệt / chấm điểm."
                : token
                ? "Không cần đăng nhập, báo ngay trên điện thoại."
                : "Xác minh bằng MSNV + SĐT đã khai báo khi đăng ký."}
            </p>
          </div>
          {state !== "denied" && !askProof && (
            <button
              type="button"
              onClick={on ? disable : onEnableClick}
              disabled={state === "busy"}
              className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold shadow-sm disabled:opacity-60 ${on ? "border border-slate-300 bg-white text-slate-700" : "bg-[#006838] text-white"}`}
            >
              {state === "busy" ? <IconLoader2 size={14} className="animate-spin" /> : on ? <IconBellOff size={14} /> : <IconBell size={14} />}
              {on ? "Tắt" : "Bật"}
            </button>
          )}
        </div>

        {askProof && !on && state !== "denied" && (
          <form onSubmit={onConfirmProof} className="mt-3 space-y-2 border-t border-amber-200 pt-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <input value={msnvIn} onChange={(e) => setMsnvIn(e.target.value)} placeholder="MSNV" autoComplete="off" className={inputCls} />
              <input value={phoneIn} onChange={(e) => setPhoneIn(e.target.value)} placeholder="SĐT đã khai báo" inputMode="tel" autoComplete="tel" className={inputCls} />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={state === "busy"} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#006838] px-3 py-2.5 text-xs font-bold text-white disabled:opacity-60">
                {state === "busy" ? <IconLoader2 size={14} className="animate-spin" /> : <IconShieldCheck size={14} />} Xác minh &amp; bật
              </button>
              <button type="button" onClick={() => { setAskProof(false); setMsg(null); }} className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-bold text-slate-700">
                Huỷ
              </button>
            </div>
          </form>
        )}
      </div>
      {msg && <p className="px-1 text-xs text-slate-600">{msg}</p>}
    </div>
  );
}
