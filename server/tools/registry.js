/**
 * Tool Registry — manages all available automation tools.
 * Each tool module exports: { name, description, category, icon, parameters, execute }
 */

const tools = new Map();

function registerTool(toolModule) {
  if (!toolModule.name || !toolModule.execute) {
    throw new Error(`Tool must have a 'name' and 'execute' function`);
  }
  tools.set(toolModule.name, {
    name: toolModule.name,
    description: toolModule.description || '',
    category: toolModule.category || 'general',
    icon: toolModule.icon || '🔧',
    parameters: toolModule.parameters || {},
    execute: toolModule.execute
  });
}

function getTool(name) {
  return tools.get(name);
}

function getAllTools() {
  return Array.from(tools.values()).map(t => ({
    name: t.name,
    description: t.description,
    category: t.category,
    icon: t.icon,
    parameters: t.parameters
  }));
}

function getToolsForLLM() {
  return getAllTools().map(t => ({
    name: t.name,
    description: t.description,
    parameters: t.parameters
  }));
}

// ─── Register Built-in Tools ───
registerTool(require('./email-sender'));
registerTool(require('./api-fetcher'));
registerTool(require('./data-analyzer'));
registerTool(require('./file-processor'));
registerTool(require('./web-scraper'));

module.exports = { registerTool, getTool, getAllTools, getToolsForLLM };
