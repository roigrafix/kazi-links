/**
 * Booking Automation Service
 * Handles triggering Wix Automation workflows when bookings are created
 */

interface BookingAutomationPayload {
  bookingId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  serviceName: string;
  freelancerName: string;
  bookingDate: string;
  bookingTime: string;
  serviceAddress: string;
  paymentAmount: number;
  serviceCity: string;
  serviceState: string;
}

/**
 * Trigger Wix Automation workflow when a booking is created
 * This sends a webhook to your Wix Automation trigger
 */
export const bookingAutomationService = {
  /**
   * Trigger booking confirmation automation
   * Sends booking data to Wix Automation webhook
   */
  async triggerBookingConfirmation(payload: BookingAutomationPayload): Promise<boolean> {
    try {
      // Get the Wix Automation webhook URL from environment variables
      const webhookUrl = import.meta.env.VITE_WIX_AUTOMATION_WEBHOOK_URL;
      
      if (!webhookUrl) {
        console.warn('Wix Automation webhook URL not configured. Set VITE_WIX_AUTOMATION_WEBHOOK_URL in your environment variables.');
        return false;
      }

      // Send webhook request to Wix Automation
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: 'booking_created',
          timestamp: new Date().toISOString(),
          data: payload
        })
      });

      if (!response.ok) {
        console.error('Failed to trigger Wix Automation:', response.statusText);
        return false;
      }

      console.log('Wix Automation workflow triggered successfully');
      return true;
    } catch (error) {
      console.error('Error triggering Wix Automation:', error);
      return false;
    }
  },

  /**
   * Trigger freelancer notification automation
   */
  async triggerFreelancerNotification(payload: BookingAutomationPayload): Promise<boolean> {
    try {
      const webhookUrl = import.meta.env.VITE_WIX_AUTOMATION_FREELANCER_WEBHOOK_URL;
      
      if (!webhookUrl) {
        console.warn('Freelancer notification webhook URL not configured.');
        return false;
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: 'freelancer_booking_notification',
          timestamp: new Date().toISOString(),
          data: payload
        })
      });

      if (!response.ok) {
        console.error('Failed to trigger freelancer notification:', response.statusText);
        return false;
      }

      console.log('Freelancer notification triggered successfully');
      return true;
    } catch (error) {
      console.error('Error triggering freelancer notification:', error);
      return false;
    }
  },

  /**
   * Check if Wix Automation is configured
   */
  isConfigured(): boolean {
    return !!import.meta.env.VITE_WIX_AUTOMATION_WEBHOOK_URL;
  }
};
