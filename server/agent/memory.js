/**
 * Memory Manager — stores and retrieves user context for personalized automation.
 */
const db = require('../db/database');

function storeMemory(userId, { category, key, value, context }) {
  return db.addMemory({ userId, category: category || 'auto', key, value, context: context || '' });
}

function getContext(userId) {
  const memories = db.getUserMemory(userId);

  // Group by category
  const grouped = {};
  for (const mem of memories) {
    if (!grouped[mem.category]) grouped[mem.category] = [];
    grouped[mem.category].push({ key: mem.key, value: mem.value });
  }

  return grouped;
}

function getContextString(userId) {
  const ctx = getContext(userId);
  if (Object.keys(ctx).length === 0) return '';

  let str = 'User context from previous interactions:\n';
  for (const [category, items] of Object.entries(ctx)) {
    str += `\n[${category}]\n`;
    for (const item of items.slice(0, 5)) {
      str += `- ${item.key}: ${item.value}\n`;
    }
  }
  return str;
}

function learnFromExecution(userId, execution) {
  // Auto-learn: store the tools used for this type of prompt
  const promptWords = execution.prompt.toLowerCase().split(/\s+/).slice(0, 3).join('_');
  storeMemory(userId, {
    category: 'execution_history',
    key: `last_${promptWords}`,
    value: `Used tools: ${execution.tools?.join(', ') || 'unknown'}`,
    context: execution.prompt
  });
}

function clearMemory(userId, memoryId) {
  db.deleteMemory(memoryId);
}

module.exports = { storeMemory, getContext, getContextString, learnFromExecution, clearMemory };
