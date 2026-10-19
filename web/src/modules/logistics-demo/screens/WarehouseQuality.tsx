"use client";

// Màn hình Kho / TTPP (mục 7.4, 7.6, 7.7), Kinh doanh · Công nghệ · QC (mục 7.5) và Sản xuất.

import React from "react";
import {
  IconBarcode,
  IconBuildingWarehouse,
  IconClipboardCheck,
  IconFlask,
  IconPackageExport,
  IconPalette,
  IconReportAnalytics,
  IconRuler2,
  IconTruckLoading,
  IconUserCheck,
} from "@tabler/icons-react";
import {
  confirmIncident,
  confirmProductionReceipt,
  fixDailyData,
  handoverDoc,
  handoverTech,
  lockDailyData,
  publishDailyReport,
  receiveGoods,
  recordLabResult,
  reportShortfall,
  scanZone,
  signColor,
  supplyToProduction,
  DOC_LABEL,
  type DocKey,
  type TechKey,
} from "../actions";
import { DEPTS } from "../config";
import { addDays, diffDays, fmtDM, fmtDMY } from "../dates";
import {
  colorDeadline,
  expectedArrival,
  hasArrived,
  labDeadline,
  openIncident,
  sewDate,
  shortageWithin,
  stepOnTime,
  supplierOf,
  syncPercent,
} from "../engine";
import { useDemo } from "../store";
import { Btn, Card, CardHeader, DueText, Empty, ProgressBar, Stat, StatusPill, Table, Td, Th, ViewOnlyBanner, cx } from "../ui";

// ═══════════════════════════════════════════════════════════════════════════
// KHO / TRUNG TÂM PHÂN PHỐI
// ═══════════════════════════════════════════════════════════════════════════

