const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const db = require('../db/database');

const router = express.Router();
router.use(authMiddleware);

// GET /api/memory
router.get('/', (req, res) => {
  const memories = db.getUserMemory(req.user.id);
  res.json({ memories });
});

// POST /api/memory
router.post('/', (req, res) => {
  const { category, key, value, context } = req.body;
  if (!key || !value) {
    return res.status(400).json({ error: 'Key and value are required' });
  }
  const memory = db.addMemory({ userId: req.user.id, category, key, value, context });
  res.status(201).json({ memory });
});

// DELETE /api/memory/:id
router.delete('/:id', (req, res) => {
  db.deleteMemory(req.params.id);
  res.json({ message: 'Memory deleted' });
});

module.exports = router;
