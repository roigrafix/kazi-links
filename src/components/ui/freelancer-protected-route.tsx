import React, { useState, useEffect } from 'react';
import { useMember } from '@/integrations';
import { BaseCrudService } from '@/integrations';
import { Freelancers } from '@/entities';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { SignIn } from '@/components/ui/sign-in';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserX, Mail } from 'lucide-react';

interface FreelancerProtectedRouteProps {
  children: React.ReactNode;
  messageToSignIn?: string;
}

export function FreelancerProtectedRoute({ 
  children, 
  messageToSignIn = "Please sign in to access the freelancer dashboard" 
}: FreelancerProtectedRouteProps) {
  const { member, isAuthenticated, isLoading } = useMember();
  const [isFreelancer, setIsFreelancer] = useState<boolean | null>(null);
  const [checkingFreelancer, setCheckingFreelancer] = useState(true);

  useEffect(() => {
    checkFreelancerStatus();
  }, [member, isAuthenticated]);

  const checkFreelancerStatus = async () => {
    if (!isAuthenticated || !member?.loginEmail) {
      setIsFreelancer(false);
      setCheckingFreelancer(false);
      return;
    }

    try {
      setCheckingFreelancer(true);
      
      // Check if user is a registered freelancer
      const { items: freelancers } = await BaseCrudService.getAll<Freelancers>('freelancers');
      const freelancer = freelancers.find(f => f.contactEmail === member.loginEmail);
      
      setIsFreelancer(!!freelancer);
    } catch (error) {
      console.error('Error checking freelancer status:', error);
      setIsFreelancer(false);
    } finally {
      setCheckingFreelancer(false);
    }
  };

  // Show loading spinner while checking authentication or freelancer status
  if (isLoading || checkingFreelancer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md bg-white border-0 shadow-lg">
          <CardContent className="p-8 text-center">
            <LoadingSpinner />
            <p className="text-base text-gray-600 mt-4">Verifying access...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show sign-in prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md bg-white border-0 shadow-lg">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto mb-4 p-3 bg-logoGold/10 rounded-full w-fit">
              <UserX className="h-8 w-8 text-logoGold" />
            </div>
            <CardTitle className="text-2xl font-heading font-bold text-gray-900">Access Restricted</CardTitle>
            <CardDescription className="text-base text-gray-600 mt-3 leading-relaxed">
              {messageToSignIn}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <SignIn />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show access denied if authenticated but not a freelancer
  if (isAuthenticated && isFreelancer === false) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-lg bg-white border-0 shadow-lg">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto mb-4 p-3 bg-red-100 rounded-full w-fit">
              <UserX className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-heading font-bold text-gray-900">Freelancer Access Required</CardTitle>
            <CardDescription className="text-base text-gray-600 mt-3 leading-relaxed">
              This dashboard is only available to registered freelancers. Your account ({member?.loginEmail}) is not registered as a freelancer.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-blue-900">Want to become a freelancer?</p>
                  <p className="text-sm text-blue-700 leading-relaxed">
                    Contact our support team to register as a freelancer and gain access to the dashboard.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => window.location.href = '/support'} 
                className="flex-1 bg-logoGold text-logoBlack hover:bg-logoGold/90"
              >
                Contact Support
              </Button>
              <Button 
                onClick={() => window.location.href = '/'} 
                variant="outline"
                className="flex-1"
              >
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render children if user is authenticated and is a freelancer
  return <>{children}</>;
}