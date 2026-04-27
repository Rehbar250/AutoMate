/**
 * AI Agent Planner — takes user intent and produces an executable task plan.
 * Uses OpenAI when available, falls back to intelligent demo mode.
 */
const { getToolsForLLM } = require('../tools/registry');

const DEMO_PLANS = {
  email: {
    keywords: ['email', 'send', 'mail', 'notify', 'notification', 'message'],
    plan: (prompt) => ({
      goal: `Process email task: "${prompt}"`,
      reasoning: 'The user wants to perform an email-related operation. I\'ll analyze the content, prepare the message, and send it via the email tool.',
      steps: [
        { tool: 'data_analyzer', description: 'Analyze request context and extract key information', params: { data: [{ request: prompt, type: 'email_task', priority: 'normal' }], operation: 'summarize' }, reasoning: 'First, I need to understand what data or context is available for the email.' },
        { tool: 'file_processor', description: 'Generate email content from analysis', params: { action: 'generate_report', title: 'Email Content Draft', format: 'txt', data: { prompt, type: 'email' } }, reasoning: 'Creating a well-formatted email body based on the analysis.' },
        { tool: 'email_sender', description: 'Send the composed email', params: { to: 'team@company.com', subject: `AutoMate: ${prompt.substring(0, 50)}`, body: `This automated email was generated based on your request: "${prompt}"` }, reasoning: 'Delivering the email to the target recipients.' }
      ]
    })
  },
  report: {
    keywords: ['report', 'summary', 'summarize', 'analyze', 'analysis', 'generate', 'create report'],
    plan: (prompt) => ({
      goal: `Generate report: "${prompt}"`,
      reasoning: 'The user needs a data report. I\'ll fetch relevant data, analyze it, and generate a comprehensive report.',
      steps: [
        { tool: 'api_fetcher', description: 'Fetch data from configured sources', params: { url: 'https://jsonplaceholder.typicode.com/posts', method: 'GET' }, reasoning: 'Gathering raw data from the API endpoint to use as the basis for the report.' },
        { tool: 'data_analyzer', description: 'Analyze and extract insights from the data', params: { data: [{ id: 1, value: 85 }, { id: 2, value: 92 }, { id: 3, value: 78 }, { id: 4, value: 95 }, { id: 5, value: 88 }], operation: 'summarize' }, reasoning: 'Running statistical analysis on the dataset to identify key metrics and patterns.' },
        { tool: 'data_analyzer', description: 'Identify trends in the data', params: { data: [{ id: 1, value: 85 }, { id: 2, value: 92 }, { id: 3, value: 78 }, { id: 4, value: 95 }, { id: 5, value: 88 }], operation: 'trend', field: 'value' }, reasoning: 'Looking for upward or downward trends that should be highlighted in the report.' },
        { tool: 'file_processor', description: 'Generate formatted report document', params: { action: 'generate_report', title: prompt, format: 'markdown', data: { summary: 'Auto-generated report', metrics: { total: 5, avg: 87.6, trend: 'stable' } } }, reasoning: 'Compiling all insights into a well-structured markdown report.' }
      ]
    })
  },
  automate: {
    keywords: ['automate', 'automation', 'schedule', 'daily', 'task', 'workflow', 'routine'],
    plan: (prompt) => ({
      goal: `Set up automation: "${prompt}"`,
      reasoning: 'The user wants to automate a recurring task. I\'ll identify the steps, create the workflow, and configure it for execution.',
      steps: [
        { tool: 'data_analyzer', description: 'Analyze task requirements and dependencies', params: { data: [{ task: prompt, type: 'automation', status: 'planning' }], operation: 'summarize' }, reasoning: 'Breaking down the automation request into actionable components.' },
        { tool: 'api_fetcher', description: 'Check external service availability', params: { url: 'https://httpbin.org/get', method: 'GET' }, reasoning: 'Verifying that all required external services are accessible before configuring the automation.' },
        { tool: 'file_processor', description: 'Create automation configuration', params: { action: 'generate_report', title: 'Automation Config', format: 'json', data: { name: prompt, schedule: '0 9 * * 1-5', actions: ['fetch', 'process', 'notify'] } }, reasoning: 'Generating a reusable configuration file for the scheduled automation.' },
        { tool: 'email_sender', description: 'Send automation setup confirmation', params: { to: 'admin@company.com', subject: `Automation Created: ${prompt.substring(0, 40)}`, body: `Your automation "${prompt}" has been successfully configured and will run on the specified schedule.` }, reasoning: 'Notifying the user that their automation has been successfully set up.' }
      ]
    })
  },
  scrape: {
    keywords: ['scrape', 'crawl', 'extract', 'website', 'web page', 'fetch page'],
    plan: (prompt) => ({
      goal: `Web data extraction: "${prompt}"`,
      reasoning: 'The user wants to extract information from the web. I\'ll scrape the target page, analyze the content, and present the findings.',
      steps: [
        { tool: 'web_scraper', description: 'Extract content from target web page', params: { url: 'https://example.com', extract: 'all' }, reasoning: 'Fetching the raw content from the specified web page.' },
        { tool: 'data_analyzer', description: 'Analyze extracted content', params: { data: [{ source: 'web', content: 'extracted text', links: 15 }], operation: 'summarize' }, reasoning: 'Processing and organizing the scraped data into a structured format.' },
        { tool: 'file_processor', description: 'Save extraction results', params: { action: 'generate_report', title: 'Web Extraction Results', format: 'markdown', data: { url: 'https://example.com', extracted: true } }, reasoning: 'Saving the extracted data as a report for future reference.' }
      ]
    })
  },
  data: {
    keywords: ['data', 'csv', 'json', 'process', 'transform', 'clean', 'filter'],
    plan: (prompt) => ({
      goal: `Data processing: "${prompt}"`,
      reasoning: 'The user needs data processing capabilities. I\'ll load the data, clean and transform it, then provide the results.',
      steps: [
        { tool: 'file_processor', description: 'Read input data file', params: { action: 'read', filename: 'input_data.csv' }, reasoning: 'Loading the raw data from the specified file.' },
        { tool: 'data_analyzer', description: 'Profile and clean the dataset', params: { data: [{ id: 1, name: 'Sample', value: 42 }, { id: 2, name: 'Test', value: null }, { id: 3, name: 'Sample', value: 67 }], operation: 'summarize' }, reasoning: 'Checking data quality — looking for nulls, duplicates, and type mismatches.' },
        { tool: 'data_analyzer', description: 'Aggregate results by category', params: { data: [{ id: 1, name: 'Sample', value: 42 }, { id: 2, name: 'Test', value: 35 }, { id: 3, name: 'Sample', value: 67 }], operation: 'aggregate', field: 'name' }, reasoning: 'Grouping data by the identified key field to produce summary statistics.' },
        { tool: 'file_processor', description: 'Export processed results', params: { action: 'write', filename: 'processed_output.json', content: '{"processed": true, "records": 3}' }, reasoning: 'Saving the cleaned and transformed data to the output file.' }
      ]
    })
  }
};

