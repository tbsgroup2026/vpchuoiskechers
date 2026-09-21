/**
 * Unit Test Suite for Audit Log Deep Sanitization (sanitizeDeep)
 */

const SENSITIVE_KEYS = new Set([
  'password',
  'pass',
  'token',
  'secret',
  'access_token',
  'refresh_token',
  'authorization',
  'private_key',
  'gdrive_private_key',
  'cvv',
  'pin',
  'api_key',
  'apikey',
  'credentials',
  'bearer',
  'auth_token'
]);

function sanitizeDeep(data, visited = new WeakSet()) {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data !== 'object') {
    return data;
  }

  if (visited.has(data)) {
    return '[CIRCULAR]';
  }
  visited.add(data);

  if (Array.isArray(data)) {
    return data.map(item => sanitizeDeep(item, visited));
  }

  if (data instanceof Date) {
    return data.toISOString();
  }

  const sanitized = {};

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    
    const isSensitive = SENSITIVE_KEYS.has(lowerKey) || 
      lowerKey.includes('password') || 
      lowerKey.includes('secret') || 
      lowerKey.includes('private_key');

    if (isSensitive && (typeof value !== 'object' || value === null)) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeDeep(value, visited);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

async function main() {
  console.log("=================================================");
  console.log("  RUNNING AUDIT LOG SANITIZER UNIT TEST SUITE    ");
  console.log("=================================================\n");

  // Test 1: Simple Object with Password
  const input1 = { username: 'admin', password: 'SuperSecret123!' };
  const output1 = sanitizeDeep(input1);
  assert(output1.username === 'admin', 'Non-sensitive field username preserved');
  assert(output1.password === '[REDACTED]', 'Sensitive password field redacted at top level');

  // Test 2: Deeply Nested Object
  const input2 = {
    metadata: {
      user: {
        emp_code: '202608001',
        credentials: {
          password: 'HiddenPassword',
          access_token: 'Bearer eyJhbGciOi...',
          refresh_token: 'rt_998877'
        },
        private_key: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBg...'
      }
    }
  };
  const output2 = sanitizeDeep(input2);
  assert(output2.metadata.user.emp_code === '202608001', 'Nested emp_code preserved');
  assert(output2.metadata.user.credentials.password === '[REDACTED]', 'Deeply nested password redacted');
  assert(output2.metadata.user.credentials.access_token === '[REDACTED]', 'Deeply nested access_token redacted');
  assert(output2.metadata.user.credentials.refresh_token === '[REDACTED]', 'Deeply nested refresh_token redacted');
  assert(output2.metadata.user.private_key === '[REDACTED]', 'Deeply nested private_key redacted');

  // Test 3: Array of Objects
  const input3 = [
    { id: 1, gdrive_private_key: 'PEM123' },
    { id: 2, token: 'xyz' },
    { id: 3, name: 'Normal Item' }
  ];
  const output3 = sanitizeDeep(input3);
  assert(output3[0].gdrive_private_key === '[REDACTED]', 'Array item 0 gdrive_private_key redacted');
  assert(output3[1].token === '[REDACTED]', 'Array item 1 token redacted');
  assert(output3[2].name === 'Normal Item', 'Array item 2 non-sensitive name preserved');

  // Test 4: Circular References
  const circularObj = { name: 'Circular Test' };
  circularObj.self = circularObj;
  const output4 = sanitizeDeep(circularObj);
  assert(output4.name === 'Circular Test', 'Circular object property preserved');
  assert(output4.self === '[CIRCULAR]', 'Circular reference safely caught without stack overflow');

  // Test 5: Edge cases (null, undefined, primitives)
  assert(sanitizeDeep(null) === null, 'null input returns null');
  assert(sanitizeDeep(undefined) === undefined, 'undefined input returns undefined');
  assert(sanitizeDeep('text') === 'text', 'primitive string returns string');
  assert(sanitizeDeep(12345) === 12345, 'primitive number returns number');

  console.log("\n=================================================");
  console.log("  ALL AUDIT LOG SANITIZER TESTS PASSED (5/5)!   ");
  console.log("=================================================");
}

main().catch(err => {
  console.error("Test suite execution failed:", err);
  process.exit(1);
});
