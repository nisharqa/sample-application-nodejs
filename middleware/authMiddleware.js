// middleware/authMiddleware.js - Authentication middleware with vulnerabilities

// Issue: Hardcoded API keys
const VALID_API_KEYS = [
  'sk_live_1234567890abcdef',
  'sk_test_abcdefghij1234567890'
];

const ADMIN_PASSWORD = 'admin_password_123';
const SECRET_TOKEN = 'super_secret_token_xyz';

// Issue: No input validation
function validateRequest(req, res, next) {
  // Issue: Directly accessing user input without validation
  const apiKey = req.headers['x-api-key'];
  const userId = req.query.userId;
  const action = req.body.action;
  
  if (!apiKey) {
    return res.status(401).json({ error: 'Missing API key' });
  }
  
  // Issue: Direct string comparison for sensitive operations
  if (apiKey === ADMIN_PASSWORD) {
    req.isAdmin = true;
  }
  
  // Issue: No input sanitization
  req.userId = userId;
  req.action = action;
  
  next();
}

// Issue: No async error handling
function checkPermissions(req, res, next) {
  // Missing try-catch
  const permissions = getUserPermissions(req.userId);
  const hasAccess = checkAccess(permissions, req.action);
  
  if (hasAccess) {
    next();
  } else {
    res.status(403).json({ error: 'Access denied' });
  }
}

// Issue: Blocking operation in middleware
function rateLimit(req, res, next) {
  // Synchronous blocking operation
  let result = 0;
  for (let i = 0; i < 10000000; i++) {
    result += Math.sqrt(i);
  }
  
  next();
}

// Issue: No promise error handling
function asyncMiddleware(req, res, next) {
  // Unhandled promise rejection
  getUserSession(req.cookies.sessionId).then(session => {
    req.session = session;
    next();
  });
  // Missing .catch()
}

// Issue: Cryptographic weakness
function generateSecureToken() {
  // Using Math.random() instead of crypto
  return Math.random().toString(36).substring(2, 15);
}

// Issue: Sensitive data in logs
function logRequest(req, res, next) {
  console.log('API Key:', req.headers['x-api-key']);
  console.log('User:', req.body.username);
  console.log('Password:', req.body.password);
  console.log('Full Request:', req.body);
  
  next();
}

// Helper functions

function getUserPermissions(userId) {
  // No validation
  return ['read', 'write'];
}

function checkAccess(permissions, action) {
  return permissions.includes(action);
}

// Issue: Unhandled rejection
async function getUserSession(sessionId) {
  return {};
}

module.exports = {
  validateRequest,
  checkPermissions,
  rateLimit,
  asyncMiddleware,
  generateSecureToken,
  logRequest
};
