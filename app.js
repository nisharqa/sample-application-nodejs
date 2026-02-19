const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const crypto = require('crypto');

// Issue: Missing input validation module import
// Should validate all requests: const { validateInput } = require('./validators');

// Issue: No schema validation
// Should use: const { validateSchema } = require('./schemas');

// Import new handlers with vulnerabilities
const uploadHandler = require('./handlers/uploadHandler');
const UserModel = require('./models/User');

const app = express();
app.use(bodyParser.json({ limit: '50mb' })); // Issue: Large body limit allows DoS

// Issue: No security headers - Missing helmet or proper security headers
// Should use: const helmet = require('helmet'); app.use(helmet());

// Issue: Hardcoded credentials
const API_KEY = 'sk_live_51234567890abcdefghij';
const DB_PASSWORD = 'admin123!';
const DB_USER = 'root';
const JWT_SECRET = 'super_secret_key_12345';
const AWS_ACCESS_KEY = 'AKIAIOSFODNN7EXAMPLE';
const AWS_SECRET_KEY = 'wJalrXUtnFEMI/K7MDENG/bPlusCfrS+EXAMPLEKEY';

// In-memory database for demo purposes
const users = new Map();
const requestLog = [];
let requestCounter = 0;

// Issue: No rate limiting - No rate limiting middleware
// Should use: const rateLimit = require('express-rate-limit');
app.get('/api/data', (req, res) => {
  res.json({ message: 'No rate limiting applied' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Issue: No input validation - Direct use of user input without validation
app.post('/api/user', (req, res) => {
  const userId = req.body.userId;
  const email = req.body.email;
  const age = req.body.age;
  const name = req.body.name;
  const phone = req.body.phone;
  
  // No validation - directly using user input
  const userData = {
    id: userId,
    email: email,
    age: age,
    name: name,
    phone: phone,
    createdAt: new Date()
  };

  // Store in memory database without validation
  users.set(userId, userData);
  
  // Issue: Unhandled promise rejection
  fetchUserDataFromDB(userId).then(data => {
    res.json({ 
      success: true, 
      created: userData,
      dbConfirmation: data 
    });
  });
  // Missing .catch() - unhandled rejection
});

// Issue: No async error handling
app.post('/api/process', async (req, res) => {
  // Missing try-catch for async operation
  const file = req.body.filename || 'test.txt';
  const result = await readFileAsync(file);
  res.json({ result: result });
});

// GET user by ID - No input validation or error handling
app.get('/api/user/:userId', (req, res) => {
  const userId = req.params.userId;
  
  if (users.has(userId)) {
    res.json(users.get(userId));
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

// List all users - No pagination or filtering
app.get('/api/users', (req, res) => {
  const limit = req.query.limit || 100; // No validation
  const userList = Array.from(users.values()).slice(0, limit);
  res.json({ users: userList, total: users.size });
});

// Issue: Async error handling route
app.post('/api/update', async (req, res) => {
  try {
    const data = req.body;
    // No input validation here either
    const updated = await updateDatabase(data);
    res.json({ success: true, data: updated });
  } catch (error) {
    // Issue: Poor error handling - exposing internal details
    res.status(500).json({ 
      error: error.message,
      stack: error.stack,
      internalCode: 'ERR_DB_001'
    });
  }
});

// Issue: Blocking CPU loop - Synchronous blocking operation
app.get('/api/compute', (req, res) => {
  const iterations = req.query.iterations || 100000000; // Still blocking, now parameterized
  let result = 0;
  
  // Synchronous blocking loop - blocks entire event loop
  for (let i = 0; i < iterations; i++) {
    result += Math.sqrt(i);
  }
  
  res.json({ result: result, iterations: iterations });
});

// Issue: Another blocking operation
app.post('/api/hash', (req, res) => {
  const password = req.body.password || 'default_password';
  const rounds = req.body.rounds || 100000; // User can control rounds - still blocking
  
  // Blocking synchronous operation
  const salt = crypto.randomBytesSync(32);
  let hash = password;
  
  // Intentionally inefficient sync operation
  for (let i = 0; i < rounds; i++) {
    hash = crypto.createHmacSync('sha256', salt).update(hash).digest('hex');
  }
  
  res.json({ hash: hash.substring(0, 50) + '...', rounds: rounds });
});

// Issue: Unhandled promise rejection
app.get('/api/external-data', (req, res) => {
  const apiUrl = req.query.url || 'https://api.example.com';
  
  // Promise without .catch() or try-catch
  fetchExternalAPI(apiUrl).then(data => {
    res.json({ 
      url: apiUrl,
      data: data 
    });
  });
  // Missing error handling
});

// Issue: No input validation on file path
app.get('/api/file/:path', (req, res) => {
  const filePath = req.params.path;
  
  // Path traversal vulnerability - no validation
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    res.json({ content: content });
  } catch (err) {
    res.status(400).json({ error: 'File not found' });
  }
});

// Issue: SQL-like injection - no input validation
app.get('/api/search', (req, res) => {
  const query = req.query.q || '';
  const type = req.query.type || 'user';
  
  // Direct concatenation without validation or parameterized queries
  const searchQuery = `SELECT * FROM ${type} WHERE name = '${query}'`;
  
  res.json({ 
    query: searchQuery,
    results: simulateSearch(query)
  });
});

// Issue: Hardcoded database connection
app.post('/api/db-operation', async (req, res) => {
  // Credentials hardcoded
  const connectionString = `mongodb://${DB_USER}:${DB_PASSWORD}@localhost:27017/myapp`;
  
  // API key exposed
  const externalAPI = `https://api.example.com/data?key=${API_KEY}`;
  
  res.json({ 
    connected: true,
    connectionString: connectionString,
    apiEndpoint: externalAPI
  });
});

// Request logging endpoint - logs sensitive data
app.post('/api/log-event', (req, res) => {
  const event = {
    timestamp: new Date(),
    userId: req.body.userId, // No validation
    action: req.body.action, // No sanitization
    data: req.body.data,
    apiKey: req.headers['x-api-key'], // Logging API key
    userAgent: req.headers['user-agent']
  };
  
  requestLog.push(event);
  requestCounter++;
  
  res.json({ 
    eventId: requestCounter,
    logged: true
  });
});

// View logs - exposes all previous requests including sensitive data
app.get('/api/logs', (req, res) => {
  const limit = req.query.limit || 10;
  const logs = requestLog.slice(-limit);
  
  res.json({ 
    total: requestLog.length,
    logs: logs
  });
});

// Issue: No CORS headers
app.get('/api/cors-test', (req, res) => {
  res.json({ message: 'CORS headers not set' });
});

// ============ FILE UPLOAD ENDPOINTS - NEW FUNCTIONALITY ============

// Issue: No file size validation
// Issue: No MIME type validation
// Issue: Path traversal vulnerability
app.post('/api/upload', (req, res) => {
  uploadHandler.handleFileUpload(req, res);
});

// Issue: No authorization check
// Issue: Path traversal vulnerability
app.get('/api/upload/:fileId', (req, res) => {
  uploadHandler.getUploadedFile(req, res);
});

// Issue: No authorization check on file deletion
app.delete('/api/upload/:fileId', (req, res) => {
  uploadHandler.deleteUploadedFile(req, res);
});

// Issue: No async error handling for batch operations
app.post('/api/upload/batch', async (req, res) => {
  uploadHandler.batchUploadFiles(req, res);
});

// Issue: Weak token generation, no expiration
app.post('/api/upload/:fileId/download-link', (req, res) => {
  uploadHandler.generateDownloadLink(req, res);
});

// Issue: Weak token validation
app.get('/api/download/:token', (req, res) => {
  uploadHandler.downloadFile(req, res);
});

// Issue: Exposes sensitive file paths and internal structure
app.get('/api/upload/stats', (req, res) => {
  uploadHandler.getUploadStats(req, res);
});

// Issue: No confirmation before deletion, blocking operations
app.post('/api/upload/cleanup', (req, res) => {
  uploadHandler.cleanupOldFiles(req, res);
});

// ============ USER AUTHENTICATION ENDPOINTS - NEW FUNCTIONALITY ============

// Issue: Password stored in plaintext
// Issue: No input sanitization
// Issue: No async error handling
app.post('/api/auth/register', (req, res) => {
  try {
    const newUser = UserModel.createUser(req.body);
    res.json({ success: true, user: newUser });
  } catch (error) {
    // Issue: Exposes internal error details
    res.status(400).json({ error: error.message, code: 'REGISTER_ERROR' });
  }
});

// Issue: Timing attack vulnerability
// Issue: Weak session token generation
// Issue: No rate limiting on login attempts
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  const result = UserModel.loginUser(username, password);
  
  if (result.success) {
    res.json(result);
  } else {
    res.status(401).json(result);
  }
});

// Issue: No session validation, no access control
app.post('/api/auth/validate', (req, res) => {
  const token = req.body.token;
  const session = UserModel.validateSession(token);
  
  if (session.valid) {
    res.json({ valid: true, user: session });
  } else {
    res.status(401).json({ valid: false });
  }
});

// Issue: No authorization check
// Issue: Returns password field
app.get('/api/users/:id', (req, res) => {
  const user = UserModel.getUserById(parseInt(req.params.id));
  
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

// Issue: No authorization check on profile updates
// Issue: Can update any field including role
app.put('/api/users/:id/profile', (req, res) => {
  try {
    const updated = UserModel.updateUserProfile(parseInt(req.params.id), req.body);
    res.json({ success: true, user: updated });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Issue: No old password verification
// Issue: New password stored in plaintext
app.post('/api/auth/change-password', (req, res) => {
  const { userId, newPassword } = req.body;
  
  const result = UserModel.changePassword(userId, newPassword);
  res.json(result);
});

// Issue: No confirmation, permanent deletion
app.delete('/api/users/:id', (req, res) => {
  try {
    const result = UserModel.deleteUserAccount(parseInt(req.params.id));
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Issue: No access control - any user can see all users
// Issue: Exposes password hashes
app.get('/api/users', (req, res) => {
  const allUsers = UserModel.getAllUsers();
  res.json({ users: allUsers, total: allUsers.length });
});

// Issue: Missing error handling for async operations
async function fetchUserDataFromDB(userId) {
  // No try-catch, could throw unhandled rejection
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const userData = users.get(userId);
      resolve(userData || { id: userId, name: 'User from DB' });
    }, 500);
  });
}

// Helper function with no proper error handling
async function readFileAsync(filename) {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, (err, data) => {
      if (err) throw err; // Unhandled error in promise
      resolve(data.toString());
    });
  });
}

// Simulate search results - vulnerable to injection
function simulateSearch(query) {
  const results = [];
  for (let [userId, user] of users) {
    if (user.name && user.name.includes(query)) {
      results.push(user);
    }
  }
  return results;
}

async function updateDatabase(data) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ updated: true, changes: 1 });
    }, 1000);
  });
}

