// Note: Twilio is optional - install with: npm install twilio
// If not installed, the service will gracefully return without sending messages
let twilio: any;
try {
  twilio = require('twilio');
} catch (e) {
  console.warn('Twilio package not installed. WhatsApp notifications will be disabled.');
}

export const whatsappService = {
  async sendWhatsAppBookingConfirmation(
    userPhone: string,
    userName: string,
    service: string,
    date: string,
    time: string
  ) {
    try {
      if (!twilio) {
        console.warn('Twilio package not available. Skipping WhatsApp notification.');
        return { success: false, error: 'Twilio package not installed' };
      }

      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;

      if (!accountSid || !authToken) {
        console.warn('Twilio credentials are not set in environment variables.');
        return { success: false, error: 'Twilio credentials not configured' };
      }

      const client = twilio(accountSid, authToken);

      // Format phone number to E.164 format if needed
      let formattedPhone = userPhone;
      if (!userPhone.startsWith('+')) {
        // Assume Indian number if no country code
        formattedPhone = '+91' + userPhone.replace(/\D/g, '').slice(-10);
      }

      const message = await client.messages.create({
        from: 'whatsapp:+14155238886', // Twilio sandbox number
        to: `whatsapp:${formattedPhone}`,
        body: `Hi ${userName},

Your booking for ${service} on ${date} at ${time} has been confirmed!

Thank you for choosing KaziLinks. We look forward to serving you.

Best regards,
KaziLinks Team`,
      });

      console.log('WhatsApp booking confirmation sent successfully:', message.sid);
      return { success: true, messageSid: message.sid };
    } catch (error: any) {
      console.error('Error sending WhatsApp booking confirmation:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to send WhatsApp confirmation' 
      };
    }
  },

  async sendWhatsAppNotification(
    userPhone: string,
    message: string
  ) {
    try {
      if (!twilio) {
        console.warn('Twilio package not available. Skipping WhatsApp notification.');
        return { success: false, error: 'Twilio package not installed' };
      }

      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;

      if (!accountSid || !authToken) {
        console.warn('Twilio credentials are not set in environment variables.');
        return { success: false, error: 'Twilio credentials not configured' };
      }

      const client = twilio(accountSid, authToken);

      // Format phone number to E.164 format if needed
      let formattedPhone = userPhone;
      if (!userPhone.startsWith('+')) {
        // Assume Indian number if no country code
        formattedPhone = '+91' + userPhone.replace(/\D/g, '').slice(-10);
      }

      const result = await client.messages.create({
        from: 'whatsapp:+14155238886', // Twilio sandbox number
        to: `whatsapp:${formattedPhone}`,
        body: message,
      });

      console.log('WhatsApp notification sent successfully:', result.sid);
      return { success: true, messageSid: result.sid };
    } catch (error: any) {
      console.error('Error sending WhatsApp notification:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to send WhatsApp notification' 
      };
    }
  }
};
