import { MemberProvider } from '@/integrations';
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
import LoginPage from '@/components/pages/LoginPage';
import ProfilePage from '@/components/pages/ProfilePage';
import FreelancerAvailabilityPage from '@/components/pages/FreelancerAvailabilityPage';
import FreelancerDashboardPage from '@/components/pages/FreelancerDashboardPage';
import SupportRequestPage from '@/components/pages/SupportRequestPage';
import ReviewPage from '@/components/pages/ReviewPage';
import AdminDashboardPage from '@/components/pages/AdminDashboardPage';
import SMSAuthPage from '@/components/pages/SMSAuthPage';
import { AdminProtectedRoute } from '@/components/ui/admin-protected-route';
import { MemberProtectedRoute } from '@/components/ui/member-protected-route';
import { FreelancerProtectedRoute } from '@/components/ui/freelancer-protected-route';

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
        path: "tracking",
        element: (
          <MemberProtectedRoute messageToSignIn="Please sign in to track your bookings">
            <TrackingPage />
          </MemberProtectedRoute>
        ),
      },
      {
        path: "login",
        element: <LoginPage />,
      },
      {
        path: "sms-auth",
        element: <SMSAuthPage />,
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
    <MemberProvider>
      <RouterProvider router={router} />
    </MemberProvider>
  );
}
