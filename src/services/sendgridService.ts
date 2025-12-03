/**
 * SendGrid Email Service
 * Handles all email communications securely using environment variables
 * 
 * IMPORTANT: Store your SendGrid API key in environment variables:
 * - Local: Create .env.local file with: VITE_SENDGRID_API_KEY=your_key_here
 * - Production: Add VITE_SENDGRID_API_KEY to your deployment environment variables
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

interface BookingConfirmationData {
  clientName: string;
  clientEmail: string;
  serviceName: string;
  freelancerName: string;
  bookingDate: string;
  bookingTime: string;
  serviceAddress: string;
  paymentAmount: number;
  bookingId: string;
}

interface SupportRequestData {
  clientName: string;
  clientEmail: string;
  subject: string;
  message: string;
  supportRequestId: string;
}

interface ReviewData {
  freelancerName: string;
  freelancerEmail: string;
  clientName: string;
  rating: number;
  reviewTitle: string;
  reviewContent: string;
  serviceName: string;
}

class SendGridService {
  private apiKey: string;
  private fromEmail: string = 'noreply@servicebooking.com';
  private baseUrl: string = 'https://api.sendgrid.com/v3/mail/send';

  constructor() {
    this.apiKey = import.meta.env.VITE_SENDGRID_API_KEY || '';
    if (!this.apiKey) {
      console.warn(
        'SendGrid API key not configured. Email functionality will be disabled. ' +
        'Add VITE_SENDGRID_API_KEY to your environment variables.'
      );
    }
  }

  /**
   * Send a generic email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.apiKey) {
      console.warn('SendGrid API key not configured. Email not sent.');
      return false;
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: options.to }],
              subject: options.subject,
            },
          ],
          from: { email: options.from || this.fromEmail },
          content: [
            {
              type: 'text/html',
              value: options.html,
            },
          ],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('SendGrid API error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  /**
   * Send booking confirmation email to client
   */
  async sendBookingConfirmation(data: BookingConfirmationData): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #1A1A1A; color: #F5F5DC; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">Booking Confirmed!</h1>
        </div>
        
        <div style="padding: 30px; background-color: #f9f9f9;">
          <p style="font-size: 16px; color: #333;">Hi ${data.clientName},</p>
          
          <p style="font-size: 16px; color: #333;">
            Your booking has been confirmed. Here are your booking details:
          </p>
          
          <div style="background-color: white; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h2 style="color: #1A1A1A; margin-top: 0;">Booking Details</h2>
            
            <p style="margin: 10px 0;">
              <strong>Booking ID:</strong> ${data.bookingId}
            </p>
            <p style="margin: 10px 0;">
              <strong>Service:</strong> ${data.serviceName}
            </p>
            <p style="margin: 10px 0;">
              <strong>Freelancer:</strong> ${data.freelancerName}
            </p>
            <p style="margin: 10px 0;">
              <strong>Date:</strong> ${data.bookingDate}
            </p>
            <p style="margin: 10px 0;">
              <strong>Time:</strong> ${data.bookingTime}
            </p>
            <p style="margin: 10px 0;">
              <strong>Location:</strong> ${data.serviceAddress}
            </p>
            <p style="margin: 10px 0;">
              <strong>Amount:</strong> ₹${data.paymentAmount.toFixed(2)}
            </p>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 20px;">
            You can track your booking status in your account dashboard.
          </p>
          
          <p style="font-size: 14px; color: #666;">
            If you have any questions, please contact our support team.
          </p>
        </div>
        
        <div style="background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #666;">
          <p style="margin: 0;">© 2025 Service Booking Platform. All rights reserved.</p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: data.clientEmail,
      subject: `Booking Confirmed - ${data.serviceName}`,
      html,
    });
  }

  /**
   * Send booking confirmation email to freelancer
   */
  async sendFreelancerBookingNotification(
    freelancerEmail: string,
    data: BookingConfirmationData
  ): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #1A1A1A; color: #F5F5DC; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">New Booking!</h1>
        </div>
        
        <div style="padding: 30px; background-color: #f9f9f9;">
          <p style="font-size: 16px; color: #333;">Hi ${data.freelancerName},</p>
          
          <p style="font-size: 16px; color: #333;">
            You have a new booking request. Here are the details:
          </p>
          
          <div style="background-color: white; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h2 style="color: #1A1A1A; margin-top: 0;">Booking Details</h2>
            
            <p style="margin: 10px 0;">
              <strong>Client:</strong> ${data.clientName}
            </p>
            <p style="margin: 10px 0;">
              <strong>Service:</strong> ${data.serviceName}
            </p>
            <p style="margin: 10px 0;">
              <strong>Date:</strong> ${data.bookingDate}
            </p>
            <p style="margin: 10px 0;">
              <strong>Time:</strong> ${data.bookingTime}
            </p>
            <p style="margin: 10px 0;">
              <strong>Location:</strong> ${data.serviceAddress}
            </p>
            <p style="margin: 10px 0;">
              <strong>Amount:</strong> ₹${data.paymentAmount.toFixed(2)}
            </p>
          </div>
          
          <p style="font-size: 14px; color: #666;">
            Please log in to your dashboard to accept or decline this booking.
          </p>
        </div>
        
        <div style="background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #666;">
          <p style="margin: 0;">© 2025 Service Booking Platform. All rights reserved.</p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: freelancerEmail,
      subject: `New Booking - ${data.serviceName}`,
      html,
    });
  }

  /**
   * Send support request confirmation email
   */
  async sendSupportRequestConfirmation(data: SupportRequestData): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #1A1A1A; color: #F5F5DC; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">Support Request Received</h1>
        </div>
        
        <div style="padding: 30px; background-color: #f9f9f9;">
          <p style="font-size: 16px; color: #333;">Hi ${data.clientName},</p>
          
          <p style="font-size: 16px; color: #333;">
            Thank you for contacting our support team. We have received your request and will get back to you shortly.
          </p>
          
          <div style="background-color: white; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h2 style="color: #1A1A1A; margin-top: 0;">Your Request Details</h2>
            
            <p style="margin: 10px 0;">
              <strong>Request ID:</strong> ${data.supportRequestId}
            </p>
            <p style="margin: 10px 0;">
              <strong>Subject:</strong> ${data.subject}
            </p>
            <p style="margin: 10px 0;">
              <strong>Message:</strong>
            </p>
            <p style="margin: 10px 0; padding: 10px; background-color: #f5f5f5; border-left: 3px solid #F4D03F;">
              ${data.message}
            </p>
          </div>
          
          <p style="font-size: 14px; color: #666;">
            Our support team typically responds within 24 hours. You can track your request using the ID above.
          </p>
        </div>
        
        <div style="background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #666;">
          <p style="margin: 0;">© 2025 Service Booking Platform. All rights reserved.</p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: data.clientEmail,
      subject: `Support Request Received - ${data.supportRequestId}`,
      html,
    });
  }

  /**
   * Send review notification email to freelancer
   */
  async sendReviewNotification(data: ReviewData): Promise<boolean> {
    const stars = '⭐'.repeat(Math.floor(data.rating)) + 
                  (data.rating % 1 !== 0 ? '✨' : '');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #1A1A1A; color: #F5F5DC; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">New Review Received!</h1>
        </div>
        
        <div style="padding: 30px; background-color: #f9f9f9;">
          <p style="font-size: 16px; color: #333;">Hi ${data.freelancerName},</p>
          
          <p style="font-size: 16px; color: #333;">
            ${data.clientName} has left a review for your ${data.serviceName} service.
          </p>
          
          <div style="background-color: white; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h2 style="color: #1A1A1A; margin-top: 0;">${data.reviewTitle}</h2>
            
            <p style="font-size: 18px; margin: 10px 0;">
              ${stars} ${data.rating}/5
            </p>
            
            <p style="margin: 10px 0; padding: 10px; background-color: #f5f5f5; border-left: 3px solid #F4D03F;">
              "${data.reviewContent}"
            </p>
            
            <p style="margin: 10px 0; font-size: 14px; color: #666;">
              <strong>Reviewer:</strong> ${data.clientName}
            </p>
          </div>
          
          <p style="font-size: 14px; color: #666;">
            Log in to your dashboard to view all your reviews and ratings.
          </p>
        </div>
        
        <div style="background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #666;">
          <p style="margin: 0;">© 2025 Service Booking Platform. All rights reserved.</p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: data.freelancerEmail,
      subject: `New Review: ${data.reviewTitle}`,
      html,
    });
  }

  /**
   * Check if SendGrid is properly configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }
}

// Export singleton instance
export const sendGridService = new SendGridService();
