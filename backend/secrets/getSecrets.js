import { getSecret } from 'wix-secrets-backend';

export async function get_secrets(request) {
  try {
    const twilioAccountSid = await getSecret('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = await getSecret('TWILIO_AUTH_TOKEN');
    const twilioServiceSid = await getSecret('TWILIO_SERVICE_SID');
    const twilioPhoneNumber = await getSecret('TWILIO_PHONE_NUMBER');
    const sendGridApiKey = await getSecret('SENDGRID_API_KEY');

    return {
      body: {
        success: true,
        credentials: {
          twilioAccountSid: twilioAccountSid || undefined,
          twilioAuthToken: twilioAuthToken || undefined,
          twilioServiceSid: twilioServiceSid || undefined,
          twilioPhoneNumber: twilioPhoneNumber || undefined,
          sendGridApiKey: sendGridApiKey || undefined,
        },
      },
    };
  } catch (error) {
    console.error('Error retrieving secrets:', error);
    return {
      status: 500,
      body: {
        success: false,
        error: 'Failed to retrieve secrets',
        message: error.message,
      },
    };
  }
}
