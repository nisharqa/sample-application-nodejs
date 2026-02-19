# Sample Node.js Application - CodeRabbit PoC Evaluation-

This is an intentionally vulnerable Node.js application created for **PoC evaluation of code review with CodeRabbit**. It demonstrates multiple security and code quality issues that code review tools should identify..

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

## New Functionality for Review

### File Upload Module (`handlers/uploadHandler.js`)

A new file upload handler with the following vulnerabilities:

| Issue | Details |
|-------|---------|
| **No File Size Validation** | Files can be of any size, allowing DoS attacks |
| **No MIME Type Validation** | Any file type accepted without checking |
| **Path Traversal** | Filename not sanitized - `../../etc/passwd` would work |
| **No Authorization** | Any user can access/delete any file |
| **Weak Token Generation** | Download links use weak, guessable tokens |
| **No Expiration** | Tokens never expire, permanent access granted |
| **Blocking Operations** | File deletion uses synchronous `fs.unlinkSync()` |
| **Sensitive Data Exposure** | File paths and internal structure exposed in responses |
| **Weak Checksums** | Uses MD5 for integrity checking |

**Endpoints:**
- `POST /api/upload` - Upload file
- `GET /api/upload/:fileId` - Retrieve file
- `DELETE /api/upload/:fileId` - Delete file
- `POST /api/upload/batch` - Batch upload (no error handling)
- `POST /api/upload/:fileId/download-link` - Generate link
- `GET /api/download/:token` - Download via token
- `GET /api/upload/stats` - View statistics
- `POST /api/upload/cleanup` - Cleanup old files

### User Authentication Module (`models/User.js`)

A new authentication system with critical vulnerabilities:

| Issue | Severity | Details |
|-------|----------|---------|
| **Plaintext Passwords** | 🔴 CRITICAL | Passwords stored without hashing |
| **Weak Requirements** | 🔴 CRITICAL | Minimum 6 characters, no complexity |
| **Timing Attack** | 🔴 CRITICAL | Direct string comparison on login |
| **No Account Lockout** | 🔴 CRITICAL | Failed attempts not properly tracked |
| **No Session Expiration** | 🔴 HIGH | Sessions never expire |
| **Weak JWT Tokens** | 🔴 HIGH | Uses `Math.random()` instead of crypto |
| **No Authorization** | 🔴 HIGH | Any user can update any profile |
| **Exposed Fields** | 🔴 HIGH | API returns password in responses |
| **No Confirmation** | 🟠 MEDIUM | User can delete account without verification |
| **SQL Injection Ready** | 🟠 MEDIUM | Weak duplicate username check |

**Endpoints:**
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login (timing attack vulnerable)
- `POST /api/auth/validate` - Validate session
- `GET /api/users` - List all users (no auth)
- `GET /api/users/:id` - Get user (exposes password)
- `PUT /api/users/:id/profile` - Update profile (no auth)
- `POST /api/auth/change-password` - Change password (no verification)
- `DELETE /api/users/:id` - Delete user (no confirmation)

## Installation

```bash
npm install
```

## Running the Application

```bash
npm start
```

The server will start on port 3000 (or the PORT environment variable).

## Docker Deployment (with vulnerabilities)

### Build and Run with Docker

```bash
# Build Docker image
npm run docker:build
# or
docker build -t vulnerable-nodejs-app:latest .

# Run container
npm run docker:run
# or
docker run -p 3000:3000 vulnerable-nodejs-app:latest
```

### Docker Compose (multi-service)

```bash
# Start all services (app, MongoDB, Redis)
npm run docker:compose:up

# View logs
npm run docker:compose:logs

# Stop services
npm run docker:compose:down
```

### Docker Vulnerabilities for CodeRabbit Review

#### Dockerfile Issues (`Dockerfile`)
| Issue | Severity | Details |
|-------|----------|---------|
| **Running as root** | 🔴 CRITICAL | No USER directive specified |
| **No health check** | 🔴 HIGH | Missing HEALTHCHECK instruction |
| **Dev dependencies included** | 🔴 HIGH | npm install without --only=production |
| **No signal handling** | 🟠 MEDIUM | No graceful shutdown on SIGTERM |
| **Hardcoded port** | 🟠 MEDIUM | Port 3000 is static, not configurable |
| **No multi-stage build** | 🟠 MEDIUM | Image size not optimized |
| **Development mode default** | 🟠 MEDIUM | NODE_ENV not set |
| **No image scanning** | 🟡 LOW | Base image vulnerabilities not checked |

#### docker-compose.yml Issues
| Issue | Severity | Details |
|-------|----------|---------|
| **Hardcoded credentials** | 🔴 CRITICAL | Admin passwords in plain text |
| **Exposed database port** | 🔴 CRITICAL | MongoDB port 27017 bound to 0.0.0.0 |
| **No restart policy** | 🔴 HIGH | Containers don't restart on failure |
| **No resource limits** | 🔴 HIGH | Containers can consume unlimited resources |
| **No health checks** | 🔴 HIGH | No automated health monitoring |
| **Development config as template** | 🟠 MEDIUM | Not suitable for production |
| **No volume persistence** | 🟠 MEDIUM | Data lost on container restart |
| **No custom networks** | 🟠 MEDIUM | Services share default bridge network |
| **Environment variables exposed** | 🟡 LOW | API keys visible in docker inspect |

