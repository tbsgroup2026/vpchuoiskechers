/* Frontend chỉ hiển thị kết quả do API trả về: không tính phép/công/lương ở đây. */
(function () {
  var TOKEN_KEY = 'hr_token';
  var $ = function (id) { return document.getElementById(id); };
  var fmt = new Intl.NumberFormat('vi-VN');

  function setMsg(id, text, kind) { var el = $(id); el.textContent = text || ''; el.className = 'msg' + (kind ? ' ' + kind : ''); }
  function token() { return sessionStorage.getItem(TOKEN_KEY); }

  async function api(method, path, body, isForm) {
    var headers = {};
    if (token()) headers.Authorization = 'Bearer ' + token();
    var init = { method: method, headers: headers };
    if (body && !isForm) { headers['Content-Type'] = 'application/json'; init.body = JSON.stringify(body); }
    if (body && isForm) init.body = body;
    var res;
    try { res = await fetch('/api/hr' + path, init); }
    catch (e) { return { ok: false, status: 0, data: { error: 'Mất kết nối mạng. Chưa có gì được lưu.' } }; }
    var data = null;
    try { data = await res.json(); } catch (e) { data = { error: 'Phản hồi không hợp lệ từ máy chủ' }; }
    return { ok: res.ok, status: res.status, data: data };
  }

  function showApp(name) {
    $('login-card').hidden = true; $('app').hidden = false;
    $('who').hidden = false; $('who-name').textContent = name || '';
  }
  function showLogin() {
    sessionStorage.removeItem(TOKEN_KEY);
    $('login-card').hidden = false; $('app').hidden = true; $('who').hidden = true;
  }

  $('login-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    var code = $('empCode').value.trim(), pw = $('password').value;
    if (!code || !pw) { setMsg('login-msg', 'Nhập mã số nhân viên và mật khẩu', 'error'); return; }
    $('btn-login').disabled = true; setMsg('login-msg', 'Đang đăng nhập…');
    try {
      var r = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ empCode: code, password: pw }) });
      var j = await r.json().catch(function () { return {}; });
      if (!r.ok || !j.hrToken) { setMsg('login-msg', j.error || 'Đăng nhập không thành công', 'error'); return; }
      sessionStorage.setItem(TOKEN_KEY, j.hrToken);
      var me = await api('GET', '/me');
      if (!me.ok) { showLogin(); setMsg('login-msg', me.data.error || 'Không tải được hồ sơ', 'error'); return; }
      showApp(me.data.data.fullName);
      setMsg('login-msg', '');
    } catch (err) { setMsg('login-msg', 'Mất kết nối mạng', 'error'); }
    finally { $('btn-login').disabled = false; }
  });

  $('btn-logout').addEventListener('click', showLogin);

  $('leave-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    var d = $('leave-date').value;
    $('leave-result').textContent = '';
    if (!d) { setMsg('leave-msg', 'Chọn ngày nghỉ', 'error'); return; }
    $('btn-leave').disabled = true; setMsg('leave-msg', 'Đang gửi…');
    var r = await api('POST', '/leave', { startDate: d, endDate: d, leaveType: 'HALF', halfSession: $('leave-session').value });
    $('btn-leave').disabled = false;
    if (!r.ok) { setMsg('leave-msg', r.data.error || 'Gửi đơn không thành công', 'error'); return; }
    setMsg('leave-msg', 'Máy chủ đã ghi nhận đơn', 'ok');
    $('leave-result').textContent = 'Số ngày trừ: ' + r.data.data.days + ' | Trạng thái: ' + r.data.data.status + ' | Phép còn lại nếu được duyệt: ' + r.data.data.balanceIfApproved;
  });

  $('ts-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    var a = $('ts-in').value, b = $('ts-out').value;
    $('ts-result').textContent = '';
    if (!a || !b) { setMsg('ts-msg', 'Nhập giờ vào và giờ ra', 'error'); return; }
    // datetime-local không kèm múi giờ: gắn +07:00 (giờ Việt Nam); mọi phép tính do máy chủ thực hiện.
    $('btn-ts').disabled = true; setMsg('ts-msg', 'Đang ghi…');
    var r = await api('POST', '/timesheet', { checkIn: a + ':00+07:00', checkOut: b + ':00+07:00', nightShift: $('ts-night').checked });
    $('btn-ts').disabled = false;
    if (!r.ok) { setMsg('ts-msg', r.data.error || 'Ghi chấm công không thành công', 'error'); return; }
    setMsg('ts-msg', 'Máy chủ đã ghi nhận chấm công', 'ok');
    var d = r.data.data;
    $('ts-result').textContent = 'Ngày công: ' + d.workDate + ' | Số giờ: ' + d.hours + ' | Trạng thái: ' + d.status;
  });

  $('btn-payslip').addEventListener('click', async function () {
    var out = $('pay-result'); out.innerHTML = '';
    $('btn-payslip').disabled = true; setMsg('pay-msg', 'Đang tải…');
    var r = await api('GET', '/payslip/me');
    $('btn-payslip').disabled = false;
    if (!r.ok) { setMsg('pay-msg', r.data.error || 'Không tải được phiếu lương', 'error'); return; }
    var p = r.data.data;
    setMsg('pay-msg', p.legalWarning || '', p.legalWarning ? 'warn' : '');
    var dl = document.createElement('dl'); dl.className = 'slip';
    [['Lương cơ bản', p.baseSalary], ['Bảo hiểm', p.insurance], ['Thuế TNCN', p.tax], ['Thực nhận', p.net]].forEach(function (x) {
      var dt = document.createElement('dt'); dt.textContent = x[0];
      var dd = document.createElement('dd'); dd.textContent = fmt.format(x[1]) + ' ₫';
      dl.appendChild(dt); dl.appendChild(dd);
    });
    out.appendChild(dl);
  });

  $('up-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    var f = $('up-file').files[0];
    $('up-result').textContent = '';
    if (!f) { setMsg('up-msg', 'Chọn tệp để tải lên', 'error'); return; }
    $('btn-up').disabled = true; setMsg('up-msg', 'Đang tải lên… (chưa phải đã lưu)');
    var fd = new FormData(); fd.append('file', f, f.name);
    var r = await api('POST', '/files', fd, true);
    $('btn-up').disabled = false;
    // CHỈ báo thành công khi máy chủ xác nhận stored === true.
    if (r.ok && r.data && r.data.data && r.data.data.stored === true) {
      setMsg('up-msg', 'Máy chủ đã xác nhận lưu tệp', 'ok');
      $('up-result').textContent = r.data.data.name + ' | ' + fmt.format(r.data.data.size) + ' byte | SHA-256: ' + r.data.data.sha256.slice(0, 16) + '…';
    } else {
      setMsg('up-msg', (r.data && r.data.error) || 'Tải lên không thành công; tệp chưa được lưu', 'error');
    }
  });

  if (token()) {
    api('GET', '/me').then(function (me) { if (me.ok) showApp(me.data.data.fullName); else showLogin(); });
  }
})();
