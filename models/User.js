// models/User.js - User model with validation issues

// Issue: Hardcoded validation rules without configuration
const PASSWORD_MIN_LENGTH = 6; // Too weak
const EMAIL_REGEX = /.+@.+/; // Weak email regex
const USERNAME_REGEX = /^[a-z0-9]+$/; // Restrictive but no length check
const MAX_LOGIN_ATTEMPTS = 10; // Too high for security
const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes

// Issue: In-memory storage of users - no persistence
const users = new Map();
const loginAttempts = new Map();
const sessions = new Map();

// Hardcoded admin credentials
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123',
  email: 'admin@example.com'
};

/**
 * User validation
 * Issue 1: Weak password requirements
 * Issue 2: Missing input sanitization
 * Issue 3: No email format validation
 */
function validateUser(userData) {
  const { username, email, password, age, phone } = userData;
  
  // Issue: No null checks
  // Issue: Weak validation
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { valid: false, error: 'Password too short' };
  }
  
  // Issue: Weak email validation - missing proper regex
  if (!email.includes('@')) {
    return { valid: false, error: 'Invalid email' };
  }
  
  // Issue: No input sanitization
  // Issue: Age not validated as number
  // Issue: Phone format not validated
  
  return { valid: true };
}

/**
 * Create user
 * Issue 1: Password stored in plaintext
 * Issue 2: No async error handling
 * Issue 3: Duplicate username check is direct comparison
 */
async function createUser(userData) {
  const validation = validateUser(userData);
  
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  
  // Issue: No try-catch
  // Issue: Duplicate check without query
  if (users.has(userData.username.toLowerCase())) {
    throw new Error('Username already exists');
  }
  
  // Issue: Password stored in plaintext - critical security issue
  const user = {
    id: users.size + 1,
    username: userData.username,
    email: userData.email,
    password: userData.password, // PLAINTEXT!
    age: userData.age,
    phone: userData.phone,
    createdAt: new Date(),
    lastLogin: null,
    isActive: true,
    role: 'user',
    loginAttempts: 0,
    lockedUntil: null
  };
  
  users.set(userData.username.toLowerCase(), user);
  
  return {
    id: user.id,
    username: user.username,
    email: user.email
  };
}

/**
 * User login
 * Issue 1: No rate limiting enforcement
 * Issue 2: Timing attack vulnerability (direct string comparison)
 * Issue 3: Session token not secure
 */
function loginUser(username, password) {
  const user = users.get(username.toLowerCase());
  
  // Issue: No account lockout check
  
  // Issue: Direct password comparison (timing attack vulnerable)
  if (!user || user.password !== password) {
    // Issue: Not tracking failed attempts properly
    incrementLoginAttempts(username);
    return { success: false, error: 'Invalid credentials' };
  }
  
  // Reset attempts
  loginAttempts.delete(username.toLowerCase());
  
  // Issue: Weak session token generation
  const sessionToken = Math.random().toString(36).substring(2, 15);
  
  // Issue: Session stored in plaintext in memory
  const session = {
    token: sessionToken,
    userId: user.id,
    username: username,
    createdAt: new Date(),
    expiresAt: null, // No expiration
    ip: null, // Not tracked
    userAgent: null // Not tracked
  };
  
  sessions.set(sessionToken, session);
  
  return {
    success: true,
    token: sessionToken,
    user: {
      id: user.id,
      username: user.username
    }
  };
}

/**
 * Increment failed login attempts
 * Issue: No proper tracking or expiration
 */
function incrementLoginAttempts(username) {
  const key = username.toLowerCase();
  const attempts = (loginAttempts.get(key) || 0) + 1;
  
  loginAttempts.set(key, attempts);
  
  // Issue: Weak account lockout - limit is too high
  if (attempts > MAX_LOGIN_ATTEMPTS) {
    // Could lock account here but doesn't
  }
}

/**
 * Validate session
 * Issue: Simple token comparison
 */
function validateSession(token) {
  // Issue: No timing protection
  if (sessions.has(token)) {
    const session = sessions.get(token);
    
    // Issue: No expiration check
    return {
      valid: true,
      userId: session.userId,
      username: session.username
    };
  }
  
  return { valid: false };
}

/**
 * Get user by ID
 * Issue: No access control checks
 */
function getUserById(id) {
  for (let user of users.values()) {
    if (user.id === id) {
      // Issue: Returns password field
      return user;
    }
  }
  return null;
}

/**
 * Update user profile
 * Issue 1: No authorization check
 * Issue 2: No input validation on updates
 * Issue 3: Can update sensitive fields
 */
function updateUserProfile(userId, updates) {
  // Issue: No authorization check - any user can update any profile
  
  const user = getUserById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  
  // Issue: No validation on updated fields
  // Issue: Can update admin role, password, etc
  Object.assign(user, updates);
  
  return user;
}

/**
 * Change password
 * Issue 1: New password stored in plaintext
 * Issue 2: No old password verification
 * Issue 3: No complexity requirements
 */
function changePassword(userId, newPassword) {
  const user = getUserById(userId);
  
  if (!user) {
    throw new Error('User not found');
  }
  
  // Issue: No old password verification
  // Issue: No password complexity check
  
  // Issue: New password stored in plaintext
  user.password = newPassword;
  
  return { success: true, message: 'Password changed' };
}

/**
 * Delete user account
 * Issue: No confirmation required
 * Issue: No backup before deletion
 */
function deleteUserAccount(userId) {
  const user = getUserById(userId);
  
  if (!user) {
    throw new Error('User not found');
  }
  
  // Issue: Permanent deletion with no confirmation or backup
  users.delete(user.username.toLowerCase());
  
  return { success: true, deleted: userId };
}

/**
 * List all users
 * Issue 1: No access control - any user can see all users
 * Issue 2: Exposes password hashes
 * Issue 3: No pagination
 */
function getAllUsers() {
  // Issue: No access control check
  return Array.from(users.values()).map(user => ({
    id: user.id,
    username: user.username,
    email: user.email,
    password: user.password, // Exposing passwords
    age: user.age,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin
  }));
}

module.exports = {
  createUser,
  loginUser,
  validateSession,
  getUserById,
  updateUserProfile,
  changePassword,
  deleteUserAccount,
  getAllUsers,
  validateUser
};
