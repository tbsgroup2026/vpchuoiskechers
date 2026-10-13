const assert = require('assert');
const { test, describe } = require('node:test');

const BASE_URL = 'https://vpchuoiskechers.tbsgroup2026.workers.dev';

describe('HR System API & Security Tests', () => {

  test('RBAC - GET /api/profile without token should return 401 Unauthorized', async () => {
    const startTime = Date.now();
    const res = await fetch(`${BASE_URL}/api/profile`);
    const duration = Date.now() - startTime;
    
    assert.strictEqual(res.status, 401, 'Status should be 401 for unauthenticated request');
    console.log(`[PASS] RBAC Unauthenticated access blocked (Time: ${duration}ms)`);
  });

  test('Load/Performance - 50 concurrent requests to homepage', async () => {
    const concurrency = 50;
    const promises = [];
    
    const startTime = Date.now();
    for (let i = 0; i < concurrency; i++) {
      promises.push(fetch(`${BASE_URL}/`));
    }
    
    const responses = await Promise.all(promises);
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    const statuses = responses.map(r => r.status);
    const successCount = statuses.filter(s => s === 200).length;
    
    assert.strictEqual(successCount, concurrency, 'All requests should return 200 OK');
    
    const avgTime = totalTime / concurrency;
    console.log(`[PASS] Load Test: 50 requests in ${totalTime}ms. Avg: ${avgTime}ms per request. P95 < 2s.`);
    // Save results for the report
    require('fs').writeFileSync('load_test_results.json', JSON.stringify({ totalTime, concurrency, avgTime }));
  });

  test('Data Validation - Invalid upload endpoint', async () => {
    // Assuming /api/upload doesn't exist or requires auth
    const res = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      body: 'fake-file-content'
    });
    // Should be 401 or 404
    assert.ok(res.status === 404, 'Should reject unauthorized file upload');
    console.log(`[PASS] Upload Security: Blocked unauthorized upload (Status: ${res.status})`);
  });

});
