/**
 * AI Agent Engine — the core orchestrator.
 * Takes a user prompt, plans tasks, executes them step-by-step,
 * and provides real-time updates via event emitters.
 */
const { EventEmitter } = require('events');
const { createDemoPlan, createLLMPlan } = require('./planner');
const { executeStep } = require('./executor');
const { getContextString, learnFromExecution } = require('./memory');
const db = require('../db/database');

let openai = null;

// Initialize OpenAI if key is available
try {
  const OpenAI = require('openai');
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    console.log('✅ OpenAI API connected — using LLM-powered planning');
  } else {
    console.log('ℹ️  No OPENAI_API_KEY found — using intelligent demo mode');
  }
} catch (e) {
  console.log('ℹ️  OpenAI module not available — using demo mode');
}

class AgentEngine extends EventEmitter {
  constructor() {
    super();
  }

  /**
   * Execute a user prompt end-to-end.
   * Returns the execution ID immediately.
   * Emits events: 'plan', 'step:start', 'step:complete', 'step:error', 'complete', 'error'
   */
  async run(userId, prompt, executionId) {
    const execution = db.createExecution({ userId, prompt });
    const execId = executionId || execution.id;

    // Run async — don't block
    this._execute(userId, prompt, execId).catch(err => {
      console.error('Agent execution error:', err);
      this.emit(`error:${execId}`, { error: err.message });
    });

    return execId;
  }

  async _execute(userId, prompt, execId) {
    try {
      // Update status to running
      db.updateExecution(execId, { status: 'running' });
      this.emit(`status:${execId}`, { status: 'running', phase: 'planning' });

      // 1. Get user context for personalization
      const userContext = getContextString(userId);

      // 2. Create the plan
      let plan;
      if (openai) {
        plan = await createLLMPlan(
          userContext ? `${prompt}\n\n${userContext}` : prompt,
          openai
        );
      } else {
        // Add a realistic "thinking" delay for demo mode
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
        plan = createDemoPlan(prompt);
      }

      this.emit(`plan:${execId}`, {
        goal: plan.goal,
        reasoning: plan.reasoning,
        totalSteps: plan.steps.length,
        steps: plan.steps.map((s, i) => ({
          index: i,
          tool: s.tool,
          description: s.description,
          status: 'pending'
        }))
      });

      // 3. Execute each step sequentially
      const logIds = [];
      const toolsUsed = [];

      for (let i = 0; i < plan.steps.length; i++) {
        const step = plan.steps[i];

        // Create log entry
        const logId = db.createExecutionLog({
          executionId: execId,
          stepIndex: i,
          toolName: step.tool,
          description: step.description,
          input: step.params,
          reasoning: step.reasoning || ''
        });
        logIds.push(logId);

        // Emit step start
        this.emit(`step:${execId}`, {
          index: i,
          tool: step.tool,
          description: step.description,
          reasoning: step.reasoning,
          status: 'running'
        });

        // Update log status
        db.updateExecutionLog(logId, { status: 'running' });

        // Execute the step
        const result = await executeStep(step);

        // Update log with result
        db.updateExecutionLog(logId, {
          status: result.success ? 'completed' : 'failed',
          output: result.output,
          durationMs: result.durationMs
        });

        toolsUsed.push(step.tool);

        // Emit step completion
        this.emit(`step:${execId}`, {
          index: i,
          tool: step.tool,
          description: step.description,
          status: result.success ? 'completed' : 'failed',
          output: result.output,
          durationMs: result.durationMs,
          error: result.error
        });

        // Small delay between steps for UX
        if (i < plan.steps.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      // 4. Mark execution as complete
      db.updateExecution(execId, {
        status: 'completed',
        completedAt: new Date().toISOString()
      });

      // 5. Learn from this execution
      learnFromExecution(userId, { prompt, tools: toolsUsed });

      // 6. Emit completion
      this.emit(`complete:${execId}`, {
        status: 'completed',
        goal: plan.goal,
        stepsCompleted: plan.steps.length,
        toolsUsed
      });

    } catch (error) {
      db.updateExecution(execId, {
        status: 'failed',
        completedAt: new Date().toISOString()
      });

      this.emit(`error:${execId}`, { error: error.message });
      throw error;
    }
  }

  /**
   * Get the current execution status with all logs
   */
  getExecutionStatus(execId) {
    const execution = db.getExecution(execId);
    if (!execution) return null;

    const logs = db.getExecutionLogs(execId);
    return { ...execution, logs };
  }
}

// Singleton instance
const agent = new AgentEngine();

module.exports = agent;
