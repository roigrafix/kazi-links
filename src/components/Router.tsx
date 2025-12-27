import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { ScrollToTop } from '@/lib/scroll-to-top';
import ErrorPage from '@/integrations/errorHandlers/ErrorPage';
import Layout from '@/components/Layout';
import HomePage from '@/components/pages/HomePage';
import ServicesPage from '@/components/pages/ServicesPage';
import ServiceDetailPage from '@/components/pages/ServiceDetailPage';
import FreelancersPage from '@/components/pages/FreelancersPage';
import FreelancerDetailPage from '@/components/pages/FreelancerDetailPage';
import BookingPage from '@/components/pages/BookingPage';
import TrackingPage from '@/components/pages/TrackingPage';
import RefundPage from '@/components/pages/RefundPage';
import LoginPage from '@/components/pages/LoginPage';
import SignUpPage from '@/components/pages/SignUpPage';
import ForgotPasswordPage from '@/components/pages/ForgotPasswordPage';
import MessagingCenterOTPPage from '@/components/pages/MessagingCenterOTPPage';
import ProfilePage from '@/components/pages/ProfilePage';
import FreelancerAvailabilityPage from '@/components/pages/FreelancerAvailabilityPage';
import FreelancerDashboardPage from '@/components/pages/FreelancerDashboardPage';
import SupportRequestPage from '@/components/pages/SupportRequestPage';
import ReviewPage from '@/components/pages/ReviewPage';
import AdminDashboardPage from '@/components/pages/AdminDashboardPage';
import AdminRefundsPage from '@/components/pages/AdminRefundsPage';
import AdminSupportPage from '@/components/pages/AdminSupportPage';
import PrivacyPolicyPage from '@/components/pages/PrivacyPolicyPage';
import TermsOfServicePage from '@/components/pages/TermsOfServicePage';
import ClientRefundTrackingPage from '@/components/pages/ClientRefundTrackingPage';
import BookingConfirmationPage from '@/components/pages/BookingConfirmationPage';
import CustomerServicePage from '@/components/pages/CustomerServicePage';
import TestEmailPage from '@/components/pages/TestEmailPage';
import TwilioConfigDiagnosticsPage from '@/components/pages/TwilioConfigDiagnosticsPage';
import { AdminProtectedRoute } from '@/components/ui/admin-protected-route';
import { MemberProtectedRoute } from '@/components/ui/member-protected-route';
import { FreelancerProtectedRoute } from '@/components/ui/freelancer-protected-route';
import { lazy, Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Lazy load MemberProvider to avoid dynamic import issues
const MemberProvider = lazy(() => import('@/integrations').then(m => ({ default: m.MemberProvider })));

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <>
        <ScrollToTop />
        <Layout />
      </>
    ),
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "services",
        element: <ServicesPage />,
      },
      {
        path: "services/:id",
        element: <ServiceDetailPage />,
      },
      {
        path: "freelancers",
        element: <FreelancersPage />,
      },
      {
        path: "freelancers/:id",
        element: <FreelancerDetailPage />,
      },
      {
        path: "booking",
        element: <BookingPage />,
      },
      {
        path: "booking-confirmation",
        element: <BookingConfirmationPage />,
      },
      {
        path: "tracking",
        element: (
          <MemberProtectedRoute messageToSignIn="Please sign in to track your bookings">
            <TrackingPage />
          </MemberProtectedRoute>
        ),
        children: [
          {
            path: "refunds",
            element: (
              <MemberProtectedRoute messageToSignIn="Please sign in to track your refunds">
                <ClientRefundTrackingPage />
              </MemberProtectedRoute>
            ),
          },
        ],
      },
      {
        path: "refund",
        element: (
          <MemberProtectedRoute messageToSignIn="Please sign in to process your refund">
            <RefundPage />
          </MemberProtectedRoute>
        ),
      },
      {
        path: "login",
        element: <LoginPage />,
      },
      {
        path: "signup",
        element: <SignUpPage />,
      },
      {
        path: "forgot-password",
        element: <ForgotPasswordPage />,
      },
      {
        path: "phone-auth",
        element: <MessagingCenterOTPPage />,
      },
      {
        path: "profile",
        element: (
          <MemberProtectedRoute messageToSignIn="Please sign in to view your profile">
            <ProfilePage />
          </MemberProtectedRoute>
        ),
      },
      {
        path: "support",
        element: <SupportRequestPage />,
      },
      {
        path: "customer-service",
        element: <CustomerServicePage />,
      },
      {
        path: "review",
        element: <ReviewPage />,
      },
      {
        path: "freelancer-dashboard",
        element: (
          <FreelancerProtectedRoute messageToSignIn="Please sign in to access your freelancer dashboard">
            <FreelancerDashboardPage />
          </FreelancerProtectedRoute>
        ),
      },
      {
        path: "admin",
        element: (
          <AdminProtectedRoute messageToSignIn="Please sign in with an admin account to access the admin dashboard.">
            <AdminDashboardPage />
          </AdminProtectedRoute>
        ),
      },
      {
        path: "freelancer-availability",
        element: (
          <AdminProtectedRoute messageToSignIn="Please sign in with an admin account to manage freelancer availability.">
            <FreelancerAvailabilityPage />
          </AdminProtectedRoute>
        ),
      },
      {
        path: "privacy-policy",
        element: <PrivacyPolicyPage />,
      },
      {
        path: "terms-of-service",
        element: <TermsOfServicePage />,
      },
      {
        path: "admin-refunds",
        element: (
          <AdminProtectedRoute messageToSignIn="Please sign in with an admin account to manage refunds.">
            <AdminRefundsPage />
          </AdminProtectedRoute>
        ),
      },
      {
        path: "admin-support",
        element: (
          <AdminProtectedRoute messageToSignIn="Please sign in with an admin account to manage support requests.">
            <AdminSupportPage />
          </AdminProtectedRoute>
        ),
      },
      {
        path: "test-email",
        element: <TestEmailPage />,
      },
      {
        path: "twilio-diagnostics",
        element: <TwilioConfigDiagnosticsPage />,
      },

      {
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
], {
  basename: import.meta.env.BASE_NAME,
});

export default function AppRouter() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <MemberProvider>
        <RouterProvider router={router} />
      </MemberProvider>
    </Suspense>
  );
}
