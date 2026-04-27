const express = require('express');
const jwt = require('jsonwebtoken');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');
const agent = require('../agent/engine');
const db = require('../db/database');

const router = express.Router();

// POST /api/agent/execute
router.post('/execute', authMiddleware, async (req, res) => {
  try {
    const { prompt, sessionId } = req.body;
    if (!prompt || !prompt.trim()) return res.status(400).json({ error: 'Prompt is required' });

    const sid = sessionId || `session_${Date.now()}`;
    db.addChatMessage({ userId: req.user.id, sessionId: sid, role: 'user', content: prompt });

    const execution = db.createExecution({ userId: req.user.id, prompt });
    agent.run(req.user.id, prompt, execution.id);

    res.json({ executionId: execution.id, sessionId: sid, status: 'started' });
  } catch (error) {
    console.error('Agent execute error:', error);
    res.status(500).json({ error: 'Failed to start agent execution' });
  }
});

// GET /api/agent/stream/:executionId — SSE (auth via query param since EventSource can't set headers)
router.get('/stream/:executionId', (req, res) => {
  // Auth via query param
  const token = req.query.token;
  if (token) {
    try { jwt.verify(token, JWT_SECRET); } catch { /* non-critical for SSE */ }
  }

  const { executionId } = req.params;
  res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive', 'Access-Control-Allow-Origin': '*' });

  const send = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

  const existing = agent.getExecutionStatus(executionId);
  if (existing && (existing.status === 'completed' || existing.status === 'failed')) {
    if (existing.logs) existing.logs.forEach(log => send('step', { index: log.step_index, tool: log.tool_name, description: log.description, reasoning: log.reasoning, status: log.status, output: log.output, durationMs: log.duration_ms }));
    send('complete', { status: existing.status, stepsCompleted: existing.logs?.length || 0 });
    return res.end();
  }

  const onPlan = (d) => send('plan', d);
  const onStep = (d) => send('step', d);
  const onStatus = (d) => send('status', d);
  const onComplete = (d) => { send('complete', d); cleanup(); res.end(); };
  const onError = (d) => { send('error', d); cleanup(); res.end(); };

  agent.on(`plan:${executionId}`, onPlan);
  agent.on(`step:${executionId}`, onStep);
  agent.on(`status:${executionId}`, onStatus);
  agent.on(`complete:${executionId}`, onComplete);
  agent.on(`error:${executionId}`, onError);

  function cleanup() {
    agent.removeListener(`plan:${executionId}`, onPlan);
    agent.removeListener(`step:${executionId}`, onStep);
    agent.removeListener(`status:${executionId}`, onStatus);
    agent.removeListener(`complete:${executionId}`, onComplete);
    agent.removeListener(`error:${executionId}`, onError);
  }

  req.on('close', cleanup);
  setTimeout(() => { send('timeout', { message: 'Stream timed out' }); cleanup(); res.end(); }, 5 * 60 * 1000);
});

// GET /api/agent/executions
router.get('/executions', authMiddleware, (req, res) => {
  const executions = db.getUserExecutions(req.user.id, parseInt(req.query.limit) || 50);
  res.json({ executions });
});

// GET /api/agent/executions/:id
router.get('/executions/:id', authMiddleware, (req, res) => {
  const execution = db.getExecution(req.params.id);
  if (!execution) return res.status(404).json({ error: 'Execution not found' });
  if (execution.user_id !== req.user.id) return res.status(403).json({ error: 'Access denied' });
  const logs = db.getExecutionLogs(req.params.id);
  res.json({ ...execution, logs });
});

module.exports = router;
