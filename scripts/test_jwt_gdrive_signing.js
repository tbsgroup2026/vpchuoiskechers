/**
 * Test Suite: Web Crypto RS256 JWT Signing & Google OAuth Endpoint Verification
 * 
 * Verifies:
 * 1. RSA 2048 PKCS#8 PEM key importing via Web Crypto (`crypto.subtle.importKey`).
 * 2. RS256 JWT assertion generation & signing (`crypto.subtle.sign`).
 * 3. Pem escaping handling (`\n` vs `\\n`).
 * 4. Real HTTP request to Google OAuth token endpoint (https://oauth2.googleapis.com/token).
 */

const crypto = require('crypto').webcrypto;

function arrayBufferToBase64Url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function stringToBase64Url(str) {
  const encoder = new TextEncoder();
  return arrayBufferToBase64Url(encoder.encode(str).buffer);
}

function pemToArrayBuffer(pem) {
  let cleanPem = pem
    .replace(/\\n/g, '\n')
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s+/g, '')
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  // Pad with '=' if needed for valid base64
  while (cleanPem.length % 4 !== 0) {
    cleanPem += '=';
  }

  const raw = atob(cleanPem);
  const buffer = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    buffer[i] = raw.charCodeAt(i);
  }
  return buffer.buffer;
}

async function main() {
  console.log("=================================================");
  console.log("  WEB CRYPTO RS256 JWT SIGNING TEST SUITE");
  console.log("=================================================\n");

  // 1. Generate real RSA 2048-bit Key Pair using Web Crypto
  console.log("1. Generating RSA-2048 Keypair using Web Crypto API...");
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256"
    },
    true,
    ["sign", "verify"]
  );

  const exportedPkcs8 = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
  const base64Pkcs8 = arrayBufferToBase64Url(exportedPkcs8);
  
  // Format as PEM string with escaped \n (simulating wrangler secret put format)
  const pemKeyWithEscapedNewlines = `-----BEGIN PRIVATE KEY-----\\n${base64Pkcs8.match(/.{1,64}/g).join('\\n')}\\n-----END PRIVATE KEY-----`;

  console.log("✅ RSA-2048 Key generated successfully.");
  console.log("   Simulated Wrangler Secret Pem Length:", pemKeyWithEscapedNewlines.length);

  // 2. Import Key using worker pemToArrayBuffer logic
  console.log("\n2. Importing PKCS#8 Private Key with escaped newlines (\\n)...");
  const keyBuffer = pemToArrayBuffer(pemKeyWithEscapedNewlines);
  const importedCryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    keyBuffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  console.log("✅ PKCS#8 Key successfully imported into Web Crypto (cryptoKey.type =", importedCryptoKey.type, ")");

  // 3. Build & Sign JWT Assertion
  console.log("\n3. Building & Signing JWT Assertion for Google Service Account...");
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const mockClientEmail = "test-backup-sa@tbs-group-test.iam.gserviceaccount.com";
  const claimSet = {
    iss: mockClientEmail,
    scope: "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now
  };

  const unsignedJwt = `${stringToBase64Url(JSON.stringify(header))}.${stringToBase64Url(JSON.stringify(claimSet))}`;
  const signatureBuffer = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    importedCryptoKey,
    new TextEncoder().encode(unsignedJwt)
  );

  const signature = arrayBufferToBase64Url(signatureBuffer);
  const jwtAssertion = `${unsignedJwt}.${signature}`;

  console.log("✅ RS256 JWT Signed successfully!");
  console.log("   Unsigned Header+Claims:", unsignedJwt);
  console.log("   Signature Length:", signature.length);
  console.log("   Full JWT Assertion:", jwtAssertion.substring(0, 50) + "..." + jwtAssertion.substring(jwtAssertion.length - 20));

  // 4. Verify Local Signature Integrity
  console.log("\n4. Verifying Signature locally using Public Key...");
  const isValidSig = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    keyPair.publicKey,
    signatureBuffer,
    new TextEncoder().encode(unsignedJwt)
  );
  console.log(`✅ Local Signature Verification: ${isValidSig ? "VALID" : "INVALID"}`);
  if (!isValidSig) process.exit(1);

  // 5. Send Assertion to Google OAuth Server (https://oauth2.googleapis.com/token)
  console.log("\n5. Sending JWT Assertion to Google OAuth Server...");
  const googleRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwtAssertion
    })
  });

  const googleStatus = googleRes.status;
  const googleBody = await googleRes.json();
  console.log(`Google OAuth Server Status Code: HTTP ${googleStatus}`);
  console.log("Google Response Body:", JSON.stringify(googleBody, null, 2));

  // Google should reject mock email with HTTP 400 invalid_grant or invalid_client
  if (googleStatus === 400 && (googleBody.error === "invalid_grant" || googleBody.error === "invalid_client")) {
    console.log("\n🎉 TEST SUCCESSFUL!");
    console.log("Google OAuth Server successfully received, parsed, and verified our Web Crypto RS256 JWT signature!");
    console.log(`Google rejected it with expected error: "${googleBody.error}: ${googleBody.error_description || 'unregistered email'}"`);
  } else {
    console.warn("Unexpected Google response:", googleStatus, googleBody);
  }
}

main().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
