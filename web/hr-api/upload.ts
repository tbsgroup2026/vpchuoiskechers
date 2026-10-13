export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

type Sig = { ext: string[]; test: (b: Uint8Array) => boolean; mime: string };
const startsWith = (b: Uint8Array, sig: number[]) => sig.every((v, i) => b[i] === v);

const SIGNATURES: Sig[] = [
  { ext: ['pdf'], mime: 'application/pdf', test: (b) => startsWith(b, [0x25, 0x50, 0x44, 0x46, 0x2d]) },
  { ext: ['png'], mime: 'image/png', test: (b) => startsWith(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) },
  { ext: ['jpg', 'jpeg'], mime: 'image/jpeg', test: (b) => startsWith(b, [0xff, 0xd8, 0xff]) },
  { ext: ['docx'], mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', test: (b) => startsWith(b, [0x50, 0x4b, 0x03, 0x04]) },
  { ext: ['xlsx'], mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', test: (b) => startsWith(b, [0x50, 0x4b, 0x03, 0x04]) },
];

export type ValidationResult =
  | { ok: true; ext: string; mime: string; displayName: string }
  | { ok: false; status: 400 | 413 | 415; code: string; message: string };

export function sanitizeDisplayName(name: string): string {
  // giữ tiếng Việt có dấu (NFC), bỏ ký tự điều khiển / đường dẫn
  const base = name.normalize('NFC').split(/[\\/]/).pop() || 'file';
  return base.replace(/[\u0000-\u001f\u007f<>:"|?*]/g, '_').slice(0, 180);
}

export function validateUpload(name: string, bytes: Uint8Array): ValidationResult {
  if (bytes.byteLength === 0) return { ok: false, status: 400, code: 'EMPTY_FILE', message: 'File rỗng' };
  if (bytes.byteLength > MAX_UPLOAD_BYTES) return { ok: false, status: 413, code: 'FILE_TOO_LARGE', message: 'File vượt quá 10MB' };
  const displayName = sanitizeDisplayName(name);
  const ext = (displayName.split('.').pop() || '').toLowerCase();
  const sig = SIGNATURES.find((s) => s.ext.includes(ext));
  if (!sig) return { ok: false, status: 415, code: 'EXT_NOT_ALLOWED', message: `Đuôi .${ext} không được phép` };
  if (!sig.test(bytes)) return { ok: false, status: 415, code: 'CONTENT_MISMATCH', message: 'Nội dung file không khớp với đuôi file' };
  return { ok: true, ext, mime: sig.mime, displayName };
}

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const d = await crypto.subtle.digest('SHA-256', bytes as unknown as BufferSource);
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
