/**
 * ============================================================
 * ĐỒNG BỘ HAI CHIỀU GEMBA.PRO ⇄ HỆ THỐNG VĂN PHÒNG CHUỖI TBS
 * ============================================================
 * Dán file này thành một file .gs mới trong dự án Apps Script của Gemba.Pro.
 * Dùng lại SCHEMA, STATUS, CACHE_KEYS, _getGembaRaw, _cellByCol, _readAll, _sheet, _colByKey, _setByKey,
 * _removeCache, _invalidateGembaCache của Code.gs — không sửa code cũ.
 *
 *   Sheet → Web : phiếu mới/đã đổi trên sheet GEMBA được gửi lên hệ thống.
 *   Web → Sheet : thao tác trên web (tiếp nhận, gửi xác nhận, duyệt, không đạt, giao người, đổi ưu tiên)
 *                 được ghi vào sheet GEMBA + một dòng LICH_SU.
 *
 * Cài đặt (một lần):
 *   1. Project Settings → Script Properties, thêm:
 *        TBS_BASE_URL     https://vpchuoiskechers.tbsgroup2026.workers.dev
 *        TBS_SYNC_KEY     <khoá do quản trị hệ thống TBS cấp — không ghi vào code, không chia sẻ>
 *        TBS_SOURCE       THKG
 *        TBS_SOURCE_NAME  Tổ Hợp Kiên Giang
 *   2. Chạy pushGembaToTBSFull() một lần để gửi toàn bộ phiếu hiện có (cấp quyền khi được hỏi).
 *   3. Chạy installTbsSyncTrigger() để tự động đồng bộ hai chiều mỗi 5 phút.
 *
 * Chỉ đọc/ghi sheet GEMBA và LICH_SU. Không đọc/gửi sheet USER (mật khẩu, SĐT, email).
 * Dấu đồng bộ (mã băm nội dung từng phiếu) lưu trong sheet ẩn _TBS_SYNC.
 */

var TBS_SYNC_STATE_SHEET = '_TBS_SYNC';
var TBS_SYNC_BATCH = 200;
var TBS_GEMBA_FIELDS = Object.keys(SCHEMA.GEMBA);

/** Trigger 5 phút: web → sheet trước, rồi sheet → web */
function tbsSyncTick() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return 'Đang có lượt đồng bộ khác chạy';
  try {
    var applied = _tbsPullFromWeb();
    var pushed = _tbsPushToWeb(false, applied);
    return applied.count + ' thay đổi từ web; ' + pushed;
  } finally {
    lock.releaseLock();
  }
}

/** Gửi lại toàn bộ phiếu lên web (dùng lần đầu hoặc khi cần đồng bộ lại) */
function pushGembaToTBSFull() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return 'Đang có lượt đồng bộ khác chạy';
  try {
    return _tbsPushToWeb(true, { ids: {} });
  } finally {
    lock.releaseLock();
  }
}

function installTbsSyncTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    var fn = t.getHandlerFunction();
    if (fn === 'tbsSyncTick' || fn === 'pushGembaToTBS') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('tbsSyncTick').timeBased().everyMinutes(5).create();
  return 'Đã cài trigger đồng bộ hai chiều mỗi 5 phút';
}

/* ─────────────────────────── cấu hình & HTTP ─────────────────────────── */

function _tbsConfig() {
  var p = PropertiesService.getScriptProperties();
  var base = String(p.getProperty('TBS_BASE_URL') || '').replace(/\/+$/, '');
  var key = p.getProperty('TBS_SYNC_KEY');
  if (!base || !key) throw new Error('Thiếu TBS_BASE_URL hoặc TBS_SYNC_KEY trong Script Properties');
  var source = p.getProperty('TBS_SOURCE') || 'THKG';
  return { base: base, key: key, source: source, sourceName: p.getProperty('TBS_SOURCE_NAME') || source };
}

function _tbsFetch(cfg, method, path, payload) {
  var opts = { method: method, headers: { 'X-Sheet-Key': cfg.key }, muteHttpExceptions: true };
  if (payload) { opts.contentType = 'application/json'; opts.payload = JSON.stringify(payload); }
  var res = UrlFetchApp.fetch(cfg.base + path, opts);
  var code = res.getResponseCode();
  if (code !== 200) throw new Error('TBS ' + method.toUpperCase() + ' ' + path + ' lỗi HTTP ' + code + ': ' + res.getContentText().slice(0, 300));
  return JSON.parse(res.getContentText());
}

/* ─────────────────────────── web → sheet ─────────────────────────── */

