import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Image } from '@/components/ui/image';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { useMember } from '@/integrations';
import { messageCenterOTPService } from '@/services/messageCenterOTPService';
import { Phone, Lock, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';

// Constants
const OTP_RESEND_TIMEOUT = 60; // seconds
const SUCCESS_REDIRECT_DELAY = 2000; // milliseconds

type AuthStep = 'phone' | 'otp' | 'success';

export default function MessagingCenterOTPPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: memberLoading, actions } = useMember();

  const [step, setStep] = useState<AuthStep>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [verifiedPhoneNumber, setVerifiedPhoneNumber] = useState('');
  const [verificationId, setVerificationId] = useState('');
  
  // Prevent duplicate requests
  const phoneSubmitInProgress = useRef(false);
  const otpSubmitInProgress = useRef(false);
  const resendInProgress = useRef(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !memberLoading) {
      navigate('/');
    }
  }, [isAuthenticated, memberLoading, navigate]);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Prevent duplicate requests
    if (phoneSubmitInProgress.current || isLoading) {
      return;
    }

    // Validate BEFORE setting loading state
    if (!phoneNumber.trim()) {
      setError('Please enter a phone number');
      return;
    }

    const validation = messageCenterOTPService.validatePhoneNumber(phoneNumber);
    if (!validation.valid) {
      setError(validation.error || 'Invalid phone number');
      return;
    }

    // Now set loading state after validation passes
    setError('');
    setIsLoading(true);
    phoneSubmitInProgress.current = true;

    try {
      // Send OTP
      const result = await messageCenterOTPService.sendOTP(phoneNumber);

      if (result.success) {
        // Extract and store verification ID
        const newVerificationId = result.data?.verificationId || '';
        setVerificationId(newVerificationId);
        
        setVerifiedPhoneNumber(result.phoneNumber || messageCenterOTPService.formatPhoneNumber(phoneNumber));
        setStep('otp');
        setTimeLeft(OTP_RESEND_TIMEOUT);
        toast({
          title: 'OTP Sent',
          description: `Verification code sent to ${result.phoneNumber || phoneNumber}`,
        });
      } else {
        setError(result.message || 'Failed to send OTP. Please try again.');
      }
    } catch (err: any) {
      console.error('Unexpected error in handlePhoneSubmit:', err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
      phoneSubmitInProgress.current = false;
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Prevent duplicate requests
    if (otpSubmitInProgress.current || isLoading) {
      return;
    }

    // Validate BEFORE setting loading state
    if (!otp.trim()) {
      setError('Please enter the OTP code');
      return;
    }

    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      setError('OTP must be a 6-digit code');
      return;
    }

    // Now set loading state after validation passes
    setError('');
    setIsLoading(true);
    otpSubmitInProgress.current = true;

    try {
      // Verify OTP with verification ID
      const result = await messageCenterOTPService.verifyOTP(phoneNumber, otp, verificationId);

      if (result.success && result.valid) {
        setStep('success');
        toast({
          title: 'Success',
          description: 'Phone number verified successfully!',
        });

        // Store verified phone number in session/local storage for later use
        sessionStorage.setItem('verifiedPhoneNumber', result.phoneNumber || verifiedPhoneNumber);

        // Redirect to home after delay
        setTimeout(() => {
          navigate('/');
        }, SUCCESS_REDIRECT_DELAY);
      } else {
        setError(result.message || 'Invalid OTP. Please try again.');
      }
    } catch (err: any) {
      console.error('Unexpected error in handleOTPSubmit:', err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
      otpSubmitInProgress.current = false;
    }
  };

  const handleResendOTP = async () => {
    // Prevent duplicate requests
    if (resendInProgress.current || isLoading) {
      return;
    }

    setError('');
    setIsLoading(true);
    resendInProgress.current = true;

    try {
      const result = await messageCenterOTPService.resendOTP(phoneNumber);

      if (result.success) {
        // Extract and store new verification ID
        const newVerificationId = result.data?.verificationId || verificationId;
        setVerificationId(newVerificationId);
        
        setOtp('');
        setTimeLeft(OTP_RESEND_TIMEOUT);
        toast({
          title: 'OTP Resent',
          description: `New verification code sent to ${result.phoneNumber || phoneNumber}`,
        });
      } else {
        setError(result.message || 'Failed to resend OTP.');
      }
    } finally {
      setIsLoading(false);
      resendInProgress.current = false;
    }
  };

  const handleChangePhone = () => {
    setStep('phone');
    setPhoneNumber('');
    setOtp('');
    setError('');
    setVerifiedPhoneNumber('');
    setVerificationId('');
  };

  return (
    <div className="min-h-screen bg-primary text-primary-foreground flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Logo Section */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center mb-6"
          >
            <Image
              src="https://static.wixstatic.com/media/d6d795_240b4c7ea1dc48b4a2b100e99044aa72~mv2.png"
              alt="KaziLinks Logo"
              width={60}
              className="w-16 h-16"
            />
          </motion.div>
          <h1 className="font-heading text-4xl font-bold mb-2">KaziLinks</h1>
          <p className="font-paragraph text-primary-foreground/70">
            Sign in with your phone number
          </p>
        </div>

        {/* Phone Number Step */}
        {step === 'phone' && (
          <motion.div
            className="bg-secondary text-secondary-foreground rounded-lg p-8 shadow-lg"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <form onSubmit={handlePhoneSubmit} className="space-y-6">
              <div>
                <label htmlFor="phone" className="block font-paragraph text-sm font-medium mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-foreground/50" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={isLoading}
                    className="pl-10 bg-primary text-primary-foreground border-primary-foreground/20 placeholder:text-primary-foreground/40"
                  />
                </div>
                <p className="text-xs text-primary-foreground/60 mt-2">
                  Enter your phone number with country code (e.g., +91 for India)
                </p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-red-500/10 border border-red-500/30 rounded-lg p-3"
                >
                  <p className="font-paragraph text-sm text-red-600">{error}</p>
                </motion.div>
              )}

              <Button
                type="submit"
                disabled={isLoading || !phoneNumber.trim()}
                className="w-full bg-logoGold text-logoBlack hover:bg-logoGold/90 font-heading font-semibold text-base py-6 cursor-pointer disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner />
                    <span className="ml-2">Sending OTP...</span>
                  </>
                ) : (
                  <>
                    Send OTP
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>

              <div className="text-center">
                <p className="font-paragraph text-secondary-foreground/70 text-sm">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="text-logoGold hover:text-logoGold/80 font-semibold transition-colors"
                  >
                    Sign in with email
                  </button>
                </p>
              </div>
            </form>
          </motion.div>
        )}

        {/* OTP Verification Step */}
        {step === 'otp' && (
          <motion.div
            className="bg-secondary text-secondary-foreground rounded-lg p-8 shadow-lg"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <form onSubmit={handleOTPSubmit} className="space-y-6">
              <div>
                <label htmlFor="otp" className="block font-paragraph text-sm font-medium mb-2">
                  Verification Code
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-foreground/50" />
                  <Input
                    id="otp"
                    type="text"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    disabled={isLoading}
                    maxLength={6}
                    className="pl-10 bg-primary text-primary-foreground border-primary-foreground/20 placeholder:text-primary-foreground/40 text-center text-2xl tracking-widest font-mono"
                  />
                </div>
                <p className="text-xs text-primary-foreground/60 mt-2">
                  Enter the 6-digit code sent to your phone
                </p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-red-500/10 border border-red-500/30 rounded-lg p-3"
                >
                  <p className="font-paragraph text-sm text-red-600">{error}</p>
                </motion.div>
              )}

              <Button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="w-full bg-logoGold text-logoBlack hover:bg-logoGold/90 font-heading font-semibold text-base py-6 cursor-pointer disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner />
                    <span className="ml-2">Verifying...</span>
                  </>
                ) : (
                  <>
                    Verify OTP
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>

              {/* Resend OTP */}
              <div className="text-center">
                {timeLeft > 0 ? (
                  <p className="font-paragraph text-sm text-secondary-foreground/70">
                    Resend OTP in <span className="font-semibold text-logoGold">{timeLeft}s</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={isLoading}
                    className="text-sm text-logoGold hover:text-logoGold/80 font-semibold disabled:opacity-50 transition-colors"
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
                className="w-full text-sm text-secondary-foreground/70 hover:text-secondary-foreground font-semibold py-2 disabled:opacity-50 transition-colors"
              >
                Change Phone Number
              </button>
            </form>
          </motion.div>
        )}

        {/* Success Step */}
        {step === 'success' && (
          <motion.div
            className="bg-secondary text-secondary-foreground rounded-lg p-8 shadow-lg text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="h-8 w-8 text-green-600" />
            </motion.div>
            <h2 className="font-heading text-2xl font-bold mb-2">Verified!</h2>
            <p className="font-paragraph text-secondary-foreground/70 mb-6">
              Your phone number has been verified successfully.
            </p>
            <p className="text-sm text-secondary-foreground/60">
              Redirecting to home page...
            </p>
          </motion.div>
        )}

        {/* Security Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 bg-primary-foreground/10 border border-primary-foreground/20 rounded-lg p-4"
        >
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-logoGold flex-shrink-0 mt-0.5" />
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
