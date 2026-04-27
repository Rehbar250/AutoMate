const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const { getDb, getUserStats } = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:4173'], credentials: true }));
app.use(express.json({ limit: '10mb' }));

const authRoutes = require('./routes/auth');
const agentRoutes = require('./routes/agent');
const workflowRoutes = require('./routes/workflows');
const memoryRoutes = require('./routes/memory');
const toolRoutes = require('./routes/tools');
const { authMiddleware } = require('./middleware/auth');

app.use('/api/auth', authRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/memory', memoryRoutes);
app.use('/api/tools', toolRoutes);

app.get('/api/dashboard/stats', authMiddleware, (req, res) => {
  const stats = getUserStats(req.user.id);
  const { getAllTools } = require('./tools/registry');
  stats.availableTools = getAllTools().length;
  res.json(stats);
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', version: '2.0.0', name: 'AutoMate AI Platform', mode: process.env.OPENAI_API_KEY ? 'ai-powered' : 'demo', timestamp: new Date().toISOString() });
});

const clientBuildPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientBuildPath));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  }
});

async function start() {
  await getDb();
  app.listen(PORT, () => {
    console.log(`\n⚡ AutoMate AI Platform running at http://localhost:${PORT}`);
    console.log(`📡 Mode: ${process.env.OPENAI_API_KEY ? 'AI-Powered' : 'Demo Mode'}\n`);
  });
}

start().catch(console.error);
module.exports = app;
