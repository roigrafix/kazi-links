/**
 * Secure Email Service
 * Uses backend HTTP functions to send emails securely
 * API key is never exposed to client-side code
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

interface FreelancerNotificationData extends BookingConfirmationData {
  clientName: string;
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

class SecureEmailService {
  private baseUrl = '/api/send-email';

  /**
   * Send a generic email via secure backend function
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        console.error('Failed to send email:', response.statusText);
        return false;
      }

      const result = await response.json();
      return result.success === true;
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
          <p style="font-size: 16px; color: #333;">Hi ${this.escapeHtml(data.clientName)},</p>
          
          <p style="font-size: 16px; color: #333;">
            Your booking has been confirmed. Here are your booking details:
          </p>
          
          <div style="background-color: white; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h2 style="color: #1A1A1A; margin-top: 0;">Booking Details</h2>
            
            <p style="margin: 10px 0;">
              <strong>Booking ID:</strong> ${this.escapeHtml(data.bookingId)}
            </p>
            <p style="margin: 10px 0;">
              <strong>Service:</strong> ${this.escapeHtml(data.serviceName)}
            </p>
            <p style="margin: 10px 0;">
              <strong>Freelancer:</strong> ${this.escapeHtml(data.freelancerName)}
            </p>
            <p style="margin: 10px 0;">
              <strong>Date:</strong> ${this.escapeHtml(data.bookingDate)}
            </p>
            <p style="margin: 10px 0;">
              <strong>Time:</strong> ${this.escapeHtml(data.bookingTime)}
            </p>
            <p style="margin: 10px 0;">
              <strong>Location:</strong> ${this.escapeHtml(data.serviceAddress)}
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
   * Send booking notification email to freelancer
   */
  async sendFreelancerBookingNotification(
    freelancerEmail: string,
    data: FreelancerNotificationData
  ): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #1A1A1A; color: #F5F5DC; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">New Booking!</h1>
        </div>
        
        <div style="padding: 30px; background-color: #f9f9f9;">
          <p style="font-size: 16px; color: #333;">Hi ${this.escapeHtml(data.freelancerName)},</p>
          
          <p style="font-size: 16px; color: #333;">
            You have a new booking request. Here are the details:
          </p>
          
          <div style="background-color: white; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h2 style="color: #1A1A1A; margin-top: 0;">Booking Details</h2>
            
            <p style="margin: 10px 0;">
              <strong>Client:</strong> ${this.escapeHtml(data.clientName)}
            </p>
            <p style="margin: 10px 0;">
              <strong>Service:</strong> ${this.escapeHtml(data.serviceName)}
            </p>
            <p style="margin: 10px 0;">
              <strong>Date:</strong> ${this.escapeHtml(data.bookingDate)}
            </p>
            <p style="margin: 10px 0;">
              <strong>Time:</strong> ${this.escapeHtml(data.bookingTime)}
            </p>
            <p style="margin: 10px 0;">
              <strong>Location:</strong> ${this.escapeHtml(data.serviceAddress)}
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
          <p style="font-size: 16px; color: #333;">Hi ${this.escapeHtml(data.clientName)},</p>
          
          <p style="font-size: 16px; color: #333;">
            Thank you for contacting our support team. We have received your request and will get back to you shortly.
          </p>
          
          <div style="background-color: white; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h2 style="color: #1A1A1A; margin-top: 0;">Your Request Details</h2>
            
            <p style="margin: 10px 0;">
              <strong>Request ID:</strong> ${this.escapeHtml(data.supportRequestId)}
            </p>
            <p style="margin: 10px 0;">
              <strong>Subject:</strong> ${this.escapeHtml(data.subject)}
            </p>
            <p style="margin: 10px 0;">
              <strong>Message:</strong>
            </p>
            <p style="margin: 10px 0; padding: 10px; background-color: #f5f5f5; border-left: 3px solid #F4D03F;">
              ${this.escapeHtml(data.message)}
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
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #1A1A1A; color: #F5F5DC; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">New Review Received!</h1>
        </div>
        
        <div style="padding: 30px; background-color: #f9f9f9;">
          <p style="font-size: 16px; color: #333;">Hi ${this.escapeHtml(data.freelancerName)},</p>
          
          <p style="font-size: 16px; color: #333;">
            ${this.escapeHtml(data.clientName)} has left a review for your ${this.escapeHtml(data.serviceName)} service.
          </p>
          
          <div style="background-color: white; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h2 style="color: #1A1A1A; margin-top: 0;">${this.escapeHtml(data.reviewTitle)}</h2>
            
            <p style="font-size: 18px; margin: 10px 0;">
              Rating: ${data.rating}/5
            </p>
            
            <p style="margin: 10px 0; padding: 10px; background-color: #f5f5f5; border-left: 3px solid #F4D03F;">
              "${this.escapeHtml(data.reviewContent)}"
            </p>
            
            <p style="margin: 10px 0; font-size: 14px; color: #666;">
              <strong>Reviewer:</strong> ${this.escapeHtml(data.clientName)}
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
   * Check if email service is configured
   */
  isConfigured(): boolean {
    return true; // Backend will handle configuration check
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (char) => map[char]);
  }
}

// Export singleton instance
export const secureEmailService = new SecureEmailService();
