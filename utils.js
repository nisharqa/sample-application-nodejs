// utils.js - Utility functions with various security issues

const crypto = require('crypto');
const fs = require('fs');

// Issue: No input validation
function processUserData(userData) {
  // Direct use of user data without validation
  return {
    id: userData.id,
    name: userData.name,
    email: userData.email,
    age: userData.age,
    ssn: userData.ssn // PII without validation
  };
}

// Issue: Hardcoded secrets in utility functions
const SECRET_KEY = 'hardcoded_secret_key_12345';
const API_TOKEN = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
const DB_CONNECTION = 'mongodb://admin:password123@localhost:27017/database';

// Issue: No async error handling
async function validateUser(userId) {
  // Missing try-catch
  const user = await getUserFromDatabase(userId);
  const profile = await getProfileData(userId);
  return { user, profile };
}

// Issue: Unhandled promise rejection
function fetchMultipleAPIs(urls) {
  const promises = urls.map(url => 
    fetch(url).then(res => res.json())
  );
  
  return Promise.all(promises); // No .catch()
}

// Issue: Blocking CPU operations
function generatePassword(length) {
  // Synchronous blocking operation
  let password = '';
  for (let i = 0; i < length; i++) {
    password += String.fromCharCode(Math.random() * 94 + 33);
  }
  
  // Additional blocking hashing
  for (let j = 0; j < 1000; j++) {
    password = crypto.createHmacSync('sha256', SECRET_KEY)
      .update(password)
      .digest('hex');
  }
  
  return password;
}

// Issue: Inefficient password hashing
function hashPassword(password) {
  // Synchronous, blocking operation
  const hash = crypto.pbkdfSync(password, SECRET_KEY, 1000, 64, 'sha512');
  return hash.toString('hex');
}

// Issue: No input validation for file operations
function readUserFile(filename) {
  // No validation - path traversal possible
  return fs.readFileSync(filename, 'utf8');
}

// Issue: Direct SQL query construction
function buildUserQuery(name, email) {
  // SQL injection vulnerability
  return `
    SELECT * FROM users 
    WHERE name = '${name}' 
    AND email = '${email}'
  `;
}

// Issue: Exposed sensitive data in responses
function getUserDetails(userId) {
  return {
    id: userId,
    password: 'user_password_hash', // Should never be returned
    ssn: '123-45-6789', // PII exposure
    creditCard: '4532-1111-2222-3333', // PII exposure
    secretToken: SECRET_KEY // Secret exposure
  };
}

// Issue: Unhandled async operation
function processFile(filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) throw err; // Unhandled error
    // Process data without error handling
    const result = JSON.parse(data); // Could throw
    return result;
  });
}

// Issue: Missing error handling in callback chain
function complexOperation(data) {
  fs.readFile(data.file, (err, content) => {
    const parsed = JSON.parse(content); // No error handling
    updateDatabase(parsed, (error, result) => {
      // Error handling missing
      sendResponse(result);
    });
  });
}

module.exports = {
  processUserData,
  validateUser,
  fetchMultipleAPIs,
  generatePassword,
  hashPassword,
  readUserFile,
  buildUserQuery,
  getUserDetails,
  processFile,
  complexOperation
};

// Placeholder async functions
async function getUserFromDatabase(userId) {
  return { id: userId, name: 'John' };
}

async function getProfileData(userId) {
  return { bio: 'Sample bio' };
}

function sendResponse(result) {
  console.log('Response:', result);
}

function updateDatabase(data, callback) {
  callback(null, { updated: true });
}
