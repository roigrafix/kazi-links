import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BaseCrudService } from '@/integrations';
import { Bookings } from '@/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertCircle, Loader, Calendar, Download, Copy, Lock } from 'lucide-react';
import { secureEmailService } from '@/services/secureEmailService';
import { bookingAutomationService } from '@/services/bookingAutomationService';
import { useNotification } from '@/hooks/useNotification';
import { generateBookingPIN, formatPINDisplay } from '@/lib/pin-generator';

type PaymentStatus = 'loading' | 'success' | 'failed' | 'pending';

export default function BookingConfirmationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const notification = useNotification();
  
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('loading');
  const [bookingData, setBookingData] = useState<Bookings | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [bookingPIN, setBookingPIN] = useState('');

  useEffect(() => {
    const verifyPaymentAndCreateBooking = async () => {
      try {
        // Get order ID and status from URL params (from payment gateway redirect)
        const orderId = searchParams.get('order_id');
        const status = searchParams.get('status');

        if (!orderId) {
          setPaymentStatus('failed');
          setErrorMessage('No booking reference found. Please start a new booking.');
          return;
        }

        // Retrieve booking data from sessionStorage
        const pendingBookingStr = sessionStorage.getItem('pendingBooking');
        const storedReferenceId = sessionStorage.getItem('bookingReferenceId');

        if (!pendingBookingStr || storedReferenceId !== orderId) {
          setPaymentStatus('failed');
          setErrorMessage('Booking session expired or invalid. Please start a new booking.');
          return;
        }

        const pendingBooking = JSON.parse(pendingBookingStr) as Bookings;
        setBookingData(pendingBooking);

        // Verify payment with payment gateway
        const paymentVerified = await verifyPaymentWithGateway(
          orderId,
          status,
          pendingBooking.paymentAmount || 0
        );

        if (!paymentVerified) {
          setPaymentStatus('failed');
          setErrorMessage('Payment verification failed. Please try again.');
          return;
        }

        // Payment successful - create the booking in database
        const generatedPIN = generateBookingPIN();
        const bookingToCreate: Bookings = {
          _id: pendingBooking._id || crypto.randomUUID(),
          serviceName: pendingBooking.serviceName,
          freelancerName: pendingBooking.freelancerName,
          bookingDate: pendingBooking.bookingDate,
          bookingTime: pendingBooking.bookingTime,
          serviceLocationType: pendingBooking.serviceLocationType,
          serviceAddress: pendingBooking.serviceAddress,
          clientName: pendingBooking.clientName,
          clientEmail: pendingBooking.clientEmail,
          clientPhone: pendingBooking.clientPhone,
          paymentAmount: pendingBooking.paymentAmount,
          transportationCost: pendingBooking.transportationCost || 0,
          bookingStatus: 'confirmed',
          paymentStatus: 'paid',
          etaStatus: pendingBooking.etaStatus || 'scheduled',
          serviceState: pendingBooking.serviceState,
          serviceCity: pendingBooking.serviceCity,
          clientLocation: pendingBooking.clientLocation,
          pin: generatedPIN,
          refunded: false
        };

        await BaseCrudService.create('bookings', bookingToCreate);
        
        // Format booking date for emails
        const formattedBookingDate = bookingToCreate.bookingDate 
          ? new Date(bookingToCreate.bookingDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })
          : '';
        
        // Send booking confirmation email to client (via secure backend)
        const clientEmailSent = await secureEmailService.sendBookingConfirmation({
          clientName: bookingToCreate.clientName || '',
          clientEmail: bookingToCreate.clientEmail || '',
          serviceName: bookingToCreate.serviceName || '',
          freelancerName: bookingToCreate.freelancerName || '',
          bookingDate: formattedBookingDate,
          bookingTime: bookingToCreate.bookingTime || '',
          serviceAddress: bookingToCreate.serviceAddress || '',
          paymentAmount: bookingToCreate.paymentAmount || 0,
          bookingId: bookingToCreate._id
        });

        if (!clientEmailSent) {
          console.warn('Failed to send booking confirmation email to client, but booking was created successfully');
        }

        // Send booking notification email to freelancer
        try {
          const { items: freelancers } = await BaseCrudService.getAll('freelancers');
          const freelancer = freelancers.find(f => f.fullName === bookingToCreate.freelancerName);
          
          if (freelancer && freelancer.contactEmail) {
            const freelancerEmailSent = await secureEmailService.sendFreelancerBookingNotification(
              freelancer.contactEmail,
              {
                clientName: bookingToCreate.clientName || '',
                clientEmail: bookingToCreate.clientEmail || '',
                serviceName: bookingToCreate.serviceName || '',
                freelancerName: bookingToCreate.freelancerName || '',
                bookingDate: formattedBookingDate,
                bookingTime: bookingToCreate.bookingTime || '',
                serviceAddress: bookingToCreate.serviceAddress || '',
                paymentAmount: bookingToCreate.paymentAmount || 0,
                bookingId: bookingToCreate._id
              }
            );

            if (!freelancerEmailSent) {
              console.warn('Failed to send booking notification email to freelancer, but booking was created successfully');
            }
          }
        } catch (error) {
          console.warn('Error sending freelancer notification email:', error);
        }

        // Trigger Wix Automation workflow
        try {
          const automationPayload = {
            bookingId: bookingToCreate._id,
            clientName: bookingToCreate.clientName || '',
            clientEmail: bookingToCreate.clientEmail || '',
            clientPhone: bookingToCreate.clientPhone || '',
            serviceName: bookingToCreate.serviceName || '',
            freelancerName: bookingToCreate.freelancerName || '',
            bookingDate: formattedBookingDate,
            bookingTime: bookingToCreate.bookingTime || '',
            serviceAddress: bookingToCreate.serviceAddress || '',
            paymentAmount: bookingToCreate.paymentAmount || 0,
            serviceCity: bookingToCreate.serviceCity || '',
            serviceState: bookingToCreate.serviceState || ''
          };

          const automationTriggered = await bookingAutomationService.triggerBookingConfirmation(automationPayload);
          if (!automationTriggered) {
            console.warn('Wix Automation workflow not triggered, but booking was created successfully');
          }
        } catch (error) {
          console.warn('Error triggering Wix Automation:', error);
        }
        
        // Clear sessionStorage
        sessionStorage.removeItem('pendingBooking');
        sessionStorage.removeItem('bookingReferenceId');

        setBookingId(bookingToCreate._id);
        setBookingPIN(generatedPIN);
        setPaymentStatus('success');
      } catch (error) {
        console.error('Error verifying payment or creating booking:', error);
        setPaymentStatus('failed');
        setErrorMessage(
          error instanceof Error 
            ? error.message 
            : 'An error occurred while processing your booking. Please contact support.'
        );
      }
    };

    verifyPaymentAndCreateBooking();
  }, [searchParams]);

  const verifyPaymentWithGateway = async (
    orderId: string | null,
    status: string | null,
    amount: number
  ): Promise<boolean> => {
    try {
      // Simulate payment verification
      // In production, integrate with Razorpay, Stripe, or your payment gateway
      
      // Check if status indicates success
      if (status === 'success' || status === 'completed') {
        return true;
      }

      // If no status provided, assume pending (for testing)
      if (!status) {
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error verifying payment:', error);
      return false;
    }
  };

  const generateICalendarContent = (): string => {
    if (!bookingData) return '';

    const bookingDate = new Date(bookingData.bookingDate || '');
    const [hours, minutes] = (bookingData.bookingTime || '09:00').split(':').map(Number);
    
    // Create start time
    const startTime = new Date(bookingDate);
    startTime.setHours(hours, minutes, 0);
    
    // Create end time (1 hour after start)
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + 1);

    // Format dates for iCalendar (YYYYMMDDTHHMMSSZ)
    const formatICalDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const mins = String(date.getMinutes()).padStart(2, '0');
      const secs = String(date.getSeconds()).padStart(2, '0');
      return `${year}${month}${day}T${hours}${mins}${secs}Z`;
    };

    const icalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Service Booking//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${bookingData._id}@servicebooking.com