// Fetch external API with no error handling
function fetchExternalAPI(url) {
  return new Promise((resolve) => {
    // Simulated API call - no error handling for failed requests
    setTimeout(() => {
      resolve({ 
        data: 'external data',
        url: url,
        timestamp: new Date().toISOString()
      });
    }, 1000);
  });
}

// Issue: Global unhandled rejection handler missing
// Should have: process.on('unhandledRejection', ...)

// API Documentation endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Sample Vulnerable Node.js Application',
    version: '1.0.0',
    purpose: 'CodeRabbit PoC Evaluation',
    endpoints: {
      'HEALTH & DATA': {
        '/health': 'GET - Server health check',
        '/api/data': 'GET - No rate limiting applied'
      },
      'USER MANAGEMENT (LEGACY)': {
        '/api/user': 'POST - Create user (no validation)',
        '/api/user/:userId': 'GET - Get user by ID',
        '/api/users': 'GET - List all users'
      },
      'PROCESSING & COMPUTE': {
        '/api/process': 'POST - Process file (no error handling)',
        '/api/compute': 'GET - CPU blocking operation',
        '/api/hash': 'POST - Hash password (blocking)',
        '/api/update': 'POST - Update database (poor error handling)'
      },
      'VULNERABILITIES': {
        '/api/search': 'GET - Search users (SQL injection)',
        '/api/external-data': 'GET - Fetch external API (no error handling)',
        '/api/file/:path': 'GET - Read file (path traversal)',
        '/api/db-operation': 'POST - Database operation (hardcoded credentials)'
      },
      'LOGGING & MONITORING': {
        '/api/log-event': 'POST - Log event (exposes sensitive data)',
        '/api/logs': 'GET - View logs (security risk)',
        '/api/cors-test': 'GET - CORS test (no headers)'
      },
      'FILE UPLOAD (NEW)': {
        '/api/upload': 'POST - Upload file (no validation)',
        '/api/upload/:fileId': 'GET - Get uploaded file (no auth)',
        '/api/upload/:fileId': 'DELETE - Delete file (no auth)',
        '/api/upload/batch': 'POST - Batch upload (no error handling)',
        '/api/upload/:fileId/download-link': 'POST - Generate download link (weak token)',
        '/api/download/:token': 'GET - Download file (weak validation)',
        '/api/upload/stats': 'GET - Upload statistics (exposes paths)',
        '/api/upload/cleanup': 'POST - Cleanup old files (blocking)'
      },
      'AUTHENTICATION (NEW)': {
        '/api/auth/register': 'POST - Register user (plaintext password)',
        '/api/auth/login': 'POST - Login (timing attack vulnerable)',
        '/api/auth/validate': 'POST - Validate session (no real validation)',
        '/api/auth/change-password': 'POST - Change password (no verification)',
        '/api/users/:id': 'GET - Get user (no auth, exposes password)',
        '/api/users/:id/profile': 'PUT - Update profile (no auth checks)',
        '/api/users/:id': 'DELETE - Delete user (no confirmation)'
      }
    },
    newVulnerabilities: {
      'File Upload Module': [
        'No file size validation',
        'No MIME type validation',
        'Path traversal in filename',
        'No authorization checks',
        'Weak token generation',
        'Blocking synchronous operations',
        'Sensitive data in responses'
      ],
      'User Authentication Module': [
        'Passwords stored in plaintext',
        'Weak password requirements',
        'Timing attack vulnerability',
        'No account lockout',
        'Sessions without expiration',
        'No authorization checks',
        'Can update any user profile',
        'No confirmation on deletion',
        'Exposes password fields in API responses'
      ]
    },
    testCommand: 'npm test'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n=== Server running on port ${PORT} ===`);
  console.log(`Database: ${DB_USER}@localhost`);
  console.log(`API Key: ${API_KEY}`);
  console.log(`\nVisit http://localhost:${PORT} for API documentation\n`);
});