#### docker-build.sh Issues
| Issue | Severity | Details |
|-------|----------|---------|
| **No error handling** | 🔴 CRITICAL | Script continues on failures |
| **Hardcoded values** | 🔴 HIGH | Credentials embedded in script |
| **No input validation** | 🔴 HIGH | User input not checked |
| **Credentials in arguments** | 🔴 HIGH | API keys passed as env vars (visible) |
| **No verification** | 🟠 MEDIUM | Container start not verified |
| **Comments expose issues** | 🟡 LOW | Security vulnerabilities described in comments |

#### Dockerfile.prod Issues
| Issue | Severity | Details |
|-------|----------|---------|
| **Still running as root** | 🔴 CRITICAL | No USER directive in production build |
| **No signal handling** | 🔴 HIGH | Container will be force-stopped |
| **Large base image** | 🔴 HIGH | Should use distroless or alpine |
| **No environment setup** | 🟠 MEDIUM | NODE_ENV not explicitly set |
| **No build optimization** | 🟠 MEDIUM | Dependencies not filtered for production |

#### .dockerignore Issues
| Severity | Details |
|----------|---------|
| **Incomplete** | Many security-sensitive files not excluded |
| **Exposes .env** | Credentials could be copied into image |
| **Large image** | Test files and documentation included |

### Docker Security Recommendations (for reference)

Things that SHOULD be implemented (not in this PoC):
```dockerfile
# Use distroless base
FROM node:22-distroless

# Create non-root user
USER nodejs

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Use .dockerignore properly
# Handle signals for graceful shutdown
# Use secrets for credentials (Docker Secrets or external management)
# Multi-stage builds for optimization
# Explicit NODE_ENV=production
# Resource limits in compose or orchestration
# Custom networks for service isolation
# Restart policies for production
```

## Using with CodeRabbit

This application is designed to be reviewed by CodeRabbit to validate its code review capabilities. All the above issues should be identified and flagged by the code review tool.

## Testing Endpoints

### Automated Test Suite

Run the comprehensive test suite to trigger all vulnerability endpoints:

```bash
npm test
```

This will execute `test-api.js` which:
- Creates users without validation
- Tests SQL injection vulnerabilities
- Triggers blocking CPU operations
- Exposes hardcoded credentials
- Tests async error handling failures
- Demonstrates sensitive data exposure in logs
- Tests path traversal vulnerabilities

### Manual cURL Tests

```bash
# API Documentation
curl http://localhost:3000/

# Health check
curl http://localhost:3000/health

# User creation without validation
curl -X POST http://localhost:3000/api/user \
  -H "Content-Type: application/json" \
  -d '{"userId":"user_123","email":"test@example.com","age":"invalid"}'

# Get user
curl http://localhost:3000/api/user/user_123

# List all users
curl http://localhost:3000/api/users?limit=10

# Blocking computation (will freeze server briefly)
curl http://localhost:3000/api/compute?iterations=100000000

# Hash operation (blocking, slow)
curl -X POST http://localhost:3000/api/hash \
  -H "Content-Type: application/json" \
  -d '{"password":"test","rounds":50000}'

# File access without validation
curl http://localhost:3000/api/file/package.json

# Search without validation (SQL injection)
curl "http://localhost:3000/api/search?q=admin' OR '1'='1"

# Database operation (exposes hardcoded credentials)
curl -X POST http://localhost:3000/api/db-operation

# Log event (with sensitive data)
curl -X POST http://localhost:3000/api/log-event \
  -H "Content-Type: application/json" \
  -H "x-api-key: sk_test_key" \
  -d '{"userId":"user_123","action":"test","data":{"secret":"value"}}'

# View logs (exposes all sensitive data including API keys)
curl http://localhost:3000/api/logs?limit=5

# External API without error handling
curl "http://localhost:3000/api/external-data?url=https://example.com"
```

## Project Structure

```
sample-application-nodejs/
├── app.js                 # Main application with core vulnerabilities
├── utils.js              # Utility functions with security issues
├── test-api.js           # Automated test suite
├── package.json          # Dependencies with vulnerable versions
├── .env.example          # Environment variables template
├── .gitignore            # Git ignore file
├── README.md             # This file
├── config/
│   └── database.js       # Database config with hardcoded credentials
├── middleware/
│   └── authMiddleware.js # Authentication middleware issues
└── routes/
    └── userRoutes.js     # User routes with vulnerabilities
```

## Key Improvements for Testing

The application now includes:
- **Functional in-memory database** for storing created users
- **Parameterized test endpoints** (iterations, rounds, limits) for flexible testing
- **Request logging** to demonstrate sensitive data exposure
- **API documentation root endpoint** at `http://localhost:3000/`
- **Automated test suite** (`test-api.js`) that exercises all vulnerabilities
- **Detailed endpoint handling** that allows realistic API interactions

## Disclaimer

⚠️ **This application is for educational and PoC purposes only.** It intentionally contains security vulnerabilities and should NOT be used in production or deployed to any public-facing environments.