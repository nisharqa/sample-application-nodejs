# Sample Node.js Application - CodeRabbit PoC Evaluation

This is an intentionally vulnerable Node.js application created for **PoC evaluation of code review with CodeRabbit**. It demonstrates multiple security and code quality issues that code review tools should identify.

## Issues Included

### 1. **No Input Validation**
- **Location**: `app.js` - `/api/user`, `/api/search`, `/api/file/:path` endpoints
- **Problem**: User input is directly used without validation or sanitization
- **Impact**: SQL injection, path traversal, data corruption
- **Example**: 
  ```javascript
  const userId = req.body.userId; // No validation
  const searchQuery = `SELECT * FROM users WHERE name = '${query}'`; // Injection vulnerability
  ```

### 2. **No Async Error Handling**
- **Location**: `app.js` - `/api/process` endpoint
- **Problem**: Async operations without try-catch blocks
- **Impact**: Unhandled exceptions crash the server
- **Example**:
  ```javascript
  app.post('/api/process', async (req, res) => {
    const result = await readFileAsync(file); // No try-catch
    res.json({ result: result });
  });
  ```

### 3. **Unhandled Promise Rejections**
- **Location**: `app.js` - `/api/user`, `/api/external-data` endpoints
- **Problem**: Promises without `.catch()` or try-catch
- **Impact**: Silent failures, data inconsistency
- **Example**:
  ```javascript
  fetchUserDataFromDB(userId).then(data => {
    res.json(userData);
  }); // Missing .catch()
  ```

### 4. **Hardcoded Credentials**
- **Location**: `app.js` - Lines containing credentials
- **Problem**: API keys, passwords, and secrets hardcoded in source code
- **Impact**: Exposure of sensitive data in repositories
- **Examples**:
  ```javascript
  const API_KEY = 'sk_live_51234567890abcdefghij';
  const DB_PASSWORD = 'admin123!';
  const JWT_SECRET = 'super_secret_key_12345';
  const AWS_ACCESS_KEY = 'AKIAIOSFODNN7EXAMPLE';
  ```

### 5. **Insecure Dependency Usage**
- **Location**: `package.json`
- **Problem**: Using outdated versions with known vulnerabilities
- **Impact**: Security vulnerabilities in dependencies
- **Examples**:
  ```json
  "express": "4.17.1",      // Old version
  "mongoose": "5.11.15",    // Outdated
  "lodash": "4.17.20"       // Vulnerable version
  ```

### 6. **Blocking CPU Loop**
- **Location**: `app.js` - `/api/compute`, `/api/hash` endpoints
- **Problem**: Synchronous blocking operations that freeze the event loop
- **Impact**: Server becomes unresponsive
- **Example**:
  ```javascript
  const iterations = 1000000000; // 1 billion iterations
  for (let i = 0; i < iterations; i++) {
    result += Math.sqrt(i); // Blocks entire server
  }
  ```

### 7. **No Rate Limiting**
- **Location**: `app.js` - All endpoints
- **Problem**: No rate limiting middleware applied
- **Impact**: Vulnerable to DoS attacks
- **Missing**: 
  ```javascript
  const rateLimit = require('express-rate-limit');
  const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
  app.use(limiter);
  ```

### 8. **No Security Headers**
- **Location**: `app.js` - Application initialization
- **Problem**: Missing security headers like X-Frame-Options, X-Content-Type-Options
- **Impact**: Vulnerable to XSS, clickjacking, MIME sniffing
- **Missing**:
  ```javascript
  const helmet = require('helmet');
  app.use(helmet());
  ```

## Additional Issues

- **Poor Error Exposure**: Stack traces and internal details exposed in error responses
- **No CORS Configuration**: Missing or unconfigured CORS headers
- **No Global Error Handler**: Missing process-level unhandled rejection handler
- **Inefficient Algorithms**: Synchronous crypto operations
- **Path Traversal**: File path not validated, allowing directory traversal attacks

## Installation

```bash
npm install
```

## Running the Application

```bash
npm start
```

The server will start on port 3000 (or the PORT environment variable).

## Using with CodeRabbit

This application is designed to be reviewed by CodeRabbit to validate its code review capabilities. All the above issues should be identified and flagged by the code review tool.

## Testing Endpoints

```bash
# User creation without validation
curl -X POST http://localhost:3000/api/user \
  -H "Content-Type: application/json" \
  -d '{"userId":1,"email":"test@example.com","age":"invalid"}'

# Blocking computation
curl http://localhost:3000/api/compute

# File access without validation
curl http://localhost:3000/api/file/../../etc/passwd

# Search without validation (SQL injection)
curl "http://localhost:3000/api/search?q=admin' OR '1'='1"

# External API call without error handling
curl "http://localhost:3000/api/external-data?url=https://example.com"
```

## Disclaimer

⚠️ **This application is for educational and PoC purposes only.** It intentionally contains security vulnerabilities and should NOT be used in production or deployed to any public-facing environments.
