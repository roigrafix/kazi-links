import { getSecretValue } from 'wix-secrets-backend';

/**
 * Secure backend function to send emails via SendGrid
 * This prevents API key exposure in client-side code
 * 
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - Email HTML content
 * @param {string} [options.from] - Sender email (optional)
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function sendEmail(options) {
  try {
    // Validate input
    if (!options.to || !options.subject || !options.html) {
      return {
        success: false,
        message: 'Missing required fields: to, subject, html'
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(options.to)) {
      return {
        success: false,
        message: 'Invalid email address'
      };
    }

    // Get SendGrid API key from Wix Secrets (secure storage)
    let apiKey;
    try {
      apiKey = await getSecretValue('sendgrid_api_key');
    } catch (error) {
      console.error('Failed to retrieve SendGrid API key from secrets');
      return {
        success: false,
        message: 'Email service is temporarily unavailable'
      };
    }

    if (!apiKey) {
      console.error('SendGrid API key not configured in Wix Secrets');
      return {
        success: false,
        message: 'Email service is not configured'
      };
    }

    // Prepare SendGrid request
    const sendGridUrl = 'https://api.sendgrid.com/v3/mail/send';
    const fromEmail = options.from || 'noreply@servicebooking.com';

    const payload = {
      personalizations: [
        {
          to: [{ email: options.to }],
          subject: options.subject,
        },
      ],
      from: { email: fromEmail },
      content: [
        {
          type: 'text/html',
          value: options.html,
        },
      ],
    };

    // Send email via SendGrid API
    const response = await fetch(sendGridUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('SendGrid API error:', error);
      return {
        success: false,
        message: 'Failed to send email'
      };
    }

    return {
      success: true,
      message: 'Email sent successfully'
    };
  } catch (error) {
    console.error('Error in sendEmail function:', error);
    return {
      success: false,
      message: 'An error occurred while sending email'
    };
  }
}
