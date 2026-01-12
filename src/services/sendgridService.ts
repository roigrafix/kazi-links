/**
 * SendGrid Email Service (Client-Side Wrapper)
 * Handles all email communications securely via backend functions
 * 
 * SECURITY NOTES:
 * - API key is stored securely on the backend (Wix Secrets Manager)
 * - All email sending is done through secure backend HTTP functions
 * - Client-side code never has access to API keys
 * - All inputs are validated and sanitized on the backend
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
  private backendUrl: string = '/api/send-email';

  /**
   * Send a generic email via secure backend function
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const response = await fetch(this.backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include auth cookies
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Email service error:', error.error);
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
   * Send booking confirmation email to client via backend
   */
  async sendBookingConfirmation(data: BookingConfirmationData): Promise<boolean> {
    try {
      const response = await fetch('/api/send-booking-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        console.error('Failed to send booking confirmation');
        return false;
      }

      const result = await response.json();
      return result.success === true;
    } catch (error) {
      console.error('Error sending booking confirmation:', error);
      return false;
    }
  }

  /**
   * Send booking notification email to freelancer via backend
   */
  async sendFreelancerBookingNotification(
    freelancerEmail: string,
    data: BookingConfirmationData
  ): Promise<boolean> {
    try {
      const response = await fetch('/api/send-freelancer-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          freelancerEmail,
          ...data,
        }),
      });

      if (!response.ok) {
        console.error('Failed to send freelancer notification');
        return false;
      }

      const result = await response.json();
      return result.success === true;
    } catch (error) {
      console.error('Error sending freelancer notification:', error);
      return false;
    }
  }

  /**
   * Send support request confirmation email via backend
   */
  async sendSupportRequestConfirmation(data: SupportRequestData): Promise<boolean> {
    try {
      const response = await fetch('/api/send-support-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        console.error('Failed to send support confirmation');
        return false;
      }

      const result = await response.json();
      return result.success === true;
    } catch (error) {
      console.error('Error sending support confirmation:', error);
      return false;
    }
  }

  /**
   * Send review notification email to freelancer via backend
   */
  async sendReviewNotification(data: ReviewData): Promise<boolean> {
    try {
      const response = await fetch('/api/send-review-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        console.error('Failed to send review notification');
        return false;
      }

      const result = await response.json();
      return result.success === true;
    } catch (error) {
      console.error('Error sending review notification:', error);
      return false;
    }
  }

  /**
   * Check if email service is available
   */
  isConfigured(): boolean {
    return true; // Backend handles configuration
  }
}

// Export singleton instance
export const sendGridService = new SendGridService();
