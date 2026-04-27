module.exports = {
  name: 'api_fetcher',
  description: 'Make HTTP requests to external APIs. Supports GET and POST methods. Returns parsed JSON response data.',
  category: 'integration',
  icon: '🌐',
  parameters: {
    type: 'object',
    properties: {
      url: { type: 'string', description: 'The URL to fetch data from' },
      method: { type: 'string', enum: ['GET', 'POST'], description: 'HTTP method', default: 'GET' },
      headers: { type: 'object', description: 'Custom request headers' },
      body: { type: 'object', description: 'Request body for POST requests' }
    },
    required: ['url']
  },

  async execute(params) {
    const { url, method = 'GET', headers = {}, body } = params;

    try {
      // Validate URL
      new URL(url);
    } catch {
      return { success: false, error: 'Invalid URL provided' };
    }

    try {
      const options = {
        method,
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'AutoMate-Agent/2.0', ...headers },
      };

      if (method === 'POST' && body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);
      const contentType = response.headers.get('content-type') || '';

      let data;
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
        // Truncate large text responses
        if (typeof data === 'string' && data.length > 5000) {
          data = data.substring(0, 5000) + '... [truncated]';
        }
      }

      return {
        success: response.ok,
        statusCode: response.status,
        statusText: response.statusText,
        contentType,
        data,
        fetchedAt: new Date().toISOString()
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};
