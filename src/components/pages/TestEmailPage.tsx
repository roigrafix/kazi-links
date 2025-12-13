import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { notificationService } from '@/services/notificationService';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';

export default function TestEmailPage() {
  const [email, setEmail] = useState('roivisuals@gmail.com');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    provider?: string;
  } | null>(null);

  const handleSendTestEmail = async () => {
    if (!email) {
      setResult({
        success: false,
        message: 'Please enter an email address'
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Generate a random 6-digit OTP code
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

      const result = await notificationService.sendOTP({
        method: 'email',
        recipient: email,
        code: otpCode,
        bookingDetails: {
          serviceName: 'Test Service',
          freelancerName: 'Test Freelancer',
          bookingDate: new Date().toLocaleDateString(),
          bookingTime: new Date().toLocaleTimeString()
        }
      });

      setResult({
        success: result.success,
        message: result.success 
          ? `✅ Test OTP email sent successfully to ${email}! OTP Code: ${otpCode}`
          : `❌ Failed to send email: ${result.error || 'Unknown error'}`,
        provider: result.provider
      });
    } catch (error) {
      setResult({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`
      });
    } finally {
      setLoading(false);
    }
  };

  const providerStatus = notificationService.getProviderStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-logoBlack to-gray-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="bg-white shadow-xl">
          <div className="p-8">
            <h1 className="text-3xl font-bold text-logoBlack mb-2">Test Email Notification</h1>
            <p className="text-gray-600 mb-8">Send a test OTP email to verify email notification functionality</p>

            {/* Provider Status */}
            <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h2 className="font-semibold text-logoBlack mb-4">Provider Status</h2>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">SendGrid (Email)</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    providerStatus.sendGrid.configured 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {providerStatus.sendGrid.configured ? '✓ Configured' : '✗ Not Configured'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Twilio (SMS)</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    providerStatus.twilio.configured 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {providerStatus.twilio.configured ? '✓ Configured' : '✗ Not Configured'}
                  </span>
                </div>
              </div>
            </div>

            {/* Email Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-logoBlack mb-2">
                Email Address
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                disabled={loading}
                className="w-full"
              />
            </div>

            {/* Send Button */}
            <Button
              onClick={handleSendTestEmail}
              disabled={loading || !providerStatus.sendGrid.configured}
              className="w-full bg-logoGold hover:bg-yellow-500 text-logoBlack font-semibold py-2 rounded-lg transition-colors"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  Sending...
                </span>
              ) : (
                'Send Test OTP Email'
              )}
            </Button>

            {!providerStatus.sendGrid.configured && (
              <Alert className="mt-4 bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  SendGrid is not configured. Please add VITE_SENDGRID_API_KEY to your environment variables.
                </AlertDescription>
              </Alert>
            )}

            {/* Result Message */}
            {result && (
              <Alert className={`mt-6 ${
                result.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-start gap-3">
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  )}
                  <div>
                    <AlertDescription className={result.success ? 'text-green-800' : 'text-red-800'}>
                      {result.message}
                    </AlertDescription>
                    {result.provider && (
                      <p className={`text-sm mt-2 ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                        Provider: {result.provider}
                      </p>
                    )}
                  </div>
                </div>
              </Alert>
            )}

            {/* Info Section */}
            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Test Information</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• A random 6-digit OTP code will be generated</li>
                <li>• The email will include test booking details</li>
                <li>• Check your inbox (and spam folder) for the test email</li>
                <li>• The OTP code is displayed in the success message</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
