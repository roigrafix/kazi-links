/**
 * Notification Service for OTP delivery via Email (SendGrid) and SMS (Twilio)
 */

export interface OTPDeliveryOptions {
  method: 'email' | 'sms';
  recipient: string; // email address or phone number
  code: string;
  bookingDetails?: {
    serviceName: string;
    freelancerName: string;
    bookingDate: string;
    bookingTime: string;
  };
}

export interface OTPDeliveryResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider?: string;
}

class NotificationService {
  private sendGridApiKey: string | null = null;
  private twilioAccountSid: string | null = null;
  private twilioAuthToken: string | null = null;
  private twilioPhoneNumber: string | null = null;

  constructor() {
    // Initialize with environment variables or provided credentials
    this.sendGridApiKey = import.meta.env.VITE_SENDGRID_API_KEY || null;
    this.twilioAccountSid = import.meta.env.VITE_TWILIO_ACCOUNT_SID || null;
    this.twilioAuthToken = import.meta.env.VITE_TWILIO_AUTH_TOKEN || null;
    this.twilioPhoneNumber = import.meta.env.VITE_TWILIO_PHONE_NUMBER || null;
  }

  /**
   * Set SendGrid API key for email delivery
   */
  setSendGridApiKey(apiKey: string) {
    this.sendGridApiKey = apiKey;
  }

  /**
   * Set Twilio credentials for SMS delivery
   */
  setTwilioCredentials(accountSid: string, authToken: string, phoneNumber: string) {
    this.twilioAccountSid = accountSid;
    this.twilioAuthToken = authToken;
    this.twilioPhoneNumber = phoneNumber;
  }

  /**
   * Check if email delivery is available
   */
  isEmailAvailable(): boolean {
    return !!this.sendGridApiKey;
  }

  /**
   * Check if SMS delivery is available
   */
  isSMSAvailable(): boolean {
    return !!(this.twilioAccountSid && this.twilioAuthToken && this.twilioPhoneNumber);
  }

  /**
   * Send OTP via email using SendGrid
   */
  private async sendEmailOTP(options: OTPDeliveryOptions): Promise<OTPDeliveryResult> {
    if (!this.sendGridApiKey) {
      return {
        success: false,
        error: 'SendGrid API key not configured',
        provider: 'SendGrid'
      };
    }

    try {
      const emailContent = this.generateEmailContent(options);
      
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.sendGridApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: options.recipient }],
            subject: 'Booking Cancellation - Verification Code'
          }],
          from: {
            email: 'noreply@yourservice.com', // Replace with your verified sender email
            name: 'Your Service Platform'
          },
          content: [{
            type: 'text/html',
            value: emailContent
          }]
        })
      });

      if (response.ok) {
        const messageId = response.headers.get('X-Message-Id');
        return {
          success: true,
          messageId: messageId || 'sent',
          provider: 'SendGrid'
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.errors?.[0]?.message || `HTTP ${response.status}: ${response.statusText}`,
          provider: 'SendGrid'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        provider: 'SendGrid'
      };
    }
  }

  /**
   * Send OTP via SMS using Twilio
   */
  private async sendSMSOTP(options: OTPDeliveryOptions): Promise<OTPDeliveryResult> {
    if (!this.twilioAccountSid || !this.twilioAuthToken || !this.twilioPhoneNumber) {
      return {
        success: false,
        error: 'Twilio credentials not configured',
        provider: 'Twilio'
      };
    }

    try {
      const smsContent = this.generateSMSContent(options);
      
      // Create basic auth header for Twilio
      const auth = btoa(`${this.twilioAccountSid}:${this.twilioAuthToken}`);
      
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${this.twilioAccountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: this.twilioPhoneNumber,
          To: options.recipient,
          Body: smsContent
        })
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          messageId: data.sid,
          provider: 'Twilio'
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          provider: 'Twilio'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        provider: 'Twilio'
      };
    }
  }

  /**
   * Generate HTML email content for OTP
   */
  private generateEmailContent(options: OTPDeliveryOptions): string {
    const { code, bookingDetails } = options;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Cancellation Verification</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1A1A1A; color: #F5F5DC; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; }
          .otp-code { 
            background: #F4D03F; 
            color: #1A1A1A; 
            font-size: 32px; 
            font-weight: bold; 
            padding: 15px; 
            text-align: center; 
            border-radius: 8px; 
            margin: 20px 0;
            letter-spacing: 5px;
          }
          .booking-details { background: #fff; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Booking Cancellation Verification</h1>
          </div>
          
          <div class="content">
            <h2>Security Verification Required</h2>
            <p>We received a request to cancel your booking. For your security, please use the verification code below:</p>
            
            <div class="otp-code">${code}</div>
            
            ${bookingDetails ? `
            <div class="booking-details">
              <h3>Booking Details:</h3>
              <p><strong>Service:</strong> ${bookingDetails.serviceName}</p>
              <p><strong>Freelancer:</strong> ${bookingDetails.freelancerName}</p>
              <p><strong>Date & Time:</strong> ${bookingDetails.bookingDate} at ${bookingDetails.bookingTime}</p>
            </div>
            ` : ''}
            
            <div class="warning">
              <p><strong>Important:</strong></p>
              <ul>
                <li>This code will expire in 10 minutes</li>
                <li>Do not share this code with anyone</li>
                <li>If you didn't request this cancellation, please contact support immediately</li>
              </ul>
            </div>
            
            <p>If you have any questions, please contact our support team.</p>
          </div>
          
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; 2024 Your Service Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate SMS content for OTP
   */
  private generateSMSContent(options: OTPDeliveryOptions): string {
    const { code, bookingDetails } = options;
    
    let message = `Your booking cancellation verification code is: ${code}\n\n`;
    
    if (bookingDetails) {
      message += `Booking: ${bookingDetails.serviceName} with ${bookingDetails.freelancerName}\n`;
      message += `Date: ${bookingDetails.bookingDate} at ${bookingDetails.bookingTime}\n\n`;
    }
    
    message += `This code expires in 10 minutes. Do not share this code with anyone.\n\n`;
    message += `If you didn't request this, contact support immediately.`;
    
    return message;
  }

  /**
   * Send OTP using the specified method
   */
  async sendOTP(options: OTPDeliveryOptions): Promise<OTPDeliveryResult> {
    if (options.method === 'email') {
      return this.sendEmailOTP(options);
    } else if (options.method === 'sms') {
      return this.sendSMSOTP(options);
    } else {
      return {
        success: false,
        error: 'Invalid delivery method specified'
      };
    }
  }

  /**
   * Get available delivery methods
   */
  getAvailableMethods(): Array<'email' | 'sms'> {
    const methods: Array<'email' | 'sms'> = [];
    
    if (this.isEmailAvailable()) {
      methods.push('email');
    }
    
    if (this.isSMSAvailable()) {
      methods.push('sms');
    }
    
    return methods;
  }

  /**
   * Get provider status information
   */
  getProviderStatus() {
    return {
      sendGrid: {
        configured: this.isEmailAvailable(),
        provider: 'SendGrid'
      },
      twilio: {
        configured: this.isSMSAvailable(),
        provider: 'Twilio'
      }
    };
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;