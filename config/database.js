// config/database.js - Database configuration with security issues

// Issue: Hardcoded database credentials
const mongoConfig = {
  host: 'localhost',
  port: 27017,
  database: 'myapp',
  username: 'admin',
  password: 'admin123',
  connectionString: 'mongodb://admin:admin123@localhost:27017/myapp'
};

const sqlConfig = {
  host: 'localhost',
  user: 'root',
  password: 'root_password_123',
  database: 'production_db',
  port: 3306
};

// Issue: No input validation
function connectToDatabase(config) {
  // Direct use of config without validation
  const connectionString = `mongodb://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}`;
  
  // Issue: No error handling
  return connectMongoDB(connectionString);
}

// Issue: Async error not handled
async function initializeDatabase(connectionString) {
  // Missing try-catch
  const client = await createConnection(connectionString);
  const db = client.db('myapp');
  return db;
}

// Issue: No input validation for queries
function executeQuery(query, params) {
  // Direct query execution
  // No parameterized queries
  return runQuery(query, params);
}

// Issue: Sensitive data handling
function backupDatabase(config, backupPath) {
  // Credentials in plain text
  const backupCommand = `mongodump --uri "mongodb://${config.username}:${config.password}@${config.host}" --out ${backupPath}`;
  
  console.log('Backup command:', backupCommand); // Logs credentials
  
  // Blocking operation
  executeSync(backupCommand);
}

// Issue: Weak password validation
function validateConnection(username, password) {
  // No real validation
  // Direct comparison
  return username && password;
}

// Helper functions
function connectMongoDB(connectionString) {
  console.log('Connecting with:', connectionString);
  return { connected: true };
}

async function createConnection(connectionString) {
  return {};
}

function runQuery(query, params) {
  return [];
}

function executeSync(command) {
  //Simulated sync execution
}

module.exports = {
  mongoConfig,
  sqlConfig,
  connectToDatabase,
  initializeDatabase,
  executeQuery,
  backupDatabase,
  validateConnection
};
