import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMember } from '@/integrations';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, actions } = useMember();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/');
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Trigger Wix login on mount
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      actions.login();
    }
  }, [isLoading, isAuthenticated, actions]);

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner />
        <p className="mt-4 font-paragraph text-primary-foreground">
          Redirecting to login...
        </p>
      </div>
    </div>
  );
}
