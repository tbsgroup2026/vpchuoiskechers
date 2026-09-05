/**
 * Security Utilities for TBS II Backend
 * - Password hashing and verification
 * - Input validation
 * - Rate limiting helpers
 * - Token blacklist management
 */

// ============================================================
// PASSWORD HASHING (bcrypt-compatible for Cloudflare Workers)
// ============================================================

/**
 * Hash password using SHA-256 (bcrypt alternative for Workers)
 * Note: Use bcryptjs in full Node.js environment for better security
 */
export async function hashPassword(password: string): Promise<string> {
  // Validate password policy
  const validation = validatePasswordPolicy(password);
  if (!validation.valid) {
    throw new Error(`Password policy violation: ${validation.errors.join(', ')}`);
  }

  // Simple SHA-256 hash for demo (REPLACE with bcrypt in production!)
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'TBS_SALT_2026'); // Add salt
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `sha256:${hashHex}`;
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!hash || !password) return false;
  
  try {
    // Handle SHA-256 format
    if (hash.startsWith('sha256:')) {
      const newHash = await hashPassword(password);
      return newHash === hash;
    }
    
    // Handle bcrypt format (if using bcryptjs)
    if (hash.startsWith('$2a$') || hash.startsWith('$2b$')) {
      // TODO: Import bcryptjs and use bcrypt.compare(password, hash)
      console.warn('bcrypt verification not implemented in Workers yet');
      return false;
    }
    
    return false;
  } catch (err) {
    console.error('Password verification error:', err);
    return false;
  }
}

// ============================================================
// PASSWORD POLICY
// ============================================================

interface PasswordValidation {
  valid: boolean;
  errors: string[];
}

export function validatePasswordPolicy(password: string): PasswordValidation {
  const errors: string[] = [];
  
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// ============================================================
// INPUT VALIDATION
// ============================================================

/**
 * Sanitize HTML input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate employee code format
 */
export function validateEmpCode(empCode: string): boolean {
  if (!empCode || typeof empCode !== 'string') return false;
  
  // Allow patterns: 200405004, 202608001, 202206011, etc.
  const pattern = /^[A-ZĐ0-9]{2,10}(-[0-9]{3,6})?$/i;
  return pattern.test(empCode.trim());
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email.trim());
}

/**
 * Check for SQL injection patterns
 */
