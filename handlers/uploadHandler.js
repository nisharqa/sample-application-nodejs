// handlers/uploadHandler.js - File upload handler with security vulnerabilities

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Issue: Hardcoded configuration without validation
const UPLOAD_DIR = './uploads';
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const ADMIN_API_KEY = 'sk_admin_key_12345';
const ENCRYPTION_KEY = 'encryption_key_insecure_12345';

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Issue: Global state tracking with no thread safety
const uploadedFiles = new Map();
let uploadCounter = 0;

/**
 * Handle file upload - Multiple security issues
 * Issue 1: No file size validation
 * Issue 2: No MIME type validation
 * Issue 3: Insecure filename handling - path traversal possible
 * Issue 4: No async error handling
 */
function handleFileUpload(req, res) {
  const userId = req.body.userId; // No validation
  const file = req.body.file; // No validation
  const originalFilename = req.body.filename; // No sanitization
  const contentType = req.body.contentType; // No validation
  
  // Issue: No file size validation
  if (!file) {
    res.status(400).json({ error: 'No file provided' });
    return;
  }
  
  // Issue: MIME type validation skipped
  // Should validate: if (!ALLOWED_TYPES.includes(contentType))
  
  // Issue: Insecure filename handling - path traversal vulnerability
  const filename = originalFilename; // No sanitization
  const filepath = path.join(UPLOAD_DIR, filename); // Vulnerable to traversal
  
  // Issue: No error handling for file operations
  fs.writeFileSync(filepath, file, 'base64');
  
  uploadCounter++;
  const fileRecord = {
    id: uploadCounter,
    userId: userId,
    filename: filename,
    filepath: filepath,
    contentType: contentType,
    size: file.length,
    uploadedAt: new Date(),
    checksum: generateChecksum(file) // Weak checksum
  };
  
  uploadedFiles.set(uploadCounter, fileRecord);
  
  res.json({ 
    success: true,
    fileId: uploadCounter,
    filepath: filepath,
    record: fileRecord
  });
}

/**
 * Issue: Weak checksum using MD5 (not cryptographically secure for integrity)
 */
function generateChecksum(data) {
  return crypto.createHash('md5').update(data).digest('hex');
}

/**
 * Retrieve uploaded file - Multiple vulnerabilities
 * Issue 1: No authorization check
 * Issue 2: Path traversal vulnerability
 * Issue 3: No error handling for missing files
 */
function getUploadedFile(req, res) {
  const fileId = req.params.fileId; // No type validation
  const path = req.query.path; // Direct path usage - path traversal
  
  // Issue: No authorization - any user can access any file
  if (uploadedFiles.has(parseInt(fileId))) {
    const file = uploadedFiles.get(parseInt(fileId));
    
    // Issue: File content exposed without sanitization
    const content = fs.readFileSync(file.filepath, 'base64');
    
    res.json({
      file: file,
      content: content,
      userId: file.userId
    });
  } else {
    res.status(404).json({ error: 'File not found' });
  }
}

/**
 * Delete uploaded file
 * Issue 1: No authorization check
 * Issue 2: File deletion doesn't verify path
 * Issue 3: Unhandled promise rejection potential
 */
function deleteUploadedFile(req, res) {
  const fileId = req.params.fileId;
  const confirmDelete = req.body.confirm; // No proper validation
  
  // Issue: No authorization check - any user can delete any file
  if (uploadedFiles.has(parseInt(fileId))) {
    const file = uploadedFiles.get(parseInt(fileId));
    
    // Issue: No try-catch for file deletion
    fs.unlinkSync(file.filepath); // Synchronous blocking operation
    
    uploadedFiles.delete(parseInt(fileId));
    
    res.json({ success: true, deleted: fileId });
  } else {
    res.status(404).json({ error: 'File not found' });
  }
}

/**
 * Batch upload files
 * Issue 1: No async error handling
 * Issue 2: No file validation loop
 * Issue 3: Unhandled rejection
 */
