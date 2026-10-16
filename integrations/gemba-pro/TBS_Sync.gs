/**
 * ============================================================
 * ĐỒNG BỘ GEMBA.PRO → HỆ THỐNG VĂN PHÒNG CHUỖI TBS (một chiều)
 * ============================================================
 * Dán file này thành một file .gs mới trong dự án Apps Script của Gemba.Pro.
 * Dùng lại SCHEMA, CACHE_KEYS, _getGembaRaw, _cellByCol, _removeCache của Code.gs — không sửa code cũ.
 *
 * Cài đặt (một lần):
 *   1. Project Settings → Script Properties, thêm:
 *        TBS_SYNC_URL     https://vpchuoiskechers.tbsgroup2026.workers.dev/api/gemba/sheet-sync
 *        TBS_SYNC_KEY     <khoá do quản trị hệ thống TBS cấp — không ghi vào code, không chia sẻ>
 *        TBS_SOURCE       THKG
 *        TBS_SOURCE_NAME  Tổ Hợp Kiên Giang
 *   2. Chạy hàm pushGembaToTBSFull() một lần để gửi toàn bộ phiếu hiện có (cấp quyền khi được hỏi).
 *   3. Chạy hàm installTbsSyncTrigger() để tự động gửi phiếu thay đổi mỗi 15 phút.
 *
 * Chỉ gửi sheet GEMBA. Không đọc/gửi sheet USER (mật khẩu, SĐT, email).
 * Phiếu đã gửi được ghi dấu (mã băm nội dung) trong sheet ẩn _TBS_SYNC; phiếu không đổi sẽ không gửi lại.
 */

var TBS_SYNC_STATE_SHEET = '_TBS_SYNC';
var TBS_SYNC_BATCH = 200;

/** Trigger 15 phút gọi hàm này: chỉ gửi phiếu mới hoặc đã thay đổi */
function pushGembaToTBS() {
  return _tbsSync(false);
}

/** Gửi lại toàn bộ phiếu (dùng lần đầu hoặc khi cần đồng bộ lại) */
function pushGembaToTBSFull() {
  return _tbsSync(true);
}

function installTbsSyncTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'pushGembaToTBS') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('pushGembaToTBS').timeBased().everyMinutes(15).create();
  return 'Đã cài trigger đồng bộ mỗi 15 phút';
}

function _tbsSync(fullSync) {
  var props = PropertiesService.getScriptProperties();
  var url = props.getProperty('TBS_SYNC_URL');
  var key = props.getProperty('TBS_SYNC_KEY');
  var source = props.getProperty('TBS_SOURCE') || 'THKG';
  var sourceName = props.getProperty('TBS_SOURCE_NAME') || source;
  if (!url || !key) throw new Error('Thiếu TBS_SYNC_URL hoặc TBS_SYNC_KEY trong Script Properties');

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return 'Đang có lượt đồng bộ khác chạy';
  try {
    _removeCache(CACHE_KEYS.GEMBA_RAW); // luôn đọc dữ liệu mới nhất
    var raw = _getGembaRaw();
    var fields = Object.keys(SCHEMA.GEMBA);
    var state = _tbsReadState();
    var changed = [];
    var nextHashes = {};

    raw.rows.forEach(function (row) {
      var rec = {};
      fields.forEach(function (f) {
        var v = _cellByCol(row, raw.cols, f);
        rec[f] = v instanceof Date ? v.toISOString() : (v == null ? '' : String(v));
      });
      if (!rec.ID) return;
      var hash = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, JSON.stringify(rec)));
      nextHashes[rec.ID] = hash;
      if (fullSync || state[rec.ID] !== hash) changed.push(rec);
    });

    var sent = 0;
    for (var i = 0; i < changed.length; i += TBS_SYNC_BATCH) {
      var chunk = changed.slice(i, i + TBS_SYNC_BATCH);
      var res = UrlFetchApp.fetch(url, {
        method: 'post',
        contentType: 'application/json',
        headers: { 'X-Sheet-Key': key },
        payload: JSON.stringify({ source: source, sourceName: sourceName, rows: chunk }),
        muteHttpExceptions: true
      });
      var code = res.getResponseCode();
      var body = {};
      try { body = JSON.parse(res.getContentText()); } catch (e) {}
      if (code !== 200) throw new Error('Đồng bộ lỗi HTTP ' + code + ': ' + res.getContentText().slice(0, 300));
      if (body.failed) console.warn('[TBS SYNC] Một số phiếu lỗi:', JSON.stringify(body.errors));
      // Chỉ ghi dấu phiếu đã gửi thành công; phiếu lỗi sẽ được gửi lại ở lượt sau
      var failedIds = {};
      (body.errors || []).forEach(function (e) { if (e.id) failedIds[e.id] = true; });
      chunk.forEach(function (rec) { if (!failedIds[rec.ID]) state[rec.ID] = nextHashes[rec.ID]; });
      sent += chunk.length;
    }

    _tbsWriteState(state);
    var msg = 'Đã gửi ' + sent + '/' + raw.rows.length + ' phiếu' + (fullSync ? ' (toàn bộ)' : ' (thay đổi)');
    console.log('[TBS SYNC] ' + msg);
    return msg;
  } finally {
    lock.releaseLock();
  }
}

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
