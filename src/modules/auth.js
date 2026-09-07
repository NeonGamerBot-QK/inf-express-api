/**
 * Authentication middleware module for API security.
 * Uses constant-time comparison to prevent timing attacks.
 */
const { timingSafeEqual } = require("crypto");

/**
 * Performs a constant-time string comparison to prevent timing attacks.
 * @param {string} a - First string to compare
 * @param {string} b - Second string to compare
 * @returns {boolean} True if strings are equal
 */
function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * Creates middleware that requires a Bearer token from the Authorization header.
 * @param {string} envKeyName - Name of the environment variable containing the expected token
 * @returns {Function} Express middleware function
 */
function requireBearer(envKeyName) {
  return (req, res, next) => {
    const expected = process.env[envKeyName];
    if (!expected) {
      console.error(`[auth] Missing environment variable: ${envKeyName}`);
      return res.status(500).json({ error: "Server misconfigured" });
    }
    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!safeEqual(token, expected)) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    next();
  };
}

/**
 * Creates middleware that requires a token from a custom header.
 * @param {string} headerName - Name of the header to check
 * @param {string} envKeyName - Name of the environment variable containing the expected token
 * @returns {Function} Express middleware function
 */
function requireHeader(headerName, envKeyName) {
  return (req, res, next) => {
    const expected = process.env[envKeyName];
    if (!expected) {
      console.error(`[auth] Missing environment variable: ${envKeyName}`);
      return res.status(500).json({ error: "Server misconfigured" });
    }
    const token = req.headers[headerName.toLowerCase()] || "";
    if (!safeEqual(token, expected)) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    next();
  };
}

module.exports = { safeEqual, requireBearer, requireHeader };