DTSTAMP:${formatICalDate(new Date())}
DTSTART:${formatICalDate(startTime)}
DTEND:${formatICalDate(endTime)}
SUMMARY:${bookingData.serviceName} - ${bookingData.freelancerName}
DESCRIPTION:Service: ${bookingData.serviceName}\\nFreelancer: ${bookingData.freelancerName}\\nLocation: ${bookingData.serviceCity}, ${bookingData.serviceState}\\nBooking ID: ${bookingData._id}
LOCATION:${bookingData.serviceAddress || `${bookingData.serviceCity}, ${bookingData.serviceState}`}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    return icalContent;
  };

  const handleAddToGoogleCalendar = () => {
    if (!bookingData) return;

    const bookingDate = new Date(bookingData.bookingDate || '');
    const [hours, minutes] = (bookingData.bookingTime || '09:00').split(':').map(Number);
    
    const startTime = new Date(bookingDate);
    startTime.setHours(hours, minutes, 0);
    
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + 1);

    // Format dates for Google Calendar (YYYYMMDDTHHMMSS)
    const formatGoogleDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const mins = String(date.getMinutes()).padStart(2, '0');
      const secs = String(date.getSeconds()).padStart(2, '0');
      return `${year}${month}${day}T${hours}${mins}${secs}`;
    };

    const eventTitle = `${bookingData.serviceName} - ${bookingData.freelancerName}`;
    const eventDescription = `Booking ID: ${bookingData._id}\nService: ${bookingData.serviceName}\nFreelancer: ${bookingData.freelancerName}\nLocation: ${bookingData.serviceCity}, ${bookingData.serviceState}`;
    const eventLocation = bookingData.serviceAddress || `${bookingData.serviceCity}, ${bookingData.serviceState}`;

    const googleCalendarUrl = new URL('https://calendar.google.com/calendar/render');
    googleCalendarUrl.searchParams.append('action', 'TEMPLATE');
    googleCalendarUrl.searchParams.append('text', eventTitle);
    googleCalendarUrl.searchParams.append('dates', `${formatGoogleDate(startTime)}/${formatGoogleDate(endTime)}`);
    googleCalendarUrl.searchParams.append('details', eventDescription);
    googleCalendarUrl.searchParams.append('location', eventLocation);

    window.open(googleCalendarUrl.toString(), '_blank');
  };

  const handleDownloadICalendar = () => {
    if (!bookingData) return;

    const icalContent = generateICalendarContent();
    const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `booking-${bookingData._id}.ics`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddToOutlook = () => {
    if (!bookingData) return;

    const bookingDate = new Date(bookingData.bookingDate || '');
    const [hours, minutes] = (bookingData.bookingTime || '09:00').split(':').map(Number);
    
    const startTime = new Date(bookingDate);
    startTime.setHours(hours, minutes, 0);
    
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + 1);

    // Format dates for Outlook (YYYY-MM-DDTHH:MM:SS)
    const formatOutlookDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const mins = String(date.getMinutes()).padStart(2, '0');
      const secs = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${mins}:${secs}`;
    };

    const eventTitle = `${bookingData.serviceName} - ${bookingData.freelancerName}`;
    const eventDescription = `Booking ID: ${bookingData._id}\nService: ${bookingData.serviceName}\nFreelancer: ${bookingData.freelancerName}\nLocation: ${bookingData.serviceCity}, ${bookingData.serviceState}`;
    const eventLocation = bookingData.serviceAddress || `${bookingData.serviceCity}, ${bookingData.serviceState}`;

    const outlookUrl = new URL('https://outlook.live.com/calendar/0/deeplink/compose');
    outlookUrl.searchParams.append('subject', eventTitle);
    outlookUrl.searchParams.append('body', eventDescription);
    outlookUrl.searchParams.append('startdt', formatOutlookDate(startTime));
    outlookUrl.searchParams.append('enddt', formatOutlookDate(endTime));
    outlookUrl.searchParams.append('location', eventLocation);

    window.open(outlookUrl.toString(), '_blank');
  };

  if (paymentStatus === 'loading') {
    return (
      <div className="min-h-screen bg-primary text-primary-foreground flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-md mx-auto w-full"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-neonyellow rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader className="h-8 w-8 sm:h-10 sm:w-10 text-logoBlack animate-spin" />
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold mb-4">Processing Payment</h1>
          <p className="font-paragraph text-base sm:text-lg text-primary-foreground/80">
            Please wait while we verify your payment and confirm your booking...
          </p>
        </motion.div>
      </div>
    );
  }

  if (paymentStatus === 'success') {
    return (
      <div className="min-h-screen bg-primary text-primary-foreground flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-2xl"
        >
          <Card className="bg-secondary text-gray-700">
            <CardHeader className="text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-8 w-8 sm:h-10 sm:w-10 text-[#3B3B3B]" />
              </div>
              <CardTitle className="text-2xl sm:text-3xl text-center">
                Booking Confirmed!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 font-medium">
                  Your payment has been successfully processed and your booking is confirmed.
                </p>
              </div>

              {bookingData && (
                <div className="space-y-4">
                  <div className="bg-white/5 rounded-lg p-4 space-y-3">
                    <h3 className="font-semibold text-gray-800 mb-4">Booking Details</h3>
                    
                    <div className="flex justify-between items-start">
                      <span className="text-gray-600">Booking ID:</span>
                      <span className="font-medium text-right">{bookingId}</span>
                    </div>

                    <div className="flex justify-between items-start">
                      <span className="text-gray-600">Service:</span>
                      <span className="font-medium text-right">{bookingData.serviceName}</span>
                    </div>

                    <div className="flex justify-between items-start">
                      <span className="text-gray-600">Freelancer:</span>
                      <span className="font-medium text-right">{bookingData.freelancerName}</span>
                    </div>

                    <div className="flex justify-between items-start">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-medium text-right">
                        {bookingData.bookingDate 
                          ? new Date(bookingData.bookingDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })
                          : 'N/A'
                        }
                      </span>
                    </div>

                    <div className="flex justify-between items-start">
                      <span className="text-gray-600">Time:</span>
                      <span className="font-medium text-right">{bookingData.bookingTime}</span>
                    </div>

                    <div className="flex justify-between items-start">
                      <span className="text-gray-600">Location:</span>
                      <span className="font-medium text-right">
                        {bookingData.serviceCity && bookingData.serviceState
                          ? `${bookingData.serviceCity}, ${bookingData.serviceState}`
                          : 'N/A'
                        }
                      </span>
                    </div>

                    <div className="border-t pt-3 flex justify-between items-start">
                      <span className="text-gray-600 font-semibold">Total Amount Paid:</span>
                      <span className="font-bold text-brightpink text-lg">
                        ₹{bookingData.paymentAmount?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-800 text-sm">
                      <strong>Next Steps:</strong> A confirmation email has been sent to <strong>{bookingData.clientEmail}</strong>. 
                      The freelancer will contact you shortly to confirm the service details.
                    </p>
                  </div>

                  {bookingData.serviceLocationType === 'client' && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <p className="text-orange-800 text-sm">
                        <strong>Transportation Cost:</strong> The transportation cost will be calculated and sent to you via email on the booking date.
                      </p>
                    </div>
                  )}

                  {/* PIN Section */}
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Lock className="h-5 w-5 text-purple-600" />
                      <h4 className="font-semibold text-purple-900">Your Service PIN</h4>
                    </div>
                    <p className="text-sm text-purple-800 mb-4">
                      Share this PIN with your freelancer to activate the service. This PIN is unique to your booking and ensures secure service verification.
                    </p>
                    <div className="bg-white rounded-lg p-4 border-2 border-purple-300 flex items-center justify-between">
                      <div className="text-center flex-1">
                        <p className="text-xs text-purple-600 font-semibold mb-1">PIN</p>
                        <p className="text-3xl font-bold text-purple-900 font-mono tracking-widest">
                          {bookingPIN ? formatPINDisplay(bookingPIN) : '---'}
                        </p>
                      </div>
                      <Button
                        onClick={() => {
                          if (bookingPIN) {
                            navigator.clipboard.writeText(bookingPIN);
                            alert('PIN copied to clipboard!');
                          }
                        }}
                        variant="outline"
                        size="sm"
                        className="ml-4 border-purple-300 text-purple-700 hover:bg-purple-100"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-purple-700 mt-3 font-semibold">
                      ⚠️ Keep this PIN confidential. Only share it with your assigned freelancer.
                    </p>
                  </div>

                  {/* Add to Calendar Section */}
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="h-5 w-5 text-purple-600" />
                      <h4 className="font-semibold text-purple-900">Add to Calendar</h4>
                    </div>
                    <p className="text-sm text-purple-800 mb-3">
                      Save your booking to your calendar for easy reference.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        onClick={handleAddToGoogleCalendar}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm"
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Google Calendar
                      </Button>
                      <Button
                        onClick={handleAddToOutlook}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-sm"
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Outlook
                      </Button>
                      <Button
                        onClick={handleDownloadICalendar}
                        variant="outline"
                        className="flex-1 border-purple-300 text-purple-700 hover:bg-purple-50 text-sm"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download (.ics)
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3 pt-4">
                <Button
                  onClick={() => navigate('/tracking')}
                  className="w-full bg-neonyellow hover:bg-neonyellow/90 text-logoBlack font-semibold"
                >
                  Track Your Booking
                </Button>
                <Button
                  onClick={() => navigate('/')}
                  variant="outline"
                  className="w-full border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
                >
                  Back to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Payment failed
  return (
    <div className="min-h-screen bg-primary text-primary-foreground flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl"
      >
        <Card className="bg-secondary text-gray-700">
          <CardHeader className="text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            </div>
            <CardTitle className="text-2xl sm:text-3xl text-center text-red-600">
              Booking Failed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-800 font-medium mb-2">Payment Processing Failed</p>
                  <p className="text-red-700 text-sm">
                    {errorMessage || 'An error occurred while processing your payment. Please try again.'}
                  </p>
                </div>
              </div>
            </div>

            {bookingData && (
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">Booking Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service:</span>
                    <span className="font-medium">{bookingData.serviceName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-medium">₹{bookingData.paymentAmount?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-sm">
                <strong>What to do next:</strong> You can try booking again or contact our support team if you continue to experience issues.
              </p>
            </div>

            <div className="space-y-3 pt-4">
              <Button
                onClick={() => navigate('/booking')}
                className="w-full bg-neonyellow hover:bg-neonyellow/90 text-logoBlack font-semibold"
              >
                Try Booking Again
              </Button>
              <Button
                onClick={() => navigate('/support')}
                variant="outline"
                className="w-full border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
              >
                Contact Support
              </Button>
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className="w-full border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
              >
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
