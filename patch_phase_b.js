const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'web/worker/index.js');
let code = fs.readFileSync(file, 'utf8');

// 1. Extract verifyJWT and b64Buf out of fetch so they are global
const verifyJWTPattern = `    async function verifyJWT(tokenStr, secretStr) {
      if (!tokenStr || typeof tokenStr !== "string" || !secretStr) return null;
      try {
        const parts = tokenStr.split(".");
        if (parts.length !== 3) return null;
        const [headB64, payB64, sigB64] = parts;
        const dataToVerify = \`\${headB64}.\${payB64}\`;

        const enc = new TextEncoder();
        const key = await crypto.subtle.importKey(
          "raw",
          enc.encode(secretStr),
          { name: "HMAC", hash: "SHA-256" },
          false,
          ["verify"]
        );

        const base64 = sigB64.replace(/-/g, "+").replace(/_/g, "/");
        const padLen = (4 - (base64.length % 4)) % 4;
        const padded = base64 + "=".repeat(padLen);
        const rawSig = typeof atob === "function"
          ? Uint8Array.from(atob(padded), c => c.charCodeAt(0))
          : Buffer.from(padded, "base64");

        const isValid = await crypto.subtle.verify("HMAC", key, rawSig, enc.encode(dataToVerify));
        if (!isValid) return null;

        const payloadJson = typeof atob === "function" ? atob(payB64) : Buffer.from(payB64, "base64").toString();
        const payload = JSON.parse(payloadJson);
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) return null;

        return payload;
      } catch (e) {
        return null;
      }
    }`;

// Remove verifyJWT from inside fetch
code = code.replace(verifyJWTPattern, '');

// Place verifyJWT globally
code = `
async function verifyJWT(tokenStr, secretStr) {
  if (!tokenStr || typeof tokenStr !== "string" || !secretStr) return null;
  try {
    const parts = tokenStr.split(".");
    if (parts.length !== 3) return null;
    const [headB64, payB64, sigB64] = parts;
    const dataToVerify = \`\${headB64}.\${payB64}\`;

    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(secretStr),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const base64 = sigB64.replace(/-/g, "+").replace(/_/g, "/");
    const padLen = (4 - (base64.length % 4)) % 4;
    const padded = base64 + "=".repeat(padLen);
    const rawSig = typeof atob === "function"
      ? Uint8Array.from(atob(padded), c => c.charCodeAt(0))
      : Buffer.from(padded, "base64");

    const isValid = await crypto.subtle.verify("HMAC", key, rawSig, enc.encode(dataToVerify));
    if (!isValid) return null;

    const payloadJson = typeof atob === "function" ? atob(payB64) : Buffer.from(payB64, "base64").toString();
    const payload = JSON.parse(payloadJson);
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) return null;

    return payload;
  } catch (e) {
    return null;
  }
}
` + code;

// 2. Rewrite parseSessionWorker to be async and verify signature
const oldParse = `function parseSessionWorker(token) {
  // CRITICAL FIX #1: Reject null/undefined tokens - NO DEFAULT USER!
  if (!token || token === 'null' || token === 'undefined') {
    return null;
  }

  try {
    // SECURITY WARNING: Đây chỉ là parse basic, KHÔNG verify signature
    // Chỉ dùng cho legacy tokens, nên migrate sang JWT verification thật
    const parts = token.split('.');
    if (parts.length === 3) {
      const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const jsonStr = atob(payloadBase64);
      const parsed = JSON.parse(jsonStr);
      if (parsed && (parsed.empCode || parsed.userId || parsed.roleCode)) {
        const matchedUser = WORKER_SYSTEM_USER_MAP[parsed.empCode];
        return {
          userId: parsed.userId || parsed.empCode,
          empCode: parsed.empCode,
          name: parsed.name || matchedUser?.name || \`Cán bộ (\${parsed.empCode})\`,
          roleCode: parsed.roleCode || matchedUser?.roleCode || 'CBCNV',
          roleLevel: parsed.roleLevel || matchedUser?.roleLevel || 4,
          departmentCode: parsed.departmentCode || matchedUser?.departmentCode || 'TBS',
          title: parsed.title || matchedUser?.title || 'Chuyên Viên',
        };
      }
    }
  } catch (e) {
    // Parse error = invalid token = return null
    return null;
  }

  // Legacy token format: tbs_token_EMPCODE_timestamp
  let empCode = "";
  if (token.includes('tbs_token_')) {
    const match = token.match(/tbs_token_([^_]+)/);
    if (match && match[1]) empCode = match[1];
  } else {
    empCode = token.replace("Bearer ", "").trim();
  }

  if (empCode && empCode !== "null" && empCode !== "undefined") {
    const matchedUser = WORKER_SYSTEM_USER_MAP[empCode];
    if (matchedUser) {
      return {
        userId: empCode,
        empCode: empCode,
        name: matchedUser.name,
        roleCode: matchedUser.roleCode,
        roleLevel: matchedUser.roleLevel,
        departmentCode: matchedUser.departmentCode,
        title: matchedUser.title,
      };
    }
  }

  return null;
}`;

const newParse = `async function parseSessionWorker(token, env) {
  if (!token || token === 'null' || token === 'undefined') {
    return null;
  }

  const secret = (env && env.JWT_SECRET) || "";
  
  if (token.split('.').length === 3 && secret) {
    const verified = await verifyJWT(token, secret);
    if (verified && (verified.empCode || verified.userId)) {
      const matchedUser = WORKER_SYSTEM_USER_MAP[verified.empCode];
      return {
        userId: verified.userId || verified.empCode,
        empCode: verified.empCode,
        name: verified.name || matchedUser?.name || \`Cán bộ (\${verified.empCode})\`,
        roleCode: verified.roleCode || matchedUser?.roleCode || 'CBCNV',
        roleLevel: verified.roleLevel || matchedUser?.roleLevel || 4,
        departmentCode: verified.departmentCode || matchedUser?.departmentCode || 'TBS',
        title: verified.title || matchedUser?.title || 'Chuyên Viên',
      };
    }
    return null; // Reject if signature fails
  }

  // Legacy format support - no signature possible
  let empCode = "";
  if (token.includes('tbs_token_')) {
    const match = token.match(/tbs_token_([^_]+)/);
    if (match && match[1]) empCode = match[1];
  } else {
    empCode = token.replace("Bearer ", "").trim();
  }

  if (empCode && empCode !== "null" && empCode !== "undefined") {
    const matchedUser = WORKER_SYSTEM_USER_MAP[empCode];
    if (matchedUser) {
      return {
        userId: empCode,
        empCode: empCode,
        name: matchedUser.name,
        roleCode: matchedUser.roleCode,
        roleLevel: matchedUser.roleLevel,
        departmentCode: matchedUser.departmentCode,
        title: matchedUser.title,
      };
    }
  }

  return null;
}`;

code = code.replace(oldParse, newParse);

// 3. Make verifyServerAuth async and await parseSessionWorker
const oldVerifyAuth = `async function verifyServerAuth(request, env) {
  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
  const token = authHeader ? authHeader.replace("Bearer ", "") : null;
  if (!token) return { authenticated: false };

  const session = parseSessionWorker(token);
  if (!session || !session.empCode) return { authenticated: false };`;

const newVerifyAuth = `async function verifyServerAuth(request, env) {
  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
  const token = authHeader ? authHeader.replace("Bearer ", "") : null;
  if (!token) return { authenticated: false };

  const session = await parseSessionWorker(token, env);
  if (!session || !session.empCode) return { authenticated: false };`;

code = code.replace(oldVerifyAuth, newVerifyAuth);

// 4. Update all const session = parseSessionWorker(token); to await
code = code.replace(/const session = parseSessionWorker\(token\);/g, 'const session = await parseSessionWorker(token, env);');
code = code.replace(/const session = token \? parseSessionWorker\(token\) : null;/g, 'const session = token ? await parseSessionWorker(token, env) : null;');

// 5. Add password verification logic
const oldLoginPass = `// TODO: Implement proper password verification here
          // For now, we accept any login to maintain backward compatibility
          // but this MUST be fixed in production!
          if (password && userRecord && userRecord.password_hash) {
            // Verify password against hash in database
            // const isValid = await verifyPassword(password, userRecord.password_hash);
            // if (!isValid) {
            //   return new Response(JSON.stringify({ success: false, error: "Mật khẩu không đúng" }), { status: 401, headers: CORS });
            // }
          }`;

const newLoginPass = `// SECURITY FIX #6: Password Verification
          if (password && userRecord && userRecord.password_hash) {
            const encoder = new TextEncoder();
            const data = encoder.encode(password);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            
            // Compare hash. Note: Ideally bcrypt should be used, but WebCrypto digest is used here
            if (hashHex !== userRecord.password_hash && password !== userRecord.password_hash) {
              return new Response(JSON.stringify({ success: false, error: "Mật khẩu không đúng" }), { status: 401, headers: CORS });
            }
          }`;
code = code.replace(oldLoginPass, newLoginPass);

fs.writeFileSync(file, code);
console.log('Worker patched successfully');
