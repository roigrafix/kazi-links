import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Copy, ExternalLink } from 'lucide-react';
import { twilioService } from '@/services/twilioService';

export default function TwilioConfigDiagnosticsPage() {
  const [diagnostics, setDiagnostics] = useState({
    accountSid: '',
    authToken: '',
    serviceSid: '',
    isConfigured: false,
    accountSidMasked: '',
    authTokenMasked: '',
  });
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    // Check environment variables
    const accountSid = import.meta.env.VITE_TWILIO_ACCOUNT_SID || '';
    const authToken = import.meta.env.VITE_TWILIO_AUTH_TOKEN || '';
    const serviceSid = import.meta.env.VITE_TWILIO_SERVICE_SID || '';

    const maskCredential = (value: string) => {
      if (!value) return 'NOT SET';
      if (value.length <= 4) return value;
      return value.substring(0, 2) + '*'.repeat(value.length - 4) + value.substring(value.length - 2);
    };

    setDiagnostics({
      accountSid,
      authToken,
      serviceSid,
      isConfigured: twilioService.isConfigured(),
      accountSidMasked: maskCredential(accountSid),
      authTokenMasked: maskCredential(authToken),
    });
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const testPhoneFormat = () => {
    const testNumbers = ['9876543210', '+919876543210', '98765 43210'];
    return testNumbers.map(num => ({
      input: num,
      output: twilioService.formatPhoneNumber(num),
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary/95 text-primary-foreground py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-heading text-4xl font-bold mb-2">Twilio Configuration Diagnostics</h1>
          <p className="font-paragraph text-primary-foreground/80">
            Check your Twilio setup and environment variables
          </p>
        </div>

        {/* Status Overview */}
        <Card className="bg-secondary text-secondary-foreground border-0 shadow-2xl mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {diagnostics.isConfigured ? (
                <>
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  Configuration Status: ✅ READY
                </>
              ) : (
                <>
                  <AlertCircle className="h-6 w-6 text-red-600" />
                  Configuration Status: ❌ NOT CONFIGURED
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <p className="font-paragraph text-sm">
                {diagnostics.isConfigured
                  ? '✅ All required Twilio credentials are configured. SMS OTP functionality is enabled.'
                  : '❌ Twilio credentials are missing. SMS OTP functionality is disabled. Follow the setup guide below.'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Environment Variables */}
        <Card className="bg-secondary text-secondary-foreground border-0 shadow-2xl mb-8">
          <CardHeader>
            <CardTitle>Environment Variables</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Account SID */}
            <div>
              <label className="block font-semibold text-sm mb-2">VITE_TWILIO_ACCOUNT_SID</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-primary/10 border border-primary/20 rounded px-3 py-2 text-sm font-mono">
                  {diagnostics.accountSidMasked}
                </code>
                {diagnostics.accountSid && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(diagnostics.accountSid, 'accountSid')}
                  >
                    {copied === 'accountSid' ? '✓ Copied' : <Copy className="h-4 w-4" />}
                  </Button>
                )}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {diagnostics.accountSid ? '✅ Set' : '❌ Not set - Add to .env.local'}
              </p>
            </div>

            {/* Auth Token */}
            <div>
              <label className="block font-semibold text-sm mb-2">VITE_TWILIO_AUTH_TOKEN</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-primary/10 border border-primary/20 rounded px-3 py-2 text-sm font-mono">
                  {diagnostics.authTokenMasked}
                </code>
                {diagnostics.authToken && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(diagnostics.authToken, 'authToken')}
                  >
                    {copied === 'authToken' ? '✓ Copied' : <Copy className="h-4 w-4" />}
                  </Button>
                )}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {diagnostics.authToken ? '✅ Set' : '❌ Not set - Add to .env.local'}
              </p>
            </div>

            {/* Service SID */}
            <div>
              <label className="block font-semibold text-sm mb-2">VITE_TWILIO_SERVICE_SID</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-primary/10 border border-primary/20 rounded px-3 py-2 text-sm font-mono">
                  {diagnostics.serviceSid || 'VAd3e1619e0cc8a1296109fb6927e00af2 (default)'}
                </code>
                {diagnostics.serviceSid && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(diagnostics.serviceSid, 'serviceSid')}
                  >
                    {copied === 'serviceSid' ? '✓ Copied' : <Copy className="h-4 w-4" />}
                  </Button>
                )}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {diagnostics.serviceSid ? '✅ Set' : '⚠️ Using default value'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Phone Number Formatting Test */}
        <Card className="bg-secondary text-secondary-foreground border-0 shadow-2xl mb-8">
          <CardHeader>
            <CardTitle>Phone Number Format Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Testing phone number formatting to E.164 format:
              </p>
              {testPhoneFormat().map((test, idx) => (
                <div key={idx} className="flex items-center gap-4 bg-primary/10 border border-primary/20 rounded p-3">
                  <div className="flex-1">
                    <p className="text-sm font-mono">Input: {test.input}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono text-green-600">→ {test.output}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Setup Instructions */}
        {!diagnostics.isConfigured && (
          <Card className="bg-secondary text-secondary-foreground border-0 shadow-2xl mb-8">
            <CardHeader>
              <CardTitle>Setup Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="space-y-4 list-decimal list-inside">
                <li className="text-sm">
                  <strong>Create `.env.local` file</strong> in your project root (same level as `package.json`)
                </li>
                <li className="text-sm">
                  <strong>Add these environment variables:</strong>
                  <pre className="bg-primary/10 border border-primary/20 rounded p-3 mt-2 text-xs overflow-x-auto">
{`VITE_TWILIO_ACCOUNT_SID=your_account_sid_here
VITE_TWILIO_AUTH_TOKEN=your_auth_token_here
VITE_TWILIO_SERVICE_SID=your_service_sid_here`}
                  </pre>
                </li>
                <li className="text-sm">
                  <strong>Get credentials from Twilio:</strong>
                  <a
                    href="https://www.twilio.com/console"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-logoGold hover:text-logoGold/80 flex items-center gap-1 mt-1"
                  >
                    Open Twilio Console <ExternalLink className="h-4 w-4" />
                  </a>
                </li>
                <li className="text-sm">
                  <strong>Restart your development server:</strong>
                  <pre className="bg-primary/10 border border-primary/20 rounded p-3 mt-2 text-xs">
                    npm run dev
                  </pre>
                </li>
                <li className="text-sm">
                  <strong>Reload this page</strong> to verify configuration
                </li>
              </ol>
            </CardContent>
          </Card>
        )}

        {/* Success Message */}
        {diagnostics.isConfigured && (
          <Card className="bg-green-100 border-green-300 border-2 shadow-2xl">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <CheckCircle className="h-8 w-8 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-heading font-bold text-green-900 mb-2">Configuration Complete! ✅</h3>
                  <p className="text-green-800 text-sm">
                    Your Twilio credentials are properly configured. The SMS OTP functionality is now active.
                    You can test it on the booking page.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
