import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMember } from '@/integrations';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, actions } = useMember();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/');
    }
  }, [isAuthenticated, isLoading, navigate]);

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
            Sign in to your account
          </p>
        </div>

        {/* Login Card */}
        <motion.div
          className="bg-secondary text-secondary-foreground rounded-lg p-8 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="space-y-6">
            <p className="font-paragraph text-sm text-secondary-foreground/70 text-center">
              Use Wix's secure authentication to sign in to your account.
            </p>

            {/* Wix Login Button */}
            <Button
              onClick={() => actions.login()}
              disabled={isLoading}
              className="w-full bg-logoGold text-logoBlack hover:bg-logoGold/90 font-heading font-semibold text-base py-6"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner />
                  <span className="ml-2">Signing in...</span>
                </>
              ) : (
                <>
                  Sign In with Wix
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </div>
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
              onClick={() => actions.login()}
              className="text-logoGold hover:text-logoGold/80 font-semibold transition-colors"
            >
              Sign up here
            </button>
          </p>
        </motion.div>

        {/* Features Section */}
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