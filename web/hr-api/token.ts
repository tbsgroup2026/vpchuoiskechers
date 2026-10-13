/**
 * Token HS256 (JWT) ký bằng HMAC - dùng WebCrypto, chạy được trên Workers và Node.
 * Secret lấy từ env.HR_JWT_SECRET (Cloudflare secret). Không có secret → từ chối mọi token.
 */
const enc = new TextEncoder();

function b64url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlToBytes(str: string): Uint8Array {
  const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4));
  const bin = atob(str.replace(/-/g, '+').replace(/_/g, '/') + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacKey(secret: string, usage: 'sign' | 'verify') {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [usage]);
}

export interface HrTokenPayload {
  sub: string; // empCode
  iat: number;
  exp: number;
}

export async function signHrToken(empCode: string, secret: string, ttlSeconds = 8 * 3600): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(enc.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const body = b64url(enc.encode(JSON.stringify({ sub: empCode, iat: now, exp: now + ttlSeconds })));
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(secret, 'sign'), enc.encode(`${header}.${body}`));
  return `${header}.${body}.${b64url(sig)}`;
}

export async function verifyHrToken(token: string | null | undefined, secret: string | undefined): Promise<HrTokenPayload | null> {
  if (!token || !secret) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const header = JSON.parse(new TextDecoder().decode(b64urlToBytes(parts[0])));
    if (header.alg !== 'HS256') return null; // chặn alg:none / đổi thuật toán
    const ok = await crypto.subtle.verify(
      'HMAC',
      await hmacKey(secret, 'verify'),
      b64urlToBytes(parts[2]),
      enc.encode(`${parts[0]}.${parts[1]}`)
    );
    if (!ok) return null;
    const payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(parts[1]))) as HrTokenPayload;
    if (!payload.sub || typeof payload.exp !== 'number') return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
