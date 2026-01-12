/**
 * CSRF Protection Utilities
 * Implements CSRF token generation, validation, and management
 */

/**
 * Generate a CSRF token
 * Should be called on the backend and stored in an HTTP-only cookie
 * @returns {string} CSRF token
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Get CSRF token from meta tag
 * The token should be injected into the HTML by the backend
 * @returns {string | null} CSRF token or null if not found
 */
export function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  
  const meta = document.querySelector('meta[name="csrf-token"]');
  return meta?.getAttribute('content') || null;
}

/**
 * Add CSRF token to request headers
 * @param {HeadersInit} headers - Existing headers
 * @returns {HeadersInit} Headers with CSRF token
 */
export function addCsrfTokenToHeaders(headers: HeadersInit = {}): HeadersInit {
  const token = getCsrfToken();
  if (!token) {
    console.warn('CSRF token not found. Make sure it\'s injected in the HTML meta tag.');
    return headers;
  }

  return {
    ...headers,
    'X-CSRF-Token': token,
  };
}

/**
 * Make a secure fetch request with CSRF protection
 * @param {string} url - Request URL
 * @param {RequestInit} options - Fetch options
 * @returns {Promise<Response>} Fetch response
 */
export async function secureFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = addCsrfTokenToHeaders(options.headers as HeadersInit);

  return fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Include cookies for session validation
  });
}

/**
 * Validate CSRF token on the backend
 * This should be called in your backend API routes
 * @param {string} token - CSRF token from request header
 * @param {string} sessionToken - CSRF token from session/cookie
 * @returns {boolean} True if tokens match
 */
export function validateCsrfToken(token: string, sessionToken: string): boolean {
  if (!token || !sessionToken) {
    return false;
  }

  // Use constant-time comparison to prevent timing attacks
  return constantTimeCompare(token, sessionToken);
}

/**
 * Constant-time string comparison to prevent timing attacks
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {boolean} True if strings match
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * CSRF protection middleware for API routes
 * Usage: app.use(csrfProtectionMiddleware);
 */
export function csrfProtectionMiddleware(req: any, res: any, next: any): void {
  // Skip CSRF check for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const token = req.headers['x-csrf-token'];
  const sessionToken = req.session?.csrfToken;

  if (!validateCsrfToken(token, sessionToken)) {
    return res.status(403).json({
      success: false,
      message: 'CSRF token validation failed'
    });
  }

  next();
}