export function hasSQLInjection(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  
  const sqlPatterns = [
    /(\bOR\b|\bAND\b).*[=<>]/i,
    /UNION.*SELECT/i,
    /DROP.*TABLE/i,
    /INSERT.*INTO/i,
    /DELETE.*FROM/i,
    /UPDATE.*SET/i,
    /EXEC(\s|\()/i,
    /--/,
    /;.*--/,
    /\/\*.*\*\//
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
}

// ============================================================
// TOKEN BLACKLIST
// ============================================================

/**
 * Generate SHA-256 hash of JWT token for blacklist storage
 */
export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Check if token is blacklisted
 */
export async function isTokenBlacklisted(
  token: string, 
  db: any // D1Database type
): Promise<boolean> {
  if (!token || !db) return false;
  
  try {
    const tokenHash = await hashToken(token);
    const { results } = await db.prepare(
      'SELECT 1 FROM token_blacklist WHERE token_hash = ? AND expires_at > datetime("now")'
    ).bind(tokenHash).all();
    
    return results && results.length > 0;
  } catch (err) {
    console.error('Token blacklist check error:', err);
    return false; // Fail open for availability
  }
}

/**
 * Add token to blacklist
 */
export async function blacklistToken(
  token: string,
  empCode: string,
  expiresAt: Date,
  db: any,
  reason: string = 'LOGOUT'
): Promise<void> {
  if (!token || !db) return;
  
  try {
    const tokenHash = await hashToken(token);
    await db.prepare(
      `INSERT INTO token_blacklist (token_hash, emp_code, expires_at, reason, blacklisted_at)
       VALUES (?, ?, ?, ?, datetime("now"))`
    ).bind(tokenHash, empCode, expiresAt.toISOString(), reason).run();
  } catch (err) {
    console.error('Token blacklist insert error:', err);
  }
}

// ============================================================
// RATE LIMITING
// ============================================================

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

/**
 * Check and enforce rate limit
 */
export async function checkRateLimit(
  clientIP: string,
  endpoint: string,
  maxRequests: number = 100,
  windowSeconds: number = 60,
  db: any
): Promise<RateLimitResult> {
  if (!db) {
    // Fail open if DB unavailable
    return { allowed: true, remaining: maxRequests, resetAt: new Date() };
  }
  
  try {
    const windowStart = new Date(Date.now() - windowSeconds * 1000);
    const windowEnd = new Date(Date.now());
    
    // Get current count for this IP + endpoint
    const { results } = await db.prepare(
      `SELECT request_count, window_end 
       FROM rate_limit_log 
       WHERE client_ip = ? AND endpoint = ? 
         AND window_end > datetime("now")`
    ).bind(clientIP, endpoint).all();
    
    if (results && results.length > 0) {
      const record = results[0];
      const count = record.request_count || 0;
      
      if (count >= maxRequests) {
        return {
          allowed: false,
          remaining: 0,
          resetAt: new Date(record.window_end)
        };
      }
      
      // Increment counter
      await db.prepare(
        `UPDATE rate_limit_log 
         SET request_count = request_count + 1 
         WHERE client_ip = ? AND endpoint = ?`
      ).bind(clientIP, endpoint).run();
      
      return {
        allowed: true,
        remaining: maxRequests - count - 1,
        resetAt: new Date(record.window_end)
      };
    }
    
    // Create new rate limit window
    await db.prepare(
      `INSERT INTO rate_limit_log (client_ip, endpoint, request_count, window_start, window_end)
       VALUES (?, ?, 1, ?, ?)`
    ).bind(clientIP, endpoint, windowStart.toISOString(), windowEnd.toISOString()).run();
    
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: windowEnd
    };
    
  } catch (err) {
    console.error('Rate limit check error:', err);
    // Fail open for availability
    return { allowed: true, remaining: maxRequests, resetAt: new Date() };
  }
}

// ============================================================
// ACCOUNT LOCKOUT
// ============================================================

/**
 * Record failed login attempt
 */
export async function recordFailedLogin(
  empCode: string,
  db: any,
  maxAttempts: number = 5,
  lockoutMinutes: number = 30
): Promise<{ locked: boolean; attempts: number }> {
  if (!db || !empCode) return { locked: false, attempts: 0 };
  
  try {
    // Increment failed attempts
    const result = await db.prepare(
      `UPDATE users 
       SET failed_login_attempts = failed_login_attempts + 1,
           locked_until = CASE 
             WHEN failed_login_attempts + 1 >= ? 
             THEN datetime("now", "+${lockoutMinutes} minutes")
             ELSE locked_until
           END
       WHERE emp_code = ?
       RETURNING failed_login_attempts, locked_until`
    ).bind(maxAttempts, empCode).first();
    
    if (result) {
      return {
        locked: result.locked_until && new Date(result.locked_until) > new Date(),
        attempts: result.failed_login_attempts || 0
      };
    }
    
    return { locked: false, attempts: 0 };
  } catch (err) {
    console.error('Failed login recording error:', err);
    return { locked: false, attempts: 0 };
  }
}

/**
 * Check if account is locked
 */
export async function isAccountLocked(empCode: string, db: any): Promise<boolean> {
  if (!db || !empCode) return false;
  
  try {
    const result = await db.prepare(
      `SELECT locked_until FROM users 
       WHERE emp_code = ? AND locked_until > datetime("now")`
    ).bind(empCode).first();
    
    return !!result;
  } catch (err) {
    console.error('Account lock check error:', err);
    return false;
  }
}

/**
 * Reset failed login attempts on successful login
 */
export async function resetFailedLogins(empCode: string, db: any): Promise<void> {
  if (!db || !empCode) return;
  
  try {
    await db.prepare(
      `UPDATE users 
       SET failed_login_attempts = 0, locked_until = NULL 
       WHERE emp_code = ?`
    ).bind(empCode).run();
  } catch (err) {
    console.error('Failed login reset error:', err);
  }
}

// ============================================================
// SECURITY HEADERS
// ============================================================

export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.cloudinary.com https://api.groq.com"
  };
}

// ============================================================
// DEPARTMENT FILTERING (Fix data leakage)
// ============================================================

/**
 * Add department filter to WHERE clause for non-executive users
 */
export function addDepartmentFilter(
  user: { isExecutiveOrAdmin: boolean; departmentId?: number | null },
  baseQuery: string,
  params: any[]
): { query: string; params: any[] } {
  // Executives see all data
  if (user.isExecutiveOrAdmin) {
    return { query: baseQuery, params };
  }
  
  // Add department filter
  const whereClause = baseQuery.includes('WHERE') ? ' AND ' : ' WHERE ';
  const newQuery = baseQuery + whereClause + 'department_id = ?';
  const newParams = [...params, user.departmentId || 0];
  
  return { query: newQuery, params: newParams };
}
