import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { twilioService } from '@/services/twilioService';
import { useMember } from '@/integrations';
import { Phone, Lock, CheckCircle, AlertCircle, Loader } from 'lucide-react';

type AuthStep = 'phone' | 'otp' | 'success';

export default function SMSAuthPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { actions } = useMember();

  const [step, setStep] = useState<AuthStep>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [formattedPhone, setFormattedPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [verificationSid, setVerificationSid] = useState('');

  // Countdown timer for resend OTP
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft]);

  // Check if Twilio is configured
  useEffect(() => {
    if (!twilioService.isConfigured()) {
      toast({
        title: 'Configuration Error',
        description: 'SMS OTP service is not configured. Please contact support.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneNumber.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a phone number',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Format phone number to E.164 format
      const formatted = twilioService.formatPhoneNumber(phoneNumber);
      setFormattedPhone(formatted);

      // Send OTP
      const result = await twilioService.sendOTP(formatted);

      if (result.success) {
        setVerificationSid(result.sid || '');
        setStep('otp');
        setTimeLeft(60); // 60 seconds to resend
        toast({
          title: 'OTP Sent',
          description: `Verification code sent to ${formatted}`,
        });
      } else {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      toast({
        title: 'Error',
        description: 'Failed to send OTP. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otpCode.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter the OTP code',
        variant: 'destructive',
      });
      return;
    }

    if (otpCode.length !== 6 || !/^\d+$/.test(otpCode)) {
      toast({
        title: 'Error',
        description: 'OTP must be a 6-digit code',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Verify OTP
      const result = await twilioService.verifyOTP(formattedPhone, otpCode);

      if (result.success && result.valid) {
        setStep('success');
        toast({
          title: 'Success',
          description: 'Phone number verified successfully!',
        });

        // Redirect to home after 2 seconds
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Invalid OTP. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      toast({
        title: 'Error',
        description: 'Failed to verify OTP. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    try {
      const result = await twilioService.sendOTP(formattedPhone);

      if (result.success) {
        setVerificationSid(result.sid || '');
        setOtpCode('');
        setTimeLeft(60);
        toast({
          title: 'OTP Resent',
          description: `New verification code sent to ${formattedPhone}`,
        });
      } else {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error resending OTP:', error);
      toast({
        title: 'Error',
        description: 'Failed to resend OTP. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePhone = () => {
    setStep('phone');
    setPhoneNumber('');
    setFormattedPhone('');
    setOtpCode('');
    setVerificationSid('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary/95 text-primary-foreground flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-16 h-16 bg-neonyellow rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Phone className="h-8 w-8 text-primary" />
          </motion.div>
          <h1 className="font-heading text-3xl font-bold mb-2">Verify Your Phone</h1>
          <p className="font-paragraph text-primary-foreground/80">
            Secure authentication with SMS OTP
          </p>
        </div>

        {/* Phone Number Step */}
        {step === 'phone' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="bg-secondary text-secondary-foreground border-0 shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-neonyellow" />
                  Enter Phone Number
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePhoneSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="phone" className="text-base font-semibold mb-2 block">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      disabled={isLoading}
                      className="text-base py-3 px-4 h-12 border-2 border-gray-300 focus:border-neonyellow"
                    />
                    <p className="text-sm text-gray-600 mt-2">
                      Enter your phone number with country code (e.g., +91 for India)
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading || !phoneNumber.trim()}
                    className="w-full bg-neonyellow hover:bg-neonyellow/90 text-primary font-semibold py-3 h-12 text-base"
                  >
                    {isLoading ? (
                      <>
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                        Sending OTP...
                      </>
                    ) : (
                      'Send OTP'
                    )}
                  </Button>

                  <div className="text-center">
                    <p className="text-sm text-gray-600">
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => navigate('/login')}
                        className="text-neonyellow hover:text-neonyellow/80 font-semibold"
                      >
                        Sign in
                      </button>
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* OTP Verification Step */}
        {step === 'otp' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="bg-secondary text-secondary-foreground border-0 shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-neonyellow" />
                  Enter OTP Code
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleOTPSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="otp" className="text-base font-semibold mb-2 block">
                      Verification Code
                    </Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="000000"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      disabled={isLoading}
                      maxLength={6}
                      className="text-base py-3 px-4 h-12 border-2 border-gray-300 focus:border-neonyellow text-center text-2xl tracking-widest font-mono"
                    />
                    <p className="text-sm text-gray-600 mt-2">
                      Enter the 6-digit code sent to {formattedPhone}
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading || otpCode.length !== 6}
                    className="w-full bg-neonyellow hover:bg-neonyellow/90 text-primary font-semibold py-3 h-12 text-base"
                  >
                    {isLoading ? (
                      <>
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Verify OTP'
                    )}
                  </Button>

                  {/* Resend OTP */}
                  <div className="text-center">
                    {timeLeft > 0 ? (
                      <p className="text-sm text-gray-600">
                        Resend OTP in <span className="font-semibold text-neonyellow">{timeLeft}s</span>
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOTP}
                        disabled={isLoading}
                        className="text-sm text-neonyellow hover:text-neonyellow/80 font-semibold disabled:opacity-50"
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>

                  {/* Change Phone */}
                  <button
                    type="button"
                    onClick={handleChangePhone}
                    disabled={isLoading}
                    className="w-full text-sm text-gray-600 hover:text-gray-800 font-semibold py-2 disabled:opacity-50"
                  >
                    Change Phone Number
                  </button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Success Step */}
        {step === 'success' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="bg-secondary text-secondary-foreground border-0 shadow-2xl">
              <CardContent className="pt-8 pb-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </motion.div>
                <h2 className="font-heading text-2xl font-bold mb-2">Verified!</h2>
                <p className="font-paragraph text-gray-600 mb-6">
                  Your phone number has been verified successfully.
                </p>
                <p className="text-sm text-gray-500">
                  Redirecting to home page...
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 bg-primary-foreground/10 border border-primary-foreground/20 rounded-lg p-4"
        >
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-neonyellow flex-shrink-0 mt-0.5" />
            <div className="text-sm text-primary-foreground/80">
              <p className="font-semibold mb-1">Security Notice</p>
              <p>
                We'll never ask for your OTP code via email or phone call. Always verify you're on our official website.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
