const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, '..', 'automate.db');
let db;

async function getDb() {
  if (db) return db;
  const SQL = await initSqlJs();
  
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  
  initSchema();
  return db;
}

function saveDb() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

// Auto-save every 10 seconds
setInterval(saveDb, 10000);

function initSchema() {
  db.run(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, name TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now')))`);
  db.run(`CREATE TABLE IF NOT EXISTS workflows (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, name TEXT NOT NULL, description TEXT DEFAULT '', steps TEXT DEFAULT '[]', is_ai_generated INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')))`);
  db.run(`CREATE TABLE IF NOT EXISTS executions (id TEXT PRIMARY KEY, workflow_id TEXT, user_id TEXT NOT NULL, prompt TEXT DEFAULT '', status TEXT DEFAULT 'pending', started_at TEXT DEFAULT (datetime('now')), completed_at TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS execution_logs (id TEXT PRIMARY KEY, execution_id TEXT NOT NULL, step_index INTEGER NOT NULL, tool_name TEXT NOT NULL, description TEXT DEFAULT '', status TEXT DEFAULT 'pending', input TEXT DEFAULT '{}', output TEXT DEFAULT '{}', reasoning TEXT DEFAULT '', duration_ms INTEGER DEFAULT 0, timestamp TEXT DEFAULT (datetime('now')))`);
  db.run(`CREATE TABLE IF NOT EXISTS memory (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, category TEXT DEFAULT 'general', key TEXT NOT NULL, value TEXT NOT NULL, context TEXT DEFAULT '', created_at TEXT DEFAULT (datetime('now')))`);
  db.run(`CREATE TABLE IF NOT EXISTS chat_messages (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, session_id TEXT NOT NULL, role TEXT NOT NULL, content TEXT NOT NULL, metadata TEXT DEFAULT '{}', timestamp TEXT DEFAULT (datetime('now')))`);
}

// Helper: run a query and return rows
function all(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function get(sql, params = []) {
  const rows = all(sql, params);
  return rows[0] || null;
}

function run(sql, params = []) {
  db.run(sql, params);
  saveDb();
}

// ─── User Helpers ───
function createUser({ email, passwordHash, name }) {
  const id = uuidv4();
  run('INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)', [id, email, passwordHash, name]);
  return { id, email, name };
}
function findUserByEmail(email) { return get('SELECT * FROM users WHERE email = ?', [email]); }
function findUserById(id) { return get('SELECT id, email, name, created_at FROM users WHERE id = ?', [id]); }

// ─── Workflow Helpers ───
function createWorkflow({ userId, name, description, steps, isAiGenerated }) {
  const id = uuidv4();
  run('INSERT INTO workflows (id, user_id, name, description, steps, is_ai_generated) VALUES (?, ?, ?, ?, ?, ?)', [id, userId, name, description || '', JSON.stringify(steps || []), isAiGenerated ? 1 : 0]);
  return getWorkflow(id);
}
function getWorkflow(id) {
  const row = get('SELECT * FROM workflows WHERE id = ?', [id]);
  if (row) row.steps = JSON.parse(row.steps);
  return row;
}
function getUserWorkflows(userId) {
  return all('SELECT * FROM workflows WHERE user_id = ? ORDER BY updated_at DESC', [userId]).map(r => ({ ...r, steps: JSON.parse(r.steps) }));
}
function updateWorkflow(id, { name, description, steps }) {
  const parts = []; const params = [];
  if (name !== undefined) { parts.push('name = ?'); params.push(name); }
  if (description !== undefined) { parts.push('description = ?'); params.push(description); }
  if (steps !== undefined) { parts.push('steps = ?'); params.push(JSON.stringify(steps)); }
  parts.push("updated_at = datetime('now')");
  params.push(id);
  run(`UPDATE workflows SET ${parts.join(', ')} WHERE id = ?`, params);
  return getWorkflow(id);
}
function deleteWorkflow(id) { run('DELETE FROM workflows WHERE id = ?', [id]); }

// ─── Execution Helpers ───
function createExecution({ userId, workflowId, prompt }) {
  const id = uuidv4();
  run('INSERT INTO executions (id, workflow_id, user_id, prompt, status) VALUES (?, ?, ?, ?, ?)', [id, workflowId || null, userId, prompt || '', 'pending']);
  return { id, user_id: userId, workflow_id: workflowId, prompt, status: 'pending' };
}
function updateExecution(id, { status, completedAt }) {
  const parts = []; const params = [];
  if (status) { parts.push('status = ?'); params.push(status); }
  if (completedAt) { parts.push('completed_at = ?'); params.push(completedAt); }
  params.push(id);
  run(`UPDATE executions SET ${parts.join(', ')} WHERE id = ?`, params);
}
function getExecution(id) { return get('SELECT * FROM executions WHERE id = ?', [id]); }
function getUserExecutions(userId, limit = 50) {
  return all('SELECT * FROM executions WHERE user_id = ? ORDER BY started_at DESC LIMIT ?', [userId, limit]);
}

// ─── Execution Log Helpers ───
function createExecutionLog({ executionId, stepIndex, toolName, description, input, reasoning }) {
  const id = uuidv4();
  run('INSERT INTO execution_logs (id, execution_id, step_index, tool_name, description, status, input, reasoning) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [id, executionId, stepIndex, toolName, description || '', 'pending', JSON.stringify(input || {}), reasoning || '']);
  return id;
}
function updateExecutionLog(id, { status, output, durationMs }) {
  const parts = []; const params = [];
  if (status) { parts.push('status = ?'); params.push(status); }
  if (output !== undefined) { parts.push('output = ?'); params.push(JSON.stringify(output)); }
  if (durationMs !== undefined) { parts.push('duration_ms = ?'); params.push(durationMs); }
  params.push(id);
  run(`UPDATE execution_logs SET ${parts.join(', ')} WHERE id = ?`, params);
}
function getExecutionLogs(executionId) {
  return all('SELECT * FROM execution_logs WHERE execution_id = ? ORDER BY step_index ASC', [executionId]).map(r => ({ ...r, input: JSON.parse(r.input), output: JSON.parse(r.output) }));
}

// ─── Memory Helpers ───
function addMemory({ userId, category, key, value, context }) {
  const id = uuidv4();
  run('INSERT INTO memory (id, user_id, category, key, value, context) VALUES (?, ?, ?, ?, ?, ?)', [id, userId, category || 'general', key, value, context || '']);
  return { id, user_id: userId, category, key, value };
}
function getUserMemory(userId) { return all('SELECT * FROM memory WHERE user_id = ? ORDER BY created_at DESC LIMIT 100', [userId]); }
function deleteMemory(id) { run('DELETE FROM memory WHERE id = ?', [id]); }

// ─── Chat Helpers ───
function addChatMessage({ userId, sessionId, role, content, metadata }) {
  const id = uuidv4();
  run('INSERT INTO chat_messages (id, user_id, session_id, role, content, metadata) VALUES (?, ?, ?, ?, ?, ?)', [id, userId, sessionId, role, content, JSON.stringify(metadata || {})]);
  return id;
}
function getSessionMessages(userId, sessionId) {
  return all('SELECT * FROM chat_messages WHERE user_id = ? AND session_id = ? ORDER BY timestamp ASC', [userId, sessionId]).map(r => ({ ...r, metadata: JSON.parse(r.metadata) }));
}

// ─── Stats ───
function getUserStats(userId) {
  const totalExecutions = get('SELECT COUNT(*) as count FROM executions WHERE user_id = ?', [userId])?.count || 0;
  const successfulExecutions = get("SELECT COUNT(*) as count FROM executions WHERE user_id = ? AND status = 'completed'", [userId])?.count || 0;
  const totalWorkflows = get('SELECT COUNT(*) as count FROM workflows WHERE user_id = ?', [userId])?.count || 0;
  const recentExecutions = all('SELECT * FROM executions WHERE user_id = ? ORDER BY started_at DESC LIMIT 5', [userId]);
  return { totalExecutions, successfulExecutions, successRate: totalExecutions > 0 ? Math.round((successfulExecutions / totalExecutions) * 100) : 0, totalWorkflows, recentExecutions };
}

module.exports = {
  getDb, createUser, findUserByEmail, findUserById,
  createWorkflow, getWorkflow, getUserWorkflows, updateWorkflow, deleteWorkflow,
  createExecution, updateExecution, getExecution, getUserExecutions,
  createExecutionLog, updateExecutionLog, getExecutionLogs,
  addMemory, getUserMemory, deleteMemory,
  addChatMessage, getSessionMessages, getUserStats
};
