// k6: spike 100 người dùng lúc 8:00 trên STAGING. Luồng: đăng nhập → xem phiếu lương → xin nghỉ → upload.
// Chạy: k6 run -e BASE_URL=https://... -e LT_PASSWORD=... web/scripts/loadtest-spike.js
import http from 'k6/http';
import { check, group } from 'k6';
import { Trend, Rate } from 'k6/metrics';

const BASE = __ENV.BASE_URL;
const PW = __ENV.LT_PASSWORD;
const flowDur = new Trend('flow_duration_ms', true);
const flowErr = new Rate('flow_error_rate');

export const options = {
  scenarios: {
    spike_0800: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5s', target: 100 }, // 100 người đăng nhập dồn dập trong 5 giây
        { duration: '60s', target: 100 },
        { duration: '5s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    'http_req_duration{step:login}': ['p(95)<2000'],
    'http_req_duration{step:payslip}': ['p(95)<2000'],
    'http_req_duration{step:leave}': ['p(95)<2000'],
    'http_req_duration{step:upload}': ['p(95)<2000'],
    flow_duration_ms: ['p(95)<2000'],
    flow_error_rate: ['rate<0.01'],
    http_req_failed: ['rate<0.01'],
  },
  summaryTrendStats: ['avg', 'min', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
};

const PDF = '%PDF-1.4\n' + 'x'.repeat(50 * 1024);

export default function () {
  const code = 'LT' + String(((__VU - 1) % 100) + 1).padStart(3, '0');
  const t0 = Date.now();
  let failed = false;
  const jh = { 'Content-Type': 'application/json' };

  const login = http.post(`${BASE}/api/auth/login`, JSON.stringify({ empCode: code, password: PW }), { headers: jh, tags: { step: 'login' } });
  const token = login.status === 200 ? login.json('hrToken') : null;
  failed = !check(login, { 'login 200 + hrToken': () => !!token }) || failed;
  if (!token) { flowErr.add(1); return; }
  const auth = { Authorization: `Bearer ${token}` };

  const ps = http.get(`${BASE}/api/hr/payslip/me`, { headers: auth, tags: { step: 'payslip' } });
  failed = !check(ps, { 'payslip 200': (r) => r.status === 200 && r.json('data.net') > 0 }) || failed;

  const day = 1 + ((__VU + __ITER) % 28);
  const m = 1 + ((__VU * 7 + __ITER) % 12);
  const date = `2027-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const lv = http.post(`${BASE}/api/hr/leave`, JSON.stringify({ startDate: date, endDate: date, leaveType: 'HALF', halfSession: 'AM' }), { headers: { ...auth, ...jh }, tags: { step: 'leave' } });
  failed = !check(lv, { 'leave 201': (r) => r.status === 201 }) || failed;

  const up = http.post(`${BASE}/api/hr/files`, { file: http.file(PDF, `phieu-${code}.pdf`, 'application/pdf') }, { headers: auth, tags: { step: 'upload' } });
  failed = !check(up, { 'upload 201 stored': (r) => r.status === 201 && r.json('data.stored') === true }) || failed;

  flowDur.add(Date.now() - t0);
  flowErr.add(failed ? 1 : 0);
}
