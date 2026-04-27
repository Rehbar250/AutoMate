module.exports = {
  name: 'web_scraper',
  description: 'Extract and summarize content from web pages. Returns page title, main text content, links, and metadata.',
  category: 'integration',
  icon: '🔍',
  parameters: {
    type: 'object',
    properties: {
      url: { type: 'string', description: 'URL of the web page to scrape' },
      extract: { type: 'string', enum: ['text', 'links', 'metadata', 'all'], description: 'What to extract', default: 'all' }
    },
    required: ['url']
  },

  async execute(params) {
    const { url, extract = 'all' } = params;

    try {
      new URL(url);
    } catch {
      return { success: false, error: 'Invalid URL provided' };
    }

    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'AutoMate-Agent/2.0 (Bot)' }
      });

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
      }

      const html = await response.text();

      // Basic HTML parsing without external dependencies
      const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : 'No title found';

      // Extract meta description
      const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)/i);
      const description = descMatch ? descMatch[1].trim() : '';

      // Strip HTML tags for text content
      const textContent = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 3000);

      // Extract links
      const linkRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi;
      const links = [];
      let match;
      while ((match = linkRegex.exec(html)) !== null && links.length < 20) {
        links.push({ href: match[1], text: match[2].trim() });
      }

      const result = { success: true, url, scrapedAt: new Date().toISOString() };

      if (extract === 'text' || extract === 'all') {
        result.title = title;
        result.textContent = textContent;
      }
      if (extract === 'links' || extract === 'all') {
        result.links = links;
        result.linkCount = links.length;
      }
      if (extract === 'metadata' || extract === 'all') {
        result.metadata = { title, description, contentLength: html.length };
      }

      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};
