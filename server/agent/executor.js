/**
 * Tool Executor — runs individual tools and captures results.
 */
const { getTool } = require('../tools/registry');

async function executeStep(step) {
  const tool = getTool(step.tool);

  if (!tool) {
    return {
      success: false,
      error: `Tool "${step.tool}" not found in registry`,
      durationMs: 0
    };
  }

  const startTime = Date.now();

  try {
    const result = await tool.execute(step.params || {});
    const durationMs = Date.now() - startTime;

    return {
      success: result.success !== false,
      output: result,
      durationMs
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    return {
      success: false,
      error: error.message,
      output: { success: false, error: error.message },
      durationMs
    };
  }
}

module.exports = { executeStep };