var TBS_ACTION_LABEL = {
  ACCEPT: 'Tiếp nhận xử lý (web TBS)',
  SUBMIT_CONFIRMATION: 'Gửi xác nhận kết quả (web TBS)',
  APPROVE: 'Duyệt hoàn thành (web TBS)',
  REJECT: 'Không đạt - xử lý lại (web TBS)',
  UPDATE: 'Cập nhật (web TBS)'
};
var TBS_PRIORITY_TO_SHEET = { CAO: 'High', TRUNG_BINH: 'Medium', THAP: 'Low' };

function _tbsSheetStatus(change) {
  if (change.actionType === 'REJECT') return STATUS.REOPEN;
  if (change.status === 'COMPLETED') return STATUS.DONE;
  if (change.status === 'PROCESSING' || change.status === 'WAITING_CONFIRMATION') return STATUS.PROCESSING;
  return STATUS.NEW;
}

function _tbsParseUtc(s) {
  if (!s) return null;
  var d = new Date(String(s).replace(' ', 'T') + (String(s).indexOf('Z') < 0 && String(s).indexOf('+') < 0 ? 'Z' : ''));
  return isNaN(d.getTime()) ? null : d;
}

/** Lấy thay đổi từ web, ghi vào GEMBA + LICH_SU, rồi xác nhận. Trả về { count, ids } các phiếu đã ghi. */
function _tbsPullFromWeb() {
  var cfg = _tbsConfig();
  var res = _tbsFetch(cfg, 'get', '/api/gemba/sheet-changes?source=' + encodeURIComponent(cfg.source));
  var changes = res.changes || [];
  var applied = { count: 0, ids: {} };
  if (!changes.length) return applied;

  var sh = _sheet(SHEET_GEMBA);
  var rd = _readAll(sh), H = rd.headers;
  var col = function (f) { return _colByKey(H, 'GEMBA', f); };
  var iId = col('ID');
  if (iId < 0) throw new Error('Sheet GEMBA thiếu cột ID');
  var rowById = {};
  rd.rows.forEach(function (r, i) { if (r[iId]) rowById[String(r[iId]).trim()] = i; });

  var lsh = _ss().getSheetByName(SHEET_LICHSU);
  var LH = lsh ? _readAll(lsh).headers : [];
  var historyRows = [];
  var ackIds = [];
  var now = new Date();

  changes.forEach(function (c) {
    ackIds.push(c.changeId);
    var idx = rowById[String(c.sheetId).trim()];
    if (idx == null) { console.warn('[TBS SYNC] Không tìm thấy phiếu ' + c.sheetId + ' trên sheet — bỏ qua'); return; }
    var row = rd.rows[idx];
    var oldStatus = row[col('STATUS')];
    var newStatus = _tbsSheetStatus(c);
    var set = function (f, v) { var i = col(f); if (i >= 0 && v !== undefined && v !== null) row[i] = v; };

    set('STATUS', newStatus);
    if (c.assignedName !== undefined) set('ASSIGNEE_NAME', c.assignedName);
    if (c.assignedEmpCode !== undefined) set('ASSIGNEE_USER', c.assignedEmpCode);
    if (c.priority) set('PRIORITY', TBS_PRIORITY_TO_SHEET[c.priority] || c.priority);
    if (c.title) set('TITLE', c.title);
    if (c.actionType === 'ACCEPT' && col('STARTED_AT') >= 0 && !row[col('STARTED_AT')]) set('STARTED_AT', now);
    if (c.actionType === 'SUBMIT_CONFIRMATION') {
      if (c.note) set('RESULT', c.note);
      if (c.photoUrl) set('IMG_AFTER', c.photoUrl);
    }
    if (c.status === 'COMPLETED') {
      var done = _tbsParseUtc(c.closedAt) || now;
      set('COMPLETED_AT', done);
      var startIdx = col('STARTED_AT') >= 0 && row[col('STARTED_AT')] ? col('STARTED_AT') : col('CREATED_AT');
      var start = startIdx >= 0 ? new Date(row[startIdx]) : null;
      if (start && !isNaN(start.getTime())) set('PROCESS_HOURS', Math.round((done - start) / 360000) / 10);
    }
    sh.getRange(idx + 2, 1, 1, row.length).setValues([row]);
    applied.count++;
    applied.ids[String(c.sheetId).trim()] = true;

    if (lsh && LH.length) {
      var h = new Array(LH.length).fill('');
      _setByKey(h, LH, 'LICHSU', 'LOG_ID', 'TBS-' + c.changeId);
      _setByKey(h, LH, 'LICHSU', 'GEMBA_ID', c.sheetId);
      _setByKey(h, LH, 'LICHSU', 'ACTION', TBS_ACTION_LABEL[c.actionType] || TBS_ACTION_LABEL.UPDATE);
      _setByKey(h, LH, 'LICHSU', 'FROM_STATUS', oldStatus);
      _setByKey(h, LH, 'LICHSU', 'TO_STATUS', newStatus);
      _setByKey(h, LH, 'LICHSU', 'USER', c.performedBy || '');
      _setByKey(h, LH, 'LICHSU', 'NAME', c.performedByName || '');
      _setByKey(h, LH, 'LICHSU', 'TIMESTAMP', _tbsParseUtc(c.at) || now);
      _setByKey(h, LH, 'LICHSU', 'NOTE', (c.status === 'WAITING_CONFIRMATION' ? '[Chờ xác nhận] ' : '') + (c.note || ''));
      historyRows.push(h);
    }
  });

  if (historyRows.length) lsh.getRange(lsh.getLastRow() + 1, 1, historyRows.length, LH.length).setValues(historyRows);
  _invalidateGembaCache();
  _tbsFetch(cfg, 'post', '/api/gemba/sheet-changes/ack', { source: cfg.source, ids: ackIds });
  console.log('[TBS SYNC] Ghi ' + applied.count + '/' + changes.length + ' thay đổi từ web');
  return applied;
}