export function WarehouseScreen() {
  const { state, views, canEdit, apply } = useDemo();
  const edit = canEdit("kho");
  const t = state.thresholds;

  const receiving = views.filter((v) => hasArrived(v.order, state.today) && !v.order.steps[8].doneAt);
  const incoming = state.orders
    .filter((o) => o.steps[6].doneAt && !hasArrived(o, state.today))
    .map((o) => ({ o, exp: expectedArrival(o)! }))
    .filter((x) => x.exp <= addDays(state.today, 7))
    .sort((a, b) => (a.exp < b.exp ? -1 : 1));
  const toSupply = views.filter((v) => v.order.steps[8].doneAt && v.order.steps[9].doneAt && !v.order.steps[10].doneAt);
  const shortage = shortageWithin(state, 14);
  const totalSlots = state.barcode.reduce((s, z) => s + z.total, 0);
  const scanned = state.barcode.reduce((s, z) => s + z.scanned, 0);
  const barcodePct = totalSlots ? Math.round((scanned / totalSlots) * 100) : 0;
  const todayReport = state.reports.find((r) => r.date === state.today);

  return (
    <div className="space-y-4">
      {!edit ? <ViewOnlyBanner ownerName={DEPTS.KHO.name} /> : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Lô đang tiếp nhận" value={receiving.length} hint={`Nội địa ≤ ${t.inspectDomestic} ngày · nhập khẩu ≤ ${t.inspectImport} ngày`} />
        <Stat label="Ô kệ đã quét Barcode" value={`${barcodePct}%`} hint={`${scanned.toLocaleString("vi-VN")}/${totalSlots.toLocaleString("vi-VN")} ô · mục tiêu 100%`} tone={barcodePct >= 100 ? "good" : "warn"} />
        <Stat
          label="Báo cáo cân đối hôm nay"
          value={todayReport?.publishedAt ?? (todayReport ? "Đã chốt" : "Chưa chốt")}
          hint="Chốt 09:00 · phát hành trước 11:00"
          tone={todayReport?.publishedAt ? "good" : "warn"}
        />
        <Stat label="Đơn thiếu vật tư 2 tuần tới" value={shortage.length} tone={shortage.length ? "bad" : "good"} />
      </div>

      <Card>
        <CardHeader icon={<IconTruckLoading size={20} />} title="Tiếp nhận & kiểm tra hàng" subtitle="Đối chiếu chứng từ/PO với kế hoạch nhập · đạt thì quét Barcode nhập ô kệ và chuyển mẫu QC" />
        {receiving.length === 0 ? (
          <Empty text="Không có lô đang chờ tiếp nhận." />
        ) : (
          <Table minWidth={760}>
            <thead>
              <tr>
                <Th>Đơn / PO</Th>
                <Th>NCC</Th>
                <Th>Loại</Th>
                <Th>Ngày về</Th>
                <Th>Hạn kiểm</Th>
                <Th>Trạng thái</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {receiving.map((v) => {
                const o = v.order;
                const sup = supplierOf(state, o);
                const inc = openIncident(state.incidents, o.id, "SO_LUONG");
                return (
                  <tr key={o.id}>
                    <Td>
                      <div className="font-black text-slate-900">{o.code}</div>
                      <div className="text-[11px] text-slate-500">{o.poNo}</div>
                    </Td>
                    <Td>{sup.name}</Td>
                    <Td>{sup.origin === "NOI_DIA" ? "Nội địa" : "Nhập khẩu"}</Td>
                    <Td>{fmtDM(o.actualArrival)}</Td>
                    <Td>
                      <DueText daysLeft={v.steps[8].daysLeft} />
                    </Td>
                    <Td>
                      <StatusPill status={v.steps[8].status} />
                      {inc ? <div className="mt-1 text-[11px] text-slate-600">{inc.id}: {inc.status === "AWAITING_CONFIRM" ? "hàng bù đã về" : "Mua hàng đang xử lý"}</div> : null}
                    </Td>
                    <Td>
                      <div className="flex flex-wrap gap-1.5">
                        {inc ? (
                          <Btn small variant="primary" readOnly={!edit} disabled={inc.status !== "AWAITING_CONFIRM"} onClick={() => apply((s) => confirmIncident(s, inc.id, "KHO"))}>
                            Xác nhận đã bù đủ
                          </Btn>
                        ) : (
                          <>
                            <Btn small variant="primary" readOnly={!edit} onClick={() => apply((s) => receiveGoods(s, o.id))}>
                              Đạt – quét nhập ô kệ
                            </Btn>
                            <Btn small variant="danger" readOnly={!edit} onClick={() => apply((s) => reportShortfall(s, o.id))}>
                              Lập biên bản thiếu
                            </Btn>
                          </>
                        )}
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
        {incoming.length > 0 ? (
          <div className="border-t border-slate-100 px-4 py-2.5 text-[11px] text-slate-600">
            <span className="font-bold text-slate-800">Sắp về trong 7 ngày: </span>
            {incoming.map((x) => `${x.o.code} (${fmtDM(x.exp)})`).join(" · ")}
          </div>
        ) : null}
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <DailyReportCard edit={edit} />
        <Card>
          <CardHeader icon={<IconReportAnalytics size={20} />} title="Cân đối đồng bộ & cảnh báo thiếu 2 tuần tới" subtitle="Đơn có hạn cấp trong 14 ngày mà vật tư chưa đồng bộ 100%" />
          {shortage.length === 0 ? (
            <Empty text="Không có đơn thiếu vật tư trong 2 tuần tới." />
          ) : (
            <ul className="max-h-[320px] divide-y divide-slate-100 overflow-y-auto">
              {shortage.map((x) => (
                <li key={x.order.id} className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-2.5 text-xs">
                  <div className="min-w-0">
                    <div className="font-black text-slate-900">{x.order.code}</div>
                    <div className="text-slate-500">
                      Hạn cấp {fmtDM(x.supplyBy)} · <DueText daysLeft={x.daysToSupply} />
                    </div>
                  </div>
                  <div className="w-28">
                    <div className="mb-1 text-right text-[11px] font-black tabular-nums">{x.sync}%</div>
                    <ProgressBar value={x.sync} tone={x.daysToSupply < 0 ? "bad" : "warn"} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader
          icon={<IconPackageExport size={20} />}
          title="Cấp vật tư đồng bộ xuống sản xuất"
          subtitle={`Ngày cấp = ngày may − ${t.supplyLeadDays} ngày · chỉ cấp khi đủ 100% số lượng và chất lượng · Kho không tự điều chỉnh lịch may`}
        />
        {toSupply.length === 0 ? (
          <Empty text="Không có đơn đủ điều kiện cấp." />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Đơn</Th>
                <Th>Nhà máy / chuyền</Th>
                <Th>Ngày may</Th>
                <Th>Hạn cấp</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {toSupply.map((v) => (
                <tr key={v.order.id}>
                  <Td className="font-black text-slate-900">{v.order.code}</Td>
                  <Td>
                    {v.order.factory} · {v.order.line}
                  </Td>
                  <Td>{fmtDM(sewDate(v.order, t))}</Td>
                  <Td>
                    {fmtDM(v.steps[10].deadline)} · <DueText daysLeft={v.steps[10].daysLeft} />
                  </Td>
                  <Td>
                    <Btn small variant="primary" readOnly={!edit} onClick={() => apply((s) => supplyToProduction(s, v.order.id))}>
                      Lập phiếu xuất & quét xuất kho
                    </Btn>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Card>
        <CardHeader icon={<IconBarcode size={20} />} title="Quét Barcode 100% vị trí ô kệ" subtitle="Triển khai theo từng khu · không ghi nhận tồn khi chưa quét mã" />
        <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
          {state.barcode.map((z) => {
            const pct = Math.round((z.scanned / z.total) * 100);
            return (
              <div key={z.zone} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-slate-800">{z.zone}</span>
                  <span className="font-black tabular-nums text-slate-900">{pct}%</span>
                </div>
                <div className="my-2">
                  <ProgressBar value={pct} />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500">
                    {z.scanned}/{z.total} ô
                  </span>
                  <Btn small readOnly={!edit} disabled={z.scanned >= z.total} onClick={() => apply((s) => scanZone(s, z.zone))}>
                    Quét tiếp
                  </Btn>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function DailyReportCard({ edit }: { edit: boolean }) {
  const { state, apply } = useDemo();
  const r = state.reports.find((x) => x.date === state.today);
  const history = state.reports.filter((x) => x.date < state.today).slice(-10);
  const onTime = history.filter((x) => x.onTime).length;
  const steps = [
    { label: "09:00 chốt dữ liệu", done: !!r },
    { label: "Trước 10:00 sửa dữ liệu lỗi", done: !!r && r.invalidRows === 0 },
    { label: "Trước 11:00 phát hành", done: !!r?.publishedAt },
  ];
  return (
    <Card>
      <CardHeader icon={<IconClipboardCheck size={20} />} title={`Báo cáo cân đối đồng bộ – ${fmtDMY(state.today)}`} subtitle="Dữ liệu phát sinh sau 09:00 tính vào báo cáo hôm sau" />
      <div className="space-y-3 px-4 py-3">
        <ol className="grid gap-2 sm:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.label} className={cx("rounded-xl border px-3 py-2 text-xs font-bold", s.done ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-600")}>
              {i + 1}. {s.label} {s.done ? "✓" : ""}
            </li>
          ))}
        </ol>
        {r && r.invalidRows > 0 && !r.publishedAt ? (
          <div className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
            {r.invalidRows} dòng dữ liệu chưa hợp lệ (trùng mã ô kệ, thiếu số lượng). Sửa trước 10:00 hoặc phát hành kèm ghi chú.
          </div>
        ) : null}
        {r?.publishedAt ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-900">
            Đã phát hành lúc {r.publishedAt}
            {r.note ? ` · ${r.note}` : ""}. Sau phát hành không sửa tay số liệu, chỉ phát hành bản điều chỉnh có ghi lý do.
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Btn small readOnly={!edit} disabled={!!r} onClick={() => apply(lockDailyData)}>
            Chốt dữ liệu 09:00
          </Btn>
          <Btn small readOnly={!edit} disabled={!r || r.invalidRows === 0 || !!r.publishedAt} onClick={() => apply(fixDailyData)}>
            Sửa dữ liệu lỗi
          </Btn>
          <Btn small variant="primary" readOnly={!edit} disabled={!r || !!r.publishedAt} onClick={() => apply(publishDailyReport)}>
            Phát hành báo cáo
          </Btn>
        </div>
        <div>
          <div className="mb-1 text-[11px] font-bold text-slate-600">
            10 ngày làm việc gần nhất: {onTime}/{history.length} báo cáo đúng giờ
          </div>
          <div className="flex gap-1">
            {history.map((h) => (
              <span
                key={h.date}
                title={`${fmtDM(h.date)} phát hành ${h.publishedAt}`}
                className={cx("flex h-6 flex-1 items-center justify-center rounded-md text-[9px] font-black", h.onTime ? "bg-emerald-600 text-white" : "bg-rose-600 text-white")}
              >
                {fmtDM(h.date)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// KINH DOANH · CÔNG NGHỆ · QC
// ═══════════════════════════════════════════════════════════════════════════

const DOC_KEYS: DocKey[] = ["bom", "wink", "giayMau", "squatbook"];
const TECH_KEYS: TechKey[] = ["rap", "dinhMuc"];

export function QualityScreen() {
  const { state, views, canEdit, apply } = useDemo();
  const edit = canEdit("kdcnqc");
  const t = state.thresholds;

  const kd = views
    .filter((v) => !v.order.steps[1].doneAt && (v.steps[1].daysLeft ?? 99) <= 14)
    .sort((a, b) => (a.steps[1].daysLeft ?? 0) - (b.steps[1].daysLeft ?? 0));
  const cn = views.filter((v) => v.order.steps[1].doneAt && !v.order.steps[2].doneAt);
  const lab = views.filter((v) => v.order.qcReceivedAt && !v.order.steps[9].doneAt);

  return (
    <div className="space-y-4">
      {!edit ? <ViewOnlyBanner ownerName="Kinh doanh, Công nghệ và QC" /> : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader icon={<IconClipboardCheck size={20} />} title="Kinh doanh: bàn giao thông tin đơn hàng" subtitle="Đúng deadline tính ngược · đơn có hạn trong 14 ngày hoặc đã trễ" />
          {kd.length === 0 ? (
            <Empty text="Không có đơn chờ bàn giao." />
          ) : (
            <ul className="max-h-[420px] divide-y divide-slate-100 overflow-y-auto">
              {kd.map((v) => (
                <li key={v.order.id} className="space-y-2 px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div>
                      <span className="font-black text-slate-900">{v.order.code}</span>
                      {v.order.hero ? <span className="ml-1.5 rounded bg-[#006838] px-1 py-px text-[9px] font-black text-white">TOUR</span> : null}
                      <span className="ml-2 text-slate-500">hạn {fmtDM(v.steps[1].deadline)}</span>
                    </div>
                    <DueText daysLeft={v.steps[1].daysLeft} />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {DOC_KEYS.map((k) =>
                      v.order.docs[k] ? (
                        <span key={k} className="inline-flex min-h-[36px] items-center rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 text-xs font-bold text-emerald-800">
                          ✓ {DOC_LABEL[k]}
                        </span>
                      ) : (
                        <Btn key={k} small variant="primary" readOnly={!edit} onClick={() => apply((s) => handoverDoc(s, v.order.id, k))}>
                          Giao {DOC_LABEL[k]}
                        </Btn>
                      ),
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader icon={<IconRuler2 size={20} />} title="Công nghệ: Rập, định mức, thông tin kỹ thuật" subtitle={`Trước khi hàng về · xử lý BOM trên hệ thống trong ${t.bomDays} ngày`} />
          {cn.length === 0 ? (
            <Empty text="Không có đơn chờ Rập/định mức." />
          ) : (
            <ul className="max-h-[420px] divide-y divide-slate-100 overflow-y-auto">
              {cn.map((v) => (
                <li key={v.order.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                  <div className="text-xs">
                    <div className="font-black text-slate-900">{v.order.code}</div>
                    <div className="text-slate-500">
                      Hạn {fmtDM(v.steps[2].deadline)} · <DueText daysLeft={v.steps[2].daysLeft} />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {TECH_KEYS.map((k) =>
                      v.order.docs[k] ? (
                        <span key={k} className="inline-flex min-h-[36px] items-center rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 text-xs font-bold text-emerald-800">
                          ✓ {DOC_LABEL[k]}
                        </span>
                      ) : (
                        <Btn key={k} small variant="primary" readOnly={!edit} onClick={() => apply((s) => handoverTech(s, v.order.id, k))}>
                          Giao {DOC_LABEL[k]}
                        </Btn>
                      ),
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader
          icon={<IconFlask size={20} />}
          title="QC: Lab test & ký màu"
          subtitle={`Lab test ≤ ${t.labHours} giờ · ký màu ≤ ${t.colorDays} ngày · đếm ngược từ giờ nhận mẫu · quá hạn cảnh báo trưởng QC`}
        />
        {lab.length === 0 ? (
          <Empty text="Không có mẫu chờ test." />
        ) : (
          <Table minWidth={820}>
            <thead>
              <tr>
                <Th>Đơn / NCC</Th>
                <Th>Nhận mẫu</Th>
                <Th>Lab test</Th>
                <Th>Ký màu</Th>
                <Th>Thao tác</Th>
              </tr>
            </thead>
            <tbody>
              {lab.map((v) => {
                const o = v.order;
                const inc = openIncident(state.incidents, o.id, "CHAT_LUONG");
                const ld = labDeadline(o, t);
                const cd = colorDeadline(o, t);
                return (
                  <tr key={o.id}>
                    <Td>
                      <div className="font-black text-slate-900">{o.code}</div>
                      <div className="text-[11px] text-slate-500">{supplierOf(state, o).name}</div>
                    </Td>
                    <Td>{fmtDM(o.qcReceivedAt)}</Td>
                    <Td>
                      {o.labPassedAt ? (
                        <span className="text-[11px] font-bold text-emerald-700">Đạt {fmtDM(o.labPassedAt)}</span>
                      ) : inc ? (
                        <span className="text-[11px] font-bold text-rose-700">
                          Không đạt · {inc.id} {inc.status === "AWAITING_CONFIRM" ? "(hàng thay thế đã về)" : "(Mua hàng xử lý)"}
                        </span>
                      ) : (
                        <DueText daysLeft={ld ? diffDays(ld, state.today) : null} hours />
                      )}
                    </Td>
                    <Td>
                      {o.colorSignedAt ? (
                        <span className="text-[11px] font-bold text-emerald-700">Đã ký {fmtDM(o.colorSignedAt)}</span>
                      ) : (
                        <DueText daysLeft={cd ? diffDays(cd, state.today) : null} />
                      )}
                    </Td>
                    <Td>
                      <div className="flex flex-wrap gap-1.5">
                        {inc ? (
                          <Btn small variant="primary" readOnly={!edit} disabled={inc.status !== "AWAITING_CONFIRM"} onClick={() => apply((s) => confirmIncident(s, inc.id, "KDCNQC"))}>
                            Test lại hàng thay thế: Đạt
                          </Btn>
                        ) : !o.labPassedAt ? (
                          <>
                            <Btn small variant="primary" readOnly={!edit} onClick={() => apply((s) => recordLabResult(s, o.id, true))}>
                              Lab đạt
                            </Btn>
                            <Btn small variant="danger" readOnly={!edit} onClick={() => apply((s) => recordLabResult(s, o.id, false))}>
                              Lab không đạt
                            </Btn>
                          </>
                        ) : null}
                        {!o.colorSignedAt ? (
                          <Btn small readOnly={!edit} onClick={() => apply((s) => signColor(s, o.id))}>
                            <IconPalette size={14} /> Ký màu
                          </Btn>
                        ) : null}
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>

      <Card>
        <CardHeader icon={<IconBuildingWarehouse size={20} />} title="Tiêu chuẩn kiểm hàng & tiêu chuẩn dập đã gửi Kho" subtitle="QC cung cấp theo từng loại vật tư, cập nhật khi có thay đổi" />
        <div className="grid gap-2 p-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { name: "Vải & lưới", ver: "v3", sent: true },
            { name: "Da & giả da", ver: "v2", sent: true },
            { name: "Đế & cao su", ver: "v4", sent: true },
            { name: "Phụ liệu & bao bì", ver: "v1", sent: false },
          ].map((s) => (
            <div key={s.name} className="rounded-xl border border-slate-200 px-3 py-2 text-xs">
              <div className="font-bold text-slate-800">{s.name}</div>
              <div className={cx("mt-0.5 font-semibold", s.sent ? "text-emerald-700" : "text-amber-700")}>
                {s.sent ? `Đã gửi Kho · ${s.ver}` : "Đang soạn, chưa gửi Kho"}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SẢN XUẤT (phạm vi cần xác nhận – mục 14)
// ═══════════════════════════════════════════════════════════════════════════

export function ProductionScreen() {
  const { state, views, canEdit, apply } = useDemo();
  const edit = canEdit("sx");
  const pending = views.filter((v) => v.order.steps[10].doneAt && !v.order.prodConfirmedAt);
  const confirmed = state.orders.filter((o) => o.prodConfirmedAt);
  const s10 = stepOnTime(views, 10);
  const kpi = s10.rate === null ? null : Math.round(s10.rate * 100);
  const upcoming = views
    .filter((v) => !v.order.steps[10].doneAt && state.planWeeks.includes(v.order.planWeek))
    .sort((a, b) => (a.order.planWeek < b.order.planWeek ? -1 : 1));

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
        Tài liệu gốc chỉ nhắc Sản xuất ở phần KPI. Màn hình này là phần nhỏ, cần Ban điều hành xác nhận phạm vi (mục 14).
      </div>
      {!edit ? <ViewOnlyBanner ownerName={DEPTS.SX.name} /> : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Stat label="Phiếu cấp chờ xác nhận" value={pending.length} tone={pending.length ? "warn" : "good"} />
        <Stat label="Đã xác nhận nhận vật tư" value={confirmed.length} />
        <Stat label="Kết đơn hàng (mô phỏng)" value={kpi === null ? "—" : `${kpi}%`} hint="Đơn cấp đủ đúng kế hoạch / tổng đơn đã cấp" tone={kpi !== null && kpi >= 90 ? "good" : "warn"} />
      </div>

      <Card>
        <CardHeader icon={<IconUserCheck size={20} />} title="Xác nhận nhận vật tư đồng bộ" subtitle="Tổ trưởng / chuyền trưởng xác nhận trên hệ thống trong ngày" />
        {pending.length === 0 ? (
          <Empty text="Không có phiếu cấp chờ xác nhận." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {pending.map((v) => (
              <li key={v.order.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-xs">
                <div>
                  <div className="font-black text-slate-900">{v.order.code}</div>
                  <div className="text-slate-500">
                    Kho cấp {fmtDM(v.order.steps[10].doneAt)} · {v.order.factory} / {v.order.line}
                  </div>
                </div>
                <Btn small variant="primary" readOnly={!edit} onClick={() => apply((s) => confirmProductionReceipt(s, v.order.id))}>
                  Xác nhận đã nhận đủ
                </Btn>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardHeader title="Kế hoạch Tầng 2: lệnh sản xuất dựa trên vật tư đã về" subtitle="Chỉ lập lệnh cho đơn đã đồng bộ vật tư" />
        {upcoming.length === 0 ? (
          <Empty text="Không có đơn trong 4 tuần kế hoạch." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {upcoming.slice(0, 12).map((v) => {
              const sync = syncPercent(v.order, state.today);
              return (
                <li key={v.order.id} className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-2.5 text-xs">
                  <div>
                    <span className="font-black text-slate-900">{v.order.code}</span>
                    <span className="ml-2 text-slate-500">
                      may {fmtDM(sewDate(v.order, state.thresholds))} · {v.order.factory} / {v.order.line}
                    </span>
                  </div>
                  <div className="w-36">
                    <div className="mb-1 flex justify-between text-[11px]">
                      <span className={cx("font-bold", sync >= 100 ? "text-emerald-700" : "text-amber-700")}>{sync >= 100 ? "Lập lệnh được" : "Chờ vật tư"}</span>
                      <span className="font-black tabular-nums">{sync}%</span>
                    </div>
                    <ProgressBar value={sync} tone={sync >= 100 ? "brand" : "warn"} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
