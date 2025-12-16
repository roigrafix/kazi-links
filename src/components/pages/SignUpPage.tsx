import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMember } from '@/integrations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Image } from '@/components/ui/image';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Mail, Lock, ArrowRight, Eye, EyeOff, Phone, User } from 'lucide-react';
import { initializeGoogleOAuth, handleGoogleSignInResponse } from '@/services/googleOAuthService';

export default function SignUpPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, actions } = useMember();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/');
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Initialize Google OAuth on component mount
  useEffect(() => {
    initializeGoogleOAuth();
    
    // Set up Google Sign-In callback
    const handleGoogleResponse = (response: any) => {
      try {
        const userData = handleGoogleSignInResponse(response);
        console.log('Google Sign-Up successful:', userData);
        
        // Store the token and user data
        localStorage.setItem('googleToken', userData.token);
        localStorage.setItem('googleUser', JSON.stringify({
          id: userData.id,
          email: userData.email,
          name: userData.name,
          picture: userData.picture,
        }));

        // Redirect to home or dashboard
        navigate('/');
      } catch (err) {
        setError('Google Sign-Up failed. Please try again.');
        console.error('Google Sign-Up error:', err);
      }
    };

    // Store the callback globally so Google can access it
    (window as any).handleGoogleResponse = handleGoogleResponse;
  }, [navigate]);

  const validateForm = () => {
    if (!fullName.trim()) {
      setError('Full name is required');
      return false;
    }
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!password) {
      setError('Password is required');
      return false;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (!agreedToTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy');
      return false;
    }
    return true;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Use Wix signup which handles authentication
      actions.login();
    } catch (err) {
      setError('Sign up failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Handle Google OAuth Sign-Up
  const handleGoogleSignUp = () => {
    const google = (window as any).google;
    
    if (!google?.accounts?.id) {
      setError('Google Sign-Up is not available. Please check your configuration.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Trigger Google Sign-In prompt
      google.accounts.id.renderButton(
        document.getElementById('google-signup-button'),
        {
          type: 'standard',
          size: 'large',
          text: 'signup_with',
          locale: 'en_US',
        }
      );

      // Alternative: Use One Tap UI
      google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // If One Tap is not displayed, show the button
          const button = document.querySelector('[data-google-signup-button]');
          if (button) {
            (button as HTMLElement).click();
          }
        }
      });
    } catch (err) {
      setError('Failed to initialize Google Sign-Up. Please try again.');
      console.error('Google Sign-Up error:', err);
    } finally {
      setIsSubmitting(false);
    }
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
            Create your account
          </p>
        </div>

        {/* Sign Up Form Card */}
        <motion.div
          className="bg-secondary text-secondary-foreground rounded-lg p-8 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <form onSubmit={handleSignUp} className="space-y-6">
            {/* Full Name Field */}
            <div>
              <label htmlFor="fullName" className="block font-paragraph text-sm font-medium mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-foreground/50" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="pl-10 bg-primary text-primary-foreground border-primary-foreground/20 placeholder:text-primary-foreground/40"
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block font-paragraph text-sm font-medium mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-foreground/50" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 bg-primary text-primary-foreground border-primary-foreground/20 placeholder:text-primary-foreground/40"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block font-paragraph text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-foreground/50" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 pr-10 bg-primary text-primary-foreground border-primary-foreground/20 placeholder:text-primary-foreground/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-foreground/50 hover:text-secondary-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              <p className="font-paragraph text-xs text-secondary-foreground/60 mt-1">
                At least 8 characters
              </p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block font-paragraph text-sm font-medium mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-foreground/50" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="pl-10 pr-10 bg-primary text-primary-foreground border-primary-foreground/20 placeholder:text-primary-foreground/40"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-foreground/50 hover:text-secondary-foreground"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-red-500/10 border border-red-500/30 rounded-lg p-3"
              >
                <p className="font-paragraph text-sm text-red-600">{error}</p>
              </motion.div>
            )}

            {/* Terms Agreement */}
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="w-4 h-4 rounded border-secondary-foreground/30 mt-1"
              />
              <label htmlFor="terms" className="font-paragraph text-sm text-secondary-foreground/70 cursor-pointer">
                I agree to the{' '}
                <button
                  type="button"
                  onClick={() => navigate('/privacy-policy')}
                  className="text-logoGold hover:text-logoGold/80 transition-colors"
                >
                  Terms of Service
                </button>
                {' '}and{' '}
                <button
                  type="button"
                  onClick={() => navigate('/privacy-policy')}
                  className="text-logoGold hover:text-logoGold/80 transition-colors"
                >
                  Privacy Policy
                </button>
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-logoGold text-logoBlack hover:bg-logoGold/90 font-heading font-semibold text-base py-6"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner />
                  <span className="ml-2">Creating account...</span>
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-secondary-foreground/20" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-secondary text-secondary-foreground/70 font-paragraph">
                or sign up with
              </span>
            </div>
          </div>

          {/* Phone Sign Up Button */}
          <Button
            type="button"
            onClick={() => navigate('/firebase-phone-auth')}
            variant="outline"
            className="w-full border-secondary-foreground/30 text-secondary-foreground hover:bg-primary/10 font-paragraph mb-3"
          >
            <Phone className="mr-2 h-5 w-5" />
            Sign up with Phone
          </Button>

          {/* Google Sign Up Button */}
          <div id="google-signup-button" className="w-full" />
          <Button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={isSubmitting}
            variant="outline"
            className="w-full border-secondary-foreground/30 text-secondary-foreground hover:bg-primary/10 font-paragraph"
            data-google-signup-button
          >
            Sign up with Google
          </Button>
        </motion.div>

        {/* Sign In Link */}
        <motion.div
          className="text-center mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <p className="font-paragraph text-primary-foreground/70">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-logoGold hover:text-logoGold/80 font-semibold transition-colors"
            >
              Sign in here
            </button>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
