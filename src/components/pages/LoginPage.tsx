import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMember } from '@/integrations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Image } from '@/components/ui/image';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Mail, Lock, ArrowRight, Eye, EyeOff, Phone } from 'lucide-react';

// ... keep existing code (imports)

export default function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, actions } = useMember();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/');
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Use Wix login which handles authentication
      actions.login();
    } catch (err) {
      setError('Login failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Handle Google OAuth - placeholder for future implementation
  const handleGoogleLogin = () => {
    // TODO: Implement Google OAuth
    // This would typically involve:
    // 1. Initializing Google OAuth SDK
    // 2. Calling Google sign-in
    // 3. Sending the token to your backend
    setError('Google Sign In is coming soon!');
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
            Welcome back
          </p>
        </div>

        {/* Login Form Card */}
        <motion.div
          className="bg-secondary text-secondary-foreground rounded-lg p-8 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <form onSubmit={handleLogin} className="space-y-6">
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

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-secondary-foreground/30"
                />
                <span className="font-paragraph text-secondary-foreground/70">Remember me</span>
              </label>
              <button
                type="button"
                className="font-paragraph text-logoGold hover:text-logoGold/80 transition-colors"
                onClick={() => navigate('/forgot-password')}
              >
                Forgot password?
              </button>
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
                  <span className="ml-2">Signing in...</span>
                </>
              ) : (
                <>
                  Sign In
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
                or continue with
              </span>
            </div>
          </div>

          {/* Phone Login Button */}
          <Button
            type="button"
            onClick={() => navigate('/firebase-phone-auth')}
            variant="outline"
            className="w-full border-secondary-foreground/30 text-secondary-foreground hover:bg-primary/10 font-paragraph mb-3"
          >
            <Phone className="mr-2 h-5 w-5" />
            Sign in with Phone
          </Button>

          {/* Social Login Button */}
          <Button
            type="button"
            onClick={handleGoogleLogin}
            variant="outline"
            className="w-full border-secondary-foreground/30 text-secondary-foreground hover:bg-primary/10 font-paragraph"
          >
             Sign in with Google
          </Button>
        </motion.div>

        {/* Sign Up Link */}
        <motion.div
          className="text-center mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <p className="font-paragraph text-primary-foreground/70">
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/signup')} 
              className="text-logoGold hover:text-logoGold/80 font-semibold transition-colors"
            >
              Sign up here
            </button>
          </p>
        </motion.div>

        {/* Features Section - Kept exactly as is */}
        <motion.div
          className="mt-12 grid grid-cols-3 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {[
            { icon: '🔒', label: 'Secure' },
            { icon: '⚡', label: 'Fast' },
            { icon: '✓', label: 'Verified' }
          ].map((feature, index) => (
            <div key={index} className="text-center">
              <div className="text-2xl mb-2">{feature.icon}</div>
              <p className="font-paragraph text-xs text-primary-foreground/60">
                {feature.label}
              </p>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}