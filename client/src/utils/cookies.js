// Cookie utilities for E-Lock Tracking module
// Compatible with the client module's cookie configuration
// NOTE: Cookies are only used on HTTPS. On HTTP (localhost/dev), localStorage is used.

// Check if we're on HTTPS - this is the most reliable way to determine if cookies should be used
// Cookies with Secure and SameSite=None only work on HTTPS
const isHttps =
  typeof window !== "undefined" && window.location.protocol === "https:";

console.log(
  "🔒 HTTPS Check:",
  isHttps,
  "| Protocol:",
  typeof window !== "undefined" ? window.location.protocol : "N/A"
);

/**
 * Set a cookie with proper HTTP/HTTPS handling
 * Only sets cookies in production (HTTPS environment)
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value
 * @param {number} days - Expiration in days (default 7)
 * @param {object} opts - Additional options (domain, sameSite)
 */
export function setCookie(name, value, days = 7, opts = {}) {
  // Only use cookies in production (HTTPS)
  if (!isHttps) {
    console.log(
      `⚠️ Development mode: Skipping cookie set for "${name}", using localStorage instead`
    );
    return;
  }

  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);

  const cookieParts = [
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
    `Expires=${expires.toUTCString()}`,
    `Path=/`,
    "Secure", // Always Secure in production (HTTPS)
    "SameSite=None", // Allow cross-origin in production
  ];

  if (opts.domain) {
    cookieParts.push(`Domain=${opts.domain}`);
  }

  document.cookie = cookieParts.join("; ");
}

/**
 * Get a cookie by name
 * Only reads cookies in production
 * @param {string} name - Cookie name
 * @returns {string|null} Cookie value or null if not found
 */
export function getCookie(name) {
  // Only use cookies in production
  if (!isHttps) {
    return null;
  }

  const nameEq = `${encodeURIComponent(name)}=`;
  const parts = document.cookie.split(";").map((p) => p.trim());

  for (let i = 0; i < parts.length; i++) {
    if (parts[i].startsWith(nameEq)) {
      return decodeURIComponent(parts[i].substring(nameEq.length));
    }
  }
  return null;
}

/**
 * Remove a cookie by name
 * Only removes cookies in production
 * @param {string} name - Cookie name
 * @param {object} opts - Additional options (domain)
 */
export function removeCookie(name, opts = {}) {
  // Only use cookies in production
  if (!isHttps) {
    return;
  }

  const cookieParts = [
    `${encodeURIComponent(name)}=; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
    `Path=/`,
    "Secure",
    "SameSite=None",
  ];

  if (opts.domain) {
    cookieParts.push(`Domain=${opts.domain}`);
  }

  document.cookie = cookieParts.join("; ");
}

/**
 * Set a JSON value as a cookie
 * @param {string} name - Cookie name
 * @param {object} valueObj - Object to store
 * @param {number} days - Expiration in days
 * @param {object} opts - Additional options
 */
export function setJsonCookie(name, valueObj, days = 7, opts = {}) {
  try {
    setCookie(name, JSON.stringify(valueObj), days, opts);
  } catch (e) {
    console.error("Failed to set JSON cookie", e);
  }
}

/**
 * Get a JSON value from a cookie
 * @param {string} name - Cookie name
 * @returns {object|null} Parsed object or null
 */
export function getJsonCookie(name) {
  const val = getCookie(name);
  if (!val) return null;
  try {
    return JSON.parse(val);
  } catch (e) {
    return null;
  }
}

/**
 * Get authentication token from various sources
 * - Production: Cookies first (access_token, exim_sso_token), then localStorage
 * - Development: localStorage/sessionStorage only (no cookies on HTTP)
 * @returns {string|null} Token or null if not found
 */
export function getAuthToken() {
  // In production, check cookies first (these come from the client module)
  if (isHttps) {
    const cookieToken =
      getCookie("access_token") || getCookie("exim_sso_token");
    if (cookieToken) {
      console.log("🍪 [PROD] Found token in cookies");
      return cookieToken;
    }
  }

  // Fall back to localStorage (used in both dev and prod)
  const localToken =
    localStorage.getItem("exim_sso_token") || localStorage.getItem("jwt_token");
  if (localToken) {
    console.log(
      isHttps
        ? "📦 [PROD] Found token in localStorage"
        : "📦 [DEV] Found token in localStorage"
    );
    return localToken;
  }

  // Fall back to sessionStorage
  const sessionToken = sessionStorage.getItem("jwt_token");
  if (sessionToken) {
    console.log(
      isHttps
        ? "📋 [PROD] Found token in sessionStorage"
        : "📋 [DEV] Found token in sessionStorage"
    );
    return sessionToken;
  }

  return null;
}

/**
 * Save authentication token
 * - Production: Saves to cookies AND localStorage for redundancy
 * - Development: Saves to localStorage/sessionStorage only (no cookies on HTTP)
 * @param {string} token - Token to save
 * @param {boolean} persist - Whether to persist in localStorage
 */
export function saveAuthToken(token, persist = true) {
  if (!token) return false;

  const cleanToken = token.trim();

  // In production, save to cookies (compatible with client module)
  if (isHttps) {
    setCookie("access_token", cleanToken, 1, {}); // 1 day for access token
    setCookie("exim_sso_token", cleanToken, 7, {}); // 7 days for SSO token
    console.log("🍪 [PROD] Token saved to cookies");
  }

  // Always save to localStorage for compatibility (both dev and prod)
  if (persist) {
    localStorage.setItem("exim_sso_token", cleanToken);
    localStorage.setItem("jwt_token", cleanToken);
  }

  sessionStorage.setItem("jwt_token", cleanToken);

  console.log(
    isHttps
      ? "✅ [PROD] Token saved to cookies and storage"
      : "✅ [DEV] Token saved to localStorage/sessionStorage"
  );
  return true;
}

/**
 * Clear all authentication tokens
 * Clears cookies (in production) and storage (always)
 */
export function clearAuthTokens() {
  // In production, clear cookies
  if (isHttps) {
    removeCookie("access_token");
    removeCookie("exim_sso_token");
  }

  // Always clear storage
  localStorage.removeItem("exim_sso_token");
  localStorage.removeItem("jwt_token");
  sessionStorage.removeItem("jwt_token");

  console.log(
    isHttps
      ? "🗑️ [PROD] All auth tokens cleared (cookies + storage)"
      : "🗑️ [DEV] All auth tokens cleared (storage only)"
  );
}

export default {
  setCookie,
  getCookie,
  removeCookie,
  setJsonCookie,
  getJsonCookie,
  getAuthToken,
  saveAuthToken,
  clearAuthTokens,
  isHttps, // Export for debugging
};
