import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMember } from '@/integrations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Phone, Lock, Shield, ArrowRight, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { firebaseAuth, FirebaseUser } from '@/services/firebaseAuth';

export default function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, actions } = useMember();
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    otp: ''
  });
  const [showOTP, setShowOTP] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verificationId, setVerificationId] = useState('');
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  
  // Loading and error states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);

  // Firebase auth state listener
  useEffect(() => {
    const unsubscribe = firebaseAuth.onAuthStateChanged((user) => {
      setFirebaseUser(user);
      if (user) {
        // User is signed in with Firebase, automatically redirect to home
        setSuccess(`Welcome ${user.displayName || user.email || user.phoneNumber}!`);
        // Redirect after a short delay to show success message
        setTimeout(() => {
          navigate('/');
        }, 1500);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // OTP timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  // Redirect if already authenticated with Wix
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(''); // Clear error when user types
  };

  const validateForm = (): boolean => {
    if (loginMethod === 'email') {
      if (!formData.email || !formData.email.includes('@')) {
        setError('Please enter a valid email address');
        return false;
      }
    } else {
      if (!formData.phone || formData.phone.length < 10) {
        setError('Please enter a valid phone number');
        return false;
      }
    }

    if (!showOTP && (!formData.password || formData.password.length < 6)) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    if (authMode === 'signup' && !showOTP) {
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
    }

    if (showOTP && (!formData.otp || formData.otp.length !== 6)) {
      setError('Please enter the 6-digit verification code');
      return false;
    }

    return true;
  };

  const handleEmailAuth = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError('');

    try {
      let result;
      
      if (authMode === 'signin') {
        result = await firebaseAuth.signInWithEmailAndPassword(formData.email, formData.password);
      } else {
        result = await firebaseAuth.createUserWithEmailAndPassword(formData.email, formData.password);
      }

      if (result.success) {
        if (result.requiresVerification) {
          setSuccess('Account created! Please check your email for verification.');
        } else {
          setSuccess('Successfully signed in!');
        }
      } else {
        setError(result.error?.message || 'Authentication failed');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhoneAuth = async () => {
    if (!showOTP) {
      // Send verification code
      if (!formData.phone) {
        setError('Please enter a phone number');
        return;
      }

      setIsSendingCode(true);
      setError('');

      try {
        const result = await firebaseAuth.sendPhoneVerificationCode(formData.phone);
        
        if (result.success) {
          setVerificationId(result.verificationId || '');
          setShowOTP(true);
          setOtpTimer(60);
          setSuccess('Verification code sent to your phone!');
        } else {
          setError(result.error?.message || 'Failed to send verification code');
        }
      } catch (error) {
        setError('Failed to send verification code');
      } finally {
        setIsSendingCode(false);
      }
    } else {
      // Verify code
      if (!validateForm()) return;

      setIsSubmitting(true);
      setError('');

      try {
        const result = await firebaseAuth.verifyPhoneNumber(verificationId, formData.otp);
        
        if (result.success) {
          setSuccess('Phone number verified successfully!');
        } else {
          setError(result.error?.message || 'Verification failed');
        }
      } catch (error) {
        setError('Verification failed');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleSubmit = async () => {
    if (loginMethod === 'email') {
      await handleEmailAuth();
    } else {
      await handlePhoneAuth();
    }
  };

  const handleResendCode = async () => {
    if (otpTimer > 0) return;

    setIsSendingCode(true);
    setError('');

    try {
      const result = await firebaseAuth.sendPhoneVerificationCode(formData.phone);
      
      if (result.success) {
        setVerificationId(result.verificationId || '');
        setOtpTimer(60);
        setSuccess('New verification code sent!');
      } else {
        setError(result.error?.message || 'Failed to resend code');
      }
    } catch (error) {
      setError('Failed to resend code');
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setError('Please enter your email address first');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const result = await firebaseAuth.sendPasswordResetEmail(formData.email);
      
      if (result.success) {
        setSuccess('Password reset email sent! Check your inbox.');
      } else {
        setError(result.error?.message || 'Failed to send reset email');
      }
    } catch (error) {
      setError('Failed to send reset email');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    // For now, fallback to Wix authentication for social logins
    // In a real implementation, you would use Firebase social auth
    actions.login();
  };

  const resetForm = () => {
    setFormData({
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      otp: ''
    });
    setShowOTP(false);
    setError('');
    setSuccess('');
    setVerificationId('');
    setOtpTimer(0);
  };

  const switchAuthMode = () => {
    setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
    resetForm();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-logoBlack/5 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-logoGold/20 shadow-2xl bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <CardTitle className="text-3xl font-heading text-logoBlack">
                {authMode === 'signin' ? 'Welcome Back' : 'Create Account'}
              </CardTitle>
              <CardDescription className="text-logoBlack/70 font-paragraph">
                {authMode === 'signin' 
                  ? 'Sign in to access your account and book services'
                  : 'Join us to start booking amazing services'
                }
              </CardDescription>
            </motion.div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Error and Success Messages */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            {/* Firebase User Status */}
            {firebaseUser && (
              <Alert className="border-blue-200 bg-blue-50">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  Signed in as {firebaseUser.displayName || firebaseUser.email || firebaseUser.phoneNumber}
                </AlertDescription>
              </Alert>
            )}

            <Tabs value={loginMethod} onValueChange={(value) => setLoginMethod(value as 'email' | 'phone')} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-logoCream/50">
                <TabsTrigger value="email" className="data-[state=active]:bg-logoGold data-[state=active]:text-logoBlack">
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="phone" className="data-[state=active]:bg-logoGold data-[state=active]:text-logoBlack">
                  <Phone className="w-4 h-4 mr-2" />
                  Phone
                </TabsTrigger>
              </TabsList>

              <TabsContent value="email" className="space-y-4 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-logoBlack font-paragraph">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-logoBlack/50 w-4 h-4" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="pl-10 border-logoGold/30 focus:border-logoGold focus:ring-logoGold/20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-logoBlack font-paragraph">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-logoBlack/50 w-4 h-4" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="pl-10 pr-10 border-logoGold/30 focus:border-logoGold focus:ring-logoGold/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-logoBlack/50 hover:text-logoBlack"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {authMode === 'signup' && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-logoBlack font-paragraph">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-logoBlack/50 w-4 h-4" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        className="pl-10 pr-10 border-logoGold/30 focus:border-logoGold focus:ring-logoGold/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-logoBlack/50 hover:text-logoBlack"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="phone" className="space-y-4 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-logoBlack font-paragraph">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-logoBlack/50 w-4 h-4" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="pl-10 border-logoGold/30 focus:border-logoGold focus:ring-logoGold/20"
                      disabled={showOTP}
                    />
                  </div>
                  <p className="text-xs text-logoBlack/60 font-paragraph">
                    Include country code (e.g., +1 for US)
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            {/* OTP Verification for Phone */}
            {showOTP && loginMethod === 'phone' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
                className="space-y-3"
              >
                <Label htmlFor="otp" className="text-logoBlack font-paragraph">Verification Code</Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-logoBlack/50 w-4 h-4" />
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={formData.otp}
                    onChange={(e) => handleInputChange('otp', e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="pl-10 border-logoGold/30 focus:border-logoGold focus:ring-logoGold/20 text-center text-lg tracking-widest"
                    maxLength={6}
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <p className="text-logoBlack/60 font-paragraph">
                    Code sent to {formData.phone}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResendCode}
                    disabled={otpTimer > 0 || isSendingCode}
                    className="text-logoGold hover:text-logoGold/80"
                  >
                    {otpTimer > 0 ? `Resend in ${otpTimer}s` : isSendingCode ? 'Sending...' : 'Resend Code'}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Main Action Button */}
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || isSendingCode}
              className="w-full bg-logoGold hover:bg-logoGold/90 text-logoBlack font-paragraph font-medium h-12 text-base"
            >
              {isSubmitting || isSendingCode ? (
                <LoadingSpinner />
              ) : (
                <>
                  {loginMethod === 'phone' && !showOTP ? 'Send Verification Code' :
                   loginMethod === 'phone' && showOTP ? 'Verify & Sign In' :
                   authMode === 'signin' ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>

            {/* Forgot Password (Email only) */}
            {loginMethod === 'email' && authMode === 'signin' && (
              <div className="text-center">
                <Button
                  variant="ghost"
                  onClick={handleForgotPassword}
                  disabled={isSubmitting}
                  className="text-logoGold hover:text-logoGold/80 font-paragraph"
                >
                  Forgot your password?
                </Button>
              </div>
            )}

            {/* Social Login */}
            <div className="relative">
              <Separator className="bg-logoGold/20" />
              <span className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-sm text-logoBlack/60 font-paragraph">
                Or continue with
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => handleSocialLogin('google')}
                className="border-logoGold/30 hover:bg-logoGold/10 text-logoBlack font-paragraph"
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSocialLogin('facebook')}
                className="border-logoGold/30 hover:bg-logoGold/10 text-logoBlack font-paragraph"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook
              </Button>
            </div>

            {/* Auth Mode Switch */}
            <div className="text-center space-y-2">
              <p className="text-sm text-logoBlack/60 font-paragraph">
                {authMode === 'signin' ? "Don't have an account?" : "Already have an account?"}{' '}
                <button 
                  onClick={switchAuthMode}
                  className="text-logoGold hover:text-logoGold/80 font-medium underline"
                >
                  {authMode === 'signin' ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>
          </CardContent>
        </Card>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
          className="text-center mt-6"
        >
          <p className="text-sm text-logoBlack/50 font-paragraph">
            Secure authentication powered by Firebase
          </p>
          <div className="flex justify-center items-center gap-2 mt-2 text-xs text-logoBlack/40">
            <div className={`w-2 h-2 rounded-full ${firebaseAuth.isReady() ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span>Firebase {firebaseAuth.isReady() ? 'Connected' : 'Connecting...'}</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}