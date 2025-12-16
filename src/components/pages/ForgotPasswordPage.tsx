import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMember } from '@/integrations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Image } from '@/components/ui/image';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Mail, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useMember();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/');
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate sending password reset email
      // In a real implementation, this would call your backend API
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSubmitted(true);
    } catch (err) {
      setError('Failed to send reset email. Please try again.');
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
            {submitted ? 'Check your email' : 'Reset your password'}
          </p>
        </div>

        {/* Content Card */}
        <motion.div
          className="bg-secondary text-secondary-foreground rounded-lg p-8 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {!submitted ? (
            <>
              {/* Form Content */}
              <div className="mb-6">
                <p className="font-paragraph text-secondary-foreground/70 text-center">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
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

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-logoGold text-logoBlack hover:bg-logoGold/90 font-heading font-semibold text-base py-6"
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner />
                      <span className="ml-2">Sending...</span>
                    </>
                  ) : (
                    <>
                      Send Reset Link
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </form>
            </>
          ) : (
            <>
              {/* Success Content */}
              <motion.div
                className="text-center space-y-6"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex justify-center">
                  <CheckCircle className="h-16 w-16 text-logoGold" />
                </div>

                <div>
                  <h2 className="font-heading text-2xl font-bold mb-2">Check your email</h2>
                  <p className="font-paragraph text-secondary-foreground/70">
                    We've sent a password reset link to <span className="font-semibold">{email}</span>
                  </p>
                </div>

                <div className="bg-primary/20 rounded-lg p-4">
                  <p className="font-paragraph text-sm text-secondary-foreground/70">
                    The link will expire in 24 hours. If you don't see the email, check your spam folder.
                  </p>
                </div>

                <Button
                  onClick={() => navigate('/login')}
                  className="w-full bg-logoGold text-logoBlack hover:bg-logoGold/90 font-heading font-semibold text-base py-6"
                >
                  Back to Login
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
            </>
          )}
        </motion.div>

        {/* Back to Login Link */}
        {!submitted && (
          <motion.div
            className="text-center mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-2 font-paragraph text-primary-foreground/70 hover:text-primary-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
