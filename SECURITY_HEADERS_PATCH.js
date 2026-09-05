/**
 * SECURITY HEADERS PATCH FOR _worker.js
 * 
 * Add this code at the top of handleRequest() function in _worker.js
 * after line 13: "async handleRequest(request, env, ctx) {"
 */

// ============================================================
// ENHANCED SECURITY HEADERS (Production-Ready)
// ============================================================

/**
 * Get comprehensive security headers for all responses
 * Meets security.headers.com Grade A+ requirements
 */
function getSecurityHeaders() {
  return {
    // Strict-Transport-Security (HSTS)
    // Force HTTPS for 1 year, including all subdomains
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    
    // Content-Security-Policy (CSP)
    // Comprehensive CSP to prevent XSS, clickjacking, and other injection attacks
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://api.cloudinary.com https://api.groq.com wss://vpchuoiskechers.tbsgroup2026.workers.dev",
      "media-src 'self' https:",
      "object-src 'none'",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests"
    ].join('; '),
    
    // X-Frame-Options
    // Prevent clickjacking by disallowing iframe embedding from other origins
    'X-Frame-Options': 'SAMEORIGIN',
    
    // X-Content-Type-Options
    // Prevent MIME-sniffing attacks
    'X-Content-Type-Options': 'nosniff',
    
    // X-XSS-Protection
    // Legacy XSS filter (modern browsers use CSP instead)
    'X-XSS-Protection': '1; mode=block',
    
    // Referrer-Policy
    // Control referrer information sent with requests
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Permissions-Policy (formerly Feature-Policy)
    // Disable unused browser features to reduce attack surface
    'Permissions-Policy': [
      'geolocation=()',
      'microphone=()',
      'camera=()',
      'payment=()',
      'usb=()',
      'magnetometer=()',
      'gyroscope=()',
      'accelerometer=()',
      'ambient-light-sensor=()',
      'autoplay=(self)',
      'encrypted-media=(self)',
      'fullscreen=(self)',
      'picture-in-picture=(self)'
    ].join(', '),
    
    // X-DNS-Prefetch-Control
    // Control DNS prefetching to prevent potential privacy leaks
    'X-DNS-Prefetch-Control': 'off',
    
    // X-Download-Options
    // Prevent IE from executing downloads in site's context
    'X-Download-Options': 'noopen',
    
    // X-Permitted-Cross-Domain-Policies
    // Restrict Adobe Flash and PDF cross-domain requests
    'X-Permitted-Cross-Domain-Policies': 'none',
    
    // Cross-Origin-Embedder-Policy (COEP)
    // Prevent loading cross-origin resources without explicit permission
    'Cross-Origin-Embedder-Policy': 'require-corp',
    
    // Cross-Origin-Opener-Policy (COOP)
    // Isolate browsing context from cross-origin windows
    'Cross-Origin-Opener-Policy': 'same-origin',
    
    // Cross-Origin-Resource-Policy (CORP)
    // Control who can load resources
    'Cross-Origin-Resource-Policy': 'same-origin'
  };
}

/**
 * Apply security headers to any Response object
 */
function applySecurityHeaders(response) {
  const headers = new Headers(response.headers);
  const securityHeaders = getSecurityHeaders();
  
  // Apply all security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });
  
  // Create new response with security headers
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

/**
 * Create JSON response with security headers
 */
function secureJsonResponse(data, status = 200) {
  const response = new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...getSecurityHeaders()
    }
  });
  
  return response;
}

/**
 * Create error response with security headers
 */
function secureErrorResponse(message, status = 500) {
  return secureJsonResponse({ error: message }, status);
}

// ============================================================
// USAGE EXAMPLES
// ============================================================

/*
// Example 1: Wrap existing Response
const response = await fetch(...);
return applySecurityHeaders(response);

// Example 2: JSON API Response
return secureJsonResponse({ 
  success: true, 
  data: results 
}, 200);

// Example 3: Error Response
return secureErrorResponse('Invalid input', 400);

// Example 4: Static Asset with Security Headers
return applySecurityHeaders(
  new Response(fileContent, {
    headers: { 'Content-Type': 'text/html' }
  })
);
*/

// ============================================================
// INTEGRATION INSTRUCTIONS
// ============================================================

/*
STEP 1: Add these functions to the top of _worker.js, 
        right after the handleRequest() function declaration.

STEP 2: Replace ALL Response creation with secure versions:

❌ OLD:
return new Response(JSON.stringify({ data }), {
  headers: { "Content-Type": "application/json" }
});

✅ NEW:
return secureJsonResponse({ data });

❌ OLD:
return new Response(JSON.stringify({ error: "Unauthorized" }), { 
  status: 401 
});

✅ NEW:
return secureErrorResponse("Unauthorized", 401);

STEP 3: For static assets (HTML, CSS, JS), wrap the response:

❌ OLD:
return env.ASSETS.fetch(request);

✅ NEW:
const assetResponse = await env.ASSETS.fetch(request);
return applySecurityHeaders(assetResponse);

STEP 4: Test security headers:
curl -I https://vpchuoiskechers.tbsgroup2026.workers.dev

Expected output should include:
✓ strict-transport-security: max-age=31536000; includeSubDomains; preload
✓ content-security-policy: default-src 'self'; ...
✓ x-frame-options: SAMEORIGIN
✓ x-content-type-options: nosniff
✓ referrer-policy: strict-origin-when-cross-origin
✓ permissions-policy: geolocation=(), ...

STEP 5: Test on https://securityheaders.com
Should achieve Grade A or A+
*/

// ============================================================
// SECURITY HEADERS TESTING CHECKLIST
// ============================================================

/*
□ Strict-Transport-Security present with max-age >= 31536000
□ Content-Security-Policy present and comprehensive
□ X-Frame-Options set to DENY or SAMEORIGIN
□ X-Content-Type-Options set to nosniff
□ Referrer-Policy set to strict-origin-when-cross-origin or stricter
□ Permissions-Policy present and restrictive
□ No sensitive data in response headers (server version, etc.)
□ CORS configured properly (if needed)
□ CSP doesn't use 'unsafe-inline' or 'unsafe-eval' (except where absolutely necessary)
□ All API endpoints return security headers
□ Static assets return security headers
*/

// ============================================================
// CSP VIOLATION REPORTING (Optional)
// ============================================================

/*
To enable CSP violation reporting, add to CSP header:

"report-uri /api/csp-report"

Then create an endpoint to log violations:

if (url.pathname === "/api/csp-report" && request.method === "POST") {
  try {
    const violation = await request.json();
    console.warn("CSP Violation:", JSON.stringify(violation));
    
    // Optionally store in database
    if (env.DB) {
      await env.DB.prepare(
        `INSERT INTO security_logs (type, data, created_at) 
         VALUES ('CSP_VIOLATION', ?, datetime('now'))`
      ).bind(JSON.stringify(violation)).run();
    }
    
    return new Response('', { status: 204 });
  } catch (err) {
    return new Response('', { status: 400 });
  }
}
*/

// ============================================================
// EXPORT FOR TESTING
// ============================================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getSecurityHeaders,
    applySecurityHeaders,
    secureJsonResponse,
    secureErrorResponse
  };
}
