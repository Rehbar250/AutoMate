module.exports = {
  name: 'email_sender',
  description: 'Send an email to one or more recipients with a subject and body. Can send plain text or HTML formatted emails.',
  category: 'communication',
  icon: '📧',
  parameters: {
    type: 'object',
    properties: {
      to: { type: 'string', description: 'Recipient email address(es), comma-separated' },
      subject: { type: 'string', description: 'Email subject line' },
      body: { type: 'string', description: 'Email body content' },
      format: { type: 'string', enum: ['text', 'html'], description: 'Email format', default: 'text' }
    },
    required: ['to', 'subject', 'body']
  },

  async execute(params) {
    const { to, subject, body, format = 'text' } = params;

    // Simulate realistic email sending with validation
    const recipients = to.split(',').map(e => e.trim()).filter(Boolean);

    if (recipients.length === 0) {
      return { success: false, error: 'No valid recipients provided' };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = recipients.filter(e => !emailRegex.test(e));
    if (invalidEmails.length > 0) {
      return { success: false, error: `Invalid email addresses: ${invalidEmails.join(', ')}` };
    }

    // Simulate sending delay
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      success: true,
      messageId,
      recipients,
      subject,
      bodyPreview: body.substring(0, 100) + (body.length > 100 ? '...' : ''),
      format,
      sentAt: new Date().toISOString(),
      status: 'delivered'
    };
  }
};
