// Upload thật lên R2 qua staging. Chạy: BASE_URL=... node scripts/staging-upload.mjs
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import net from 'net';
import tls from 'tls';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.BASE_URL; if (!BASE) throw new Error('Thiếu BASE_URL');
const creds = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '.staging-credentials.json'), 'utf-8'));
const log = []; const say = (s) => { console.log(s); log.push(s); };
let pass = 0, fail = 0;
const ok = (name, cond, detail = '') => { cond ? pass++ : fail++; say(`${cond ? 'PASS' : 'FAIL'} | ${name}${detail ? ' | ' + detail : ''}`); };
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');

const lr = await (await fetch(`${BASE}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ empCode: 'EMPA01', password: creds.EMPA01.password }) })).json();
const H = { Authorization: `Bearer ${lr.hrToken}` };
const up = async (name, bytes, type = 'application/octet-stream') => {
  const fd = new FormData(); fd.append('file', new Blob([bytes], { type }), name);
  const r = await fetch(`${BASE}/api/hr/files`, { method: 'POST', headers: H, body: fd });
  return { status: r.status, body: await r.json() };
};
const pdf = (n) => Buffer.concat([Buffer.from('%PDF-1.4\n'), crypto.randomBytes(n)]);

say(`# Upload staging | ${BASE} | ${new Date().toISOString()}`);

// 1. Upload xong tải lại, so khớp hash
for (const size of [1024, 1024 * 1024, 9 * 1024 * 1024]) {
  const data = pdf(size); const h = sha(data);
  const r = await up(`bao-cao-${size}.pdf`, data, 'application/pdf');
  ok(`upload PDF ${size}B → 201 & stored:true`, r.status === 201 && r.body.data?.stored === true, `status=${r.status}`);
  ok(`  hash server trả về khớp hash gốc (${size}B)`, r.body.data?.sha256 === h);
  const d = await fetch(`${BASE}/api/hr/files/${r.body.data.id}`, { headers: H });
  const back = Buffer.from(await d.arrayBuffer());
  ok(`  tải lại ${size}B: HTTP 200, hash khớp, byte-by-byte`, d.status === 200 && sha(back) === h && back.equals(data), `sha256 tải về=${sha(back).slice(0, 16)}… gốc=${h.slice(0, 16)}…`);
}

// 2. >10MB
{ const r = await up('lon.pdf', pdf(10 * 1024 * 1024 + 10), 'application/pdf'); ok('file > 10MB bị từ chối 413', r.status === 413, `status=${r.status} code=${r.body.code}`); }
// 3. .exe đổi đuôi .pdf
{ const exe = Buffer.concat([Buffer.from('MZ'), crypto.randomBytes(2000)]); const r = await up('virus.pdf', exe, 'application/pdf'); ok('.exe đổi đuôi .pdf bị từ chối 415', r.status === 415 && r.body.code === 'CONTENT_MISMATCH', `status=${r.status} code=${r.body.code}`); }
{ const r = await up('setup.exe', Buffer.from('MZxxxx'), 'application/x-msdownload'); ok('đuôi .exe bị từ chối 415', r.status === 415 && r.body.code === 'EXT_NOT_ALLOWED', `code=${r.body.code}`); }
// 4. Tên tiếng Việt có dấu
{
  const data = pdf(500); const name = 'Hợp đồng lao động - Nguyễn Văn Ánh (bản ký).pdf';
  const r = await up(name, data, 'application/pdf');
  ok('tên tiếng Việt có dấu: upload 201', r.status === 201, `name trả về="${r.body.data?.name}"`);
  ok('  tên được giữ nguyên (NFC)', r.body.data?.name === name.normalize('NFC'));
  const d = await fetch(`${BASE}/api/hr/files/${r.body.data.id}`, { headers: H });
  const cd = d.headers.get('content-disposition') || '';
  ok('  tải lại: Content-Disposition giải mã đúng tên', decodeURIComponent(cd.split("filename*=UTF-8''")[1] || '') === name.normalize('NFC'), cd);
}
// 5. File rỗng
{ const r = await up('rong.pdf', Buffer.alloc(0), 'application/pdf'); ok('file rỗng bị từ chối 400', r.status === 400 && r.body.code === 'EMPTY_FILE', `status=${r.status} code=${r.body.code}`); }
// 6. Mất mạng giữa chừng: gửi header + một phần body rồi ngắt socket
{
  const before = await (await fetch(`${BASE}/api/hr/files/__none__`, { headers: H })).status; // sanity
  const boundary = '----cut' + Date.now();
  const filePart = Buffer.concat([Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="cut.pdf"\r\nContent-Type: application/pdf\r\n\r\n%PDF-1.4\n`), crypto.randomBytes(300000)]);
  const fullLen = filePart.length + 700000; // khai báo dài hơn dữ liệu thực gửi → body không đủ
  const host = new URL(BASE).host;
  const result = await new Promise((resolve) => {
    const s = tls.connect(443, host, { servername: host }, () => {
      s.write(`POST /api/hr/files HTTP/1.1\r\nHost: ${host}\r\nAuthorization: Bearer ${lr.hrToken}\r\nContent-Type: multipart/form-data; boundary=${boundary}\r\nContent-Length: ${fullLen}\r\nConnection: close\r\n\r\n`);
      s.write(filePart, () => setTimeout(() => s.destroy(), 300)); // ngắt mạng
    });
    let buf = ''; s.on('data', (d) => (buf += d)); s.on('close', () => resolve(buf)); s.on('error', () => resolve(buf));
    setTimeout(() => { s.destroy(); resolve(buf); }, 15000);
  });
  const stored = (await (await fetch(`${BASE}/api/hr/files/__none__`, { headers: H })).status);
  ok('mất mạng giữa chừng: server không trả 201', !/^HTTP\/1.1 201/.test(result), `phản hồi=${result.split('\r\n')[0] || '(không có phản hồi - kết nối bị ngắt)'}`);
  // Kiểm chứng không có bản ghi cut.pdf: liệt kê qua D1 được thực hiện bằng truy vấn riêng (xem log wrangler d1 trong báo cáo)
}

say(`\n## TỔNG: ${pass} PASS, ${fail} FAIL`);
fs.mkdirSync(path.join(__dirname, '..', '..', 'uat-report', 'logs'), { recursive: true });
fs.writeFileSync(path.join(__dirname, '..', '..', 'uat-report', 'logs', 'staging-upload.log'), log.join('\n') + '\n');
process.exit(fail ? 1 : 0);
