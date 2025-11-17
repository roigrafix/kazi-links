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
        element: <TrackingPage />,
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