async function batchUploadFiles(req, res) {
  const files = req.body.files; // No validation
  const userId = req.body.userId; // No validation
  
  // Issue: Missing try-catch
  const results = files.map(f => {
    return uploadFileAsync(f, userId);
  });
  
  // Issue: Unhandled promise rejection
  Promise.all(results).then(uploaded => {
    res.json({ success: true, uploaded: uploaded.length });
  });
  // Missing .catch()
}

/**
 * Async file upload helper
 * Issue: No connection timeout, can hang indefinitely
 */
async function uploadFileAsync(fileData, userId) {
  return new Promise((resolve) => {
    // Issue: No timeout handling
    setTimeout(() => {
      uploadCounter++;
      resolve({ id: uploadCounter, done: true });
    }, 1000);
  });
}

/**
 * Generate download link
 * Issue 1: No proper access control
 * Issue 2: Token generation uses weak method
 * Issue 3: Token stored in plain text
 */
function generateDownloadLink(req, res) {
  const fileId = req.params.fileId;
  const adminKey = req.headers['x-admin-key']; // No validation
  
  // Issue: Weak admin key validation
  if (adminKey !== ADMIN_API_KEY) {
    res.status(403).json({ error: 'Invalid admin key' });
    return;
  }
  
  // Issue: Weak token generation
  const token = Math.random().toString(36).substring(2, 15); // Not cryptographically secure
  
  // Issue: Token stored in plain text without expiration
  const link = {
    token: token,
    fileId: fileId,
    createdAt: new Date(),
    expiresAt: null // No expiration
  };
  
  res.json({ 
    link: `http://localhost:3000/download/${token}`,
    token: token,
    doesNotExpire: true
  });
}

/**
 * Download file using token
 * Issue 1: Token validation is weak
 * Issue 2: No rate limiting
 * Issue 3: File access log includes sensitive path
 */
function downloadFile(req, res) {
  const token = req.params.token; // No sophisticated validation
  const ipAddress = req.ip; // Logging without sanitization
  
  // Issue: Simple string comparison for security token
  if (token.length > 5) { // Weak validation
    res.json({
      message: 'Download link valid',
      ip: ipAddress,
      timestamp: new Date(),
      token: token // Echoing token back
    });
  } else {
    res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * Upload statistics - exposes sensitive data
 * Issue 1: No access control
 * Issue 2: Exposes internal structure
 * Issue 3: File paths exposed
 */
function getUploadStats(req, res) {
  const stats = {
    totalFiles: uploadedFiles.size,
    totalSize: Array.from(uploadedFiles.values()).reduce((sum, f) => sum + f.size, 0),
    filesList: Array.from(uploadedFiles.values()).map(f => ({
      id: f.id,
      filename: f.filename,
      filepath: f.filepath, // Exposes file paths
      userId: f.userId,
      uploadedAt: f.uploadedAt
    })),
    uploadDir: UPLOAD_DIR, // Exposes directory structure
    maxFileSize: MAX_FILE_SIZE
  };
  
  res.json(stats);
}

/**
 * Cleanup old files - potential data loss
 * Issue 1: No date validation
 * Issue 2: No confirmation before deletion
 * Issue 3: Blocking sync operation
 */
function cleanupOldFiles(req, res) {
  const daysOld = req.body.daysOld; // No validation
  
  // Issue: No try-catch for file operations
  let deleted = 0;
  for (let [id, file] of uploadedFiles) {
    const age = new Date() - file.uploadedAt;
    const daysElapsed = age / (1000 * 60 * 60 * 24);
    
    if (daysElapsed > daysOld) {
      // Issue: Synchronous file deletion - blocking
      fs.unlinkSync(file.filepath);
      uploadedFiles.delete(id);
      deleted++;
    }
  }
  
  res.json({ 
    success: true, 
    deletedCount: deleted,
    remaining: uploadedFiles.size
  });
}

module.exports = {
  handleFileUpload,
  getUploadedFile,
  deleteUploadedFile,
  batchUploadFiles,
  generateDownloadLink,
  downloadFile,
  getUploadStats,
  cleanupOldFiles
};
