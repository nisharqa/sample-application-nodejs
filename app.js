const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
app.use(bodyParser.json());

// Issue: No security headers - Missing helmet or proper security headers
// Should use: const helmet = require('helmet'); app.use(helmet());

// Issue: Hardcoded credentials
const API_KEY = 'sk_live_51234567890abcdefghij';
const DB_PASSWORD = 'admin123!';
const DB_USER = 'root';
const JWT_SECRET = 'super_secret_key_12345';
const AWS_ACCESS_KEY = 'AKIAIOSFODNN7EXAMPLE';
const AWS_SECRET_KEY = 'wJalrXUtnFEMI/K7MDENG/bPlusCfrS+EXAMPLEKEY';

// Issue: No rate limiting - No rate limiting middleware
// Should use: const rateLimit = require('express-rate-limit');
app.get('/api/data', (req, res) => {
  res.json({ message: 'No rate limiting applied' });
});

// Issue: No input validation - Direct use of user input without validation
app.post('/api/user', (req, res) => {
  const userId = req.body.userId;
  const email = req.body.email;
  const age = req.body.age;
  
  // No validation - directly using user input
  const userData = {
    id: userId,
    email: email,
    age: age,
    createdAt: new Date()
  };

  // Issue: Unhandled promise rejection
  fetchUserDataFromDB(userId).then(data => {
    res.json(userData);
  });
  // Missing .catch() - unhandled rejection
});

// Issue: No async error handling
app.post('/api/process', async (req, res) => {
  // Missing try-catch for async operation
  const file = req.body.filename;
  const result = await readFileAsync(file);
  res.json({ result: result });
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
  const iterations = 1000000000; // 1 billion iterations
  let result = 0;
  
  // Synchronous blocking loop - blocks entire event loop
  for (let i = 0; i < iterations; i++) {
    result += Math.sqrt(i);
  }
  
  res.json({ result: result });
});

// Issue: Another blocking operation
app.get('/api/hash', (req, res) => {
  const password = req.query.password;
  
  // Blocking synchronous operation
  const salt = crypto.randomBytesSync(32);
  let hash = password;
  
  // Intentionally inefficient sync operation
  for (let i = 0; i < 100000; i++) {
    hash = crypto.createHmacSync('sha256', salt).update(hash).digest('hex');
  }
  
  res.json({ hash: hash });
});

// Issue: Unhandled promise rejection
app.get('/api/external-data', (req, res) => {
  const apiUrl = req.query.url;
  
  // Promise without .catch() or try-catch
  fetchExternalAPI(apiUrl).then(data => {
    res.json(data);
  });
  // Missing error handling
});

// Issue: No input validation on file path
app.get('/api/file/:path', (req, res) => {
  const filePath = req.params.path;
  
  // Path traversal vulnerability - no validation
  const content = fs.readFileSync(filePath, 'utf8');
  res.json({ content: content });
});

// Issue: SQL-like injection - no input validation
app.get('/api/search', (req, res) => {
  const query = req.query.q;
  
  // Direct concatenation without validation or parameterized queries
  const searchQuery = `SELECT * FROM users WHERE name = '${query}'`;
  
  res.json({ query: searchQuery });
});

// Issue: Hardcoded database connection
app.post('/api/db-operation', async (req, res) => {
  // Credentials hardcoded
  const connectionString = `mongodb://${DB_USER}:${DB_PASSWORD}@localhost:27017/myapp`;
  
  // API key exposed
  const externalAPI = `https://api.example.com/data?key=${API_KEY}`;
  
  res.json({ connected: true });
});

// Issue: Missing error handling for async operations
async function fetchUserDataFromDB(userId) {
  // No try-catch, could throw unhandled rejection
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve({ id: userId, name: 'John' });
    }, 1000);
  });
}

// Helper function with no proper error handling
async function readFileAsync(filename) {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, (err, data) => {
      if (err) throw err; // Unhandled error in promise
      resolve(data);
    });
  });
}

async function updateDatabase(data) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ updated: true });
    }, 1000);
  });
}

// Fetch external API with no error handling
function fetchExternalAPI(url) {
  return new Promise((resolve) => {
    // Simulated API call
    setTimeout(() => {
      resolve({ data: 'external data' });
    }, 1000);
  });
}

// Issue: Global unhandled rejection handler missing
// Should have: process.on('unhandledRejection', ...)

// Issue: No CORS headers
app.get('/api/cors-test', (req, res) => {
  res.json({ message: 'CORS headers not set' });
});

// Basic health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Database connected: ${DB_USER}@localhost`);
  console.log(`API Key: ${API_KEY}`);
});
