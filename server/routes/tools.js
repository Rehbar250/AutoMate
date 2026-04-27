const express = require('express');
const { getAllTools } = require('../tools/registry');

const router = express.Router();

// GET /api/tools — List all available tools (public endpoint for tool discovery)
router.get('/', (req, res) => {
  const tools = getAllTools();
  res.json({ tools, count: tools.length });
});

module.exports = router;