/* ─────────────────────────── sheet → web ─────────────────────────── */

/**
 * Gửi phiếu mới/đã đổi lên web. Phiếu vừa nhận thay đổi từ web (applied.ids) chỉ cập nhật dấu,
 * không gửi ngược lên để tránh vòng lặp.
 */
function _tbsPushToWeb(fullSync, applied) {
  var cfg = _tbsConfig();
  _removeCache(CACHE_KEYS.GEMBA_RAW);
  var raw = _getGembaRaw();
  var state = _tbsReadState();
  var changed = [];
  var nextHashes = {};

  raw.rows.forEach(function (row) {
    var rec = {};
    TBS_GEMBA_FIELDS.forEach(function (f) {
      var v = _cellByCol(row, raw.cols, f);
      rec[f] = v instanceof Date ? v.toISOString() : (v == null ? '' : String(v));
    });
    if (!rec.ID) return;
    var hash = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, JSON.stringify(rec)));
    nextHashes[rec.ID] = hash;
    if (applied.ids[rec.ID]) { state[rec.ID] = hash; return; }
    if (fullSync || state[rec.ID] !== hash) changed.push(rec);
  });

  var sent = 0;
  for (var i = 0; i < changed.length; i += TBS_SYNC_BATCH) {
    var chunk = changed.slice(i, i + TBS_SYNC_BATCH);
    var body = _tbsFetch(cfg, 'post', '/api/gemba/sheet-sync', { source: cfg.source, sourceName: cfg.sourceName, rows: chunk });
    if (body.failed) console.warn('[TBS SYNC] Một số phiếu lỗi:', JSON.stringify(body.errors));
    // Chỉ ghi dấu phiếu gửi thành công; phiếu lỗi sẽ được gửi lại ở lượt sau
    var failedIds = {};
    (body.errors || []).forEach(function (e) { if (e.id) failedIds[e.id] = true; });
    chunk.forEach(function (rec) { if (!failedIds[rec.ID]) state[rec.ID] = nextHashes[rec.ID]; });
    sent += chunk.length;
  }

  _tbsWriteState(state);
  var msg = 'gửi ' + sent + '/' + raw.rows.length + ' phiếu lên web' + (fullSync ? ' (toàn bộ)' : '');
  console.log('[TBS SYNC] ' + msg);
  return msg;
}

/* ─────────────────────────── dấu đồng bộ ─────────────────────────── */

function _tbsStateSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(TBS_SYNC_STATE_SHEET);
  if (!sh) {
    sh = ss.insertSheet(TBS_SYNC_STATE_SHEET);
    sh.getRange(1, 1, 1, 3).setValues([['ID', 'HASH', 'SYNCED AT']]);
    sh.setFrozenRows(1);
    sh.hideSheet();
  }
  return sh;
}

function _tbsReadState() {
  var sh = _tbsStateSheet();
  var map = {};
  if (sh.getLastRow() < 2) return map;
  sh.getRange(2, 1, sh.getLastRow() - 1, 2).getValues().forEach(function (r) {
    if (r[0]) map[String(r[0])] = String(r[1]);
  });
  return map;
}

function _tbsWriteState(map) {
  var sh = _tbsStateSheet();
  var now = new Date();
  var rows = Object.keys(map).map(function (id) { return [id, map[id], now]; });
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, 3).clearContent();
  if (rows.length) sh.getRange(2, 1, rows.length, 3).setValues(rows);
}
