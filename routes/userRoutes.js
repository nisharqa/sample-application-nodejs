// routes/userRoutes.js - User management routes with security issues

const express = require('express');
const router = express.Router();

// Issue: Hardcoded database credentials
const DB_CREDENTIALS = {
  user: 'admin',
  password: 'password123',
  host: 'localhost'
};

// Issue: No input validation middleware
router.post('/register', (req, res) => {
  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;
  
  // No validation of input
  // No password strength check
  // No email format validation
  
  // Issue: Direct database query without parameterization
  const query = `INSERT INTO users (username, email, password) 
                 VALUES ('${username}', '${email}', '${password}')`;
  
  // Issue: No async error handling
  executeQuery(query).then(result => {
    res.json({ success: true, userId: result.id });
  });
  // Missing .catch()
});

// Issue: No input validation on login
router.post('/login', (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  
  // SQL injection vulnerability
  const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
  
  const user = queryDatabase(query);
  
  if (user) {
    // Issue: Hardcoded JWT secret
    const token = generateToken(user, 'my_secret_jwt_key_12345');
    res.json({ token: token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Issue: Path traversal vulnerability
router.get('/profile/:userId', (req, res) => {
  const userId = req.params.userId;
  
  // No validation - could allow directory traversal
  // Issue: Unhandled promise rejection
  getUserProfile(userId).then(profile => {
    res.json(profile);
  });
  // Missing .catch()
});

// Issue: No input validation, potential DoS
router.post('/search', (req, res) => {
  const searchTerm = req.body.search;
  const limit = req.body.limit; // No validation - could be huge number
  
  // Query without parameterization
  const query = `SELECT * FROM users WHERE name LIKE '%${searchTerm}%' LIMIT ${limit}`;
  
  res.json({ query: query });
});

// Issue: Blocking operation without async
router.get('/export/:format', (req, res) => {
  const format = req.params.format;
  
  // Synchronous, blocking operation
  const data = getAllUsersSync(); // Blocks event loop
  const formatted = formatDataSync(data, format); // Blocks event loop
  
  res.download(formatted);
});

// Issue: No error handling for async
router.post('/batch-import', async (req, res) => {
  const file = req.files.upload;
  
  // No try-catch
  const data = await parseCSV(file);
  const results = await importUsersBatch(data);
  
  res.json({ imported: results.length });
});

// Helper functions with issues

// Issue: No error handling
function executeQuery(query) {
  return new Promise((resolve) => {
    // Simulated DB query
    setTimeout(() => resolve({ id: 1 }), 100);
  });
}

// Issue: Direct database access without validation
function queryDatabase(query) {
  // Simulated query execution
  return { id: 1, username: 'user' };
}

// Issue: Unhandled async operation
async function getUserProfile(userId) {
  // No input validation
  // No error handling
  return { userId: userId, name: 'User' };
}

// Issue: Blocking operation
function getAllUsersSync() {
  // Simulated synchronous data retrieval
  return Array(1000000).fill({ id: 1, name: 'User' });
}

// Issue: Blocking operation
function formatDataSync(data, format) {
  let result = '';
  for (let item of data) {
    result += JSON.stringify(item);
  }
  return result.concat('.', format);
}

function generateToken(user, secret) {
  // Simplified token generation
  return 'token_' + user.id;
}

// Issue: Unhandled rejection
async function parseCSV(file) {
  return [];
}

async function importUsersBatch(data) {
  return [];
}

module.exports = router;