function createDemoPlan(prompt) {
  const lower = prompt.toLowerCase();

  for (const [, template] of Object.entries(DEMO_PLANS)) {
    if (template.keywords.some(kw => lower.includes(kw))) {
      return template.plan(prompt);
    }
  }

  // Generic fallback plan
  return {
    goal: `Process request: "${prompt}"`,
    reasoning: 'Analyzing the user\'s request and executing the most appropriate sequence of tools to accomplish the goal.',
    steps: [
      { tool: 'web_scraper', description: 'Research and gather relevant information', params: { url: 'https://example.com', extract: 'text' }, reasoning: 'Gathering background information related to the request.' },
      { tool: 'data_analyzer', description: 'Analyze gathered information', params: { data: [{ query: prompt, relevance: 0.95, source: 'web' }], operation: 'summarize' }, reasoning: 'Processing and structuring the information gathered from research.' },
      { tool: 'file_processor', description: 'Generate output document', params: { action: 'generate_report', title: `Results: ${prompt}`, format: 'markdown', data: { query: prompt, status: 'completed' } }, reasoning: 'Compiling the final output into a readable document.' }
    ]
  };
}

async function createLLMPlan(prompt, openai) {
  const tools = getToolsForLLM();
  const systemPrompt = `You are an AI task planner for an automation platform called AutoMate. 
Your job is to take a user's natural language request and break it into a sequence of executable steps using the available tools.

Available tools:
${JSON.stringify(tools, null, 2)}

You MUST respond with valid JSON in this exact format:
{
  "goal": "Brief description of the overall goal",
  "reasoning": "Why you chose this approach",
  "steps": [
    {
      "tool": "tool_name",
      "description": "What this step does",
      "params": { ... tool-specific parameters ... },
      "reasoning": "Why this step is needed"
    }
  ]
}

Rules:
1. Use only the tools listed above.
2. Order steps logically — outputs from early steps feed into later ones.
3. Keep it practical: 2-5 steps for simple tasks, up to 7 for complex ones.
4. Each step's reasoning should be concise (1-2 sentences).
5. Use realistic parameter values that match the user's intent.`;

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_API_KEY?.startsWith('AIza') ? 'gemini-1.5-flash' : 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: 'json_object' }
    });

    const plan = JSON.parse(response.choices[0].message.content);
    return plan;
  } catch (error) {
    console.error('LLM planning failed, falling back to demo mode:', error.message);
    return createDemoPlan(prompt);
  }
}

module.exports = { createDemoPlan, createLLMPlan };
