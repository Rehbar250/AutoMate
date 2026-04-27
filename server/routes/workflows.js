const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const db = require('../db/database');
const agent = require('../agent/engine');

const router = express.Router();
router.use(authMiddleware);

// GET /api/workflows — List user's workflows
router.get('/', (req, res) => {
  const workflows = db.getUserWorkflows(req.user.id);
  res.json({ workflows });
});

// POST /api/workflows — Create a new workflow
router.post('/', (req, res) => {
  const { name, description, steps, isAiGenerated } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Workflow name is required' });
  }

  const workflow = db.createWorkflow({
    userId: req.user.id,
    name,
    description: description || '',
    steps: steps || [],
    isAiGenerated: isAiGenerated || false
  });

  res.status(201).json({ workflow });
});

// GET /api/workflows/:id
router.get('/:id', (req, res) => {
  const workflow = db.getWorkflow(req.params.id);
  if (!workflow) return res.status(404).json({ error: 'Workflow not found' });
  if (workflow.user_id !== req.user.id) return res.status(403).json({ error: 'Access denied' });
  res.json({ workflow });
});

// PUT /api/workflows/:id — Update workflow
router.put('/:id', (req, res) => {
  const existing = db.getWorkflow(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Workflow not found' });
  if (existing.user_id !== req.user.id) return res.status(403).json({ error: 'Access denied' });

  const { name, description, steps } = req.body;
  const updated = db.updateWorkflow(req.params.id, { name, description, steps });
  res.json({ workflow: updated });
});

// DELETE /api/workflows/:id
router.delete('/:id', (req, res) => {
  const existing = db.getWorkflow(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Workflow not found' });
  if (existing.user_id !== req.user.id) return res.status(403).json({ error: 'Access denied' });

  db.deleteWorkflow(req.params.id);
  res.json({ message: 'Workflow deleted' });
});

// POST /api/workflows/:id/execute — Run a saved workflow
router.post('/:id/execute', async (req, res) => {
  const workflow = db.getWorkflow(req.params.id);
  if (!workflow) return res.status(404).json({ error: 'Workflow not found' });
  if (workflow.user_id !== req.user.id) return res.status(403).json({ error: 'Access denied' });

  // Convert workflow steps into a prompt and execute
  const stepsDesc = workflow.steps.map((s, i) => `${i + 1}. ${s.description || s.tool}`).join('\n');
  const prompt = `Execute workflow "${workflow.name}": \n${stepsDesc}`;

  const execution = db.createExecution({ userId: req.user.id, workflowId: workflow.id, prompt });
  agent.run(req.user.id, prompt, execution.id);

  res.json({
    executionId: execution.id,
    status: 'started',
    message: `Executing workflow: ${workflow.name}`
  });
});

module.exports = router;
