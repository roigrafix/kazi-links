import { ReactNode } from 'react';
import { useMember } from '@/integrations';
import { SignIn } from '@/components/ui/sign-in';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldX } from 'lucide-react';

interface AdminProtectedRouteProps {
  children: ReactNode;
  messageToSignIn?: string;
  messageToLoading?: string;
  signInTitle?: string;
  adminEmails?: string[];
}

// Default admin emails - you can modify this list or move it to environment variables
const DEFAULT_ADMIN_EMAILS = [
  'admin@example.com',
  'admin@freelanceplatform.com',
  'manager@example.com'
];

export function AdminProtectedRoute({
  children,
  messageToSignIn = "Please sign in with an admin account to access this page.",
  messageToLoading = "Loading page...",
  signInTitle = "Admin Access Required",
  adminEmails = DEFAULT_ADMIN_EMAILS
}: AdminProtectedRouteProps) {
  const { member, isAuthenticated, isLoading } = useMember();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <LoadingSpinner
          message={messageToLoading}
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <SignIn
          title={signInTitle}
          message={messageToSignIn}
        />
      </div>
    );
  }

  // Check if user is admin
  const userEmail = member?.loginEmail?.toLowerCase();
  const isAdmin = userEmail && adminEmails.some(email => email.toLowerCase() === userEmail);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-secondary/5 border-secondary/20">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <ShieldX className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle className="text-secondary">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-secondary/80">
              You don't have permission to access this page. This area is restricted to administrators only.
            </p>
            <p className="text-sm text-secondary/60">
              If you believe you should have access, please contact your system administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}