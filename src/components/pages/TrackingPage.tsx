import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BaseCrudService, useMember } from '@/integrations';
import { Bookings } from '@/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Clock, User, Phone, Mail, Navigation, CheckCircle, AlertCircle, Calendar, X, Shield, Star, History, Zap, MessageSquare, Settings } from 'lucide-react';
import { format, differenceInHours } from 'date-fns';
import { twilioService } from '@/services/twilioService';
import { realtimeService } from '@/services/realtimeService';
import { useToast } from '@/hooks/use-toast';

export default function TrackingPage() {
  const { member } = useMember();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Bookings[]>([]);
  const [activeBookings, setActiveBookings] = useState<Bookings[]>([]);
  const [pastBookings, setPastBookings] = useState<Bookings[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);
  const [completingBookingId, setCompletingBookingId] = useState<string | null>(null);
  const [realtimeUpdates, setRealtimeUpdates] = useState<Map<string, Bookings>>(new Map());
  
  // SMS OTP states
  const [showOTPDialog, setShowOTPDialog] = useState(false);
  const [selectedBookingForCancel, setSelectedBookingForCancel] = useState<Bookings | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [generatedOTP, setGeneratedOTP] = useState('');
  const [isOTPSending, setIsOTPSending] = useState(false);
  const [isOTPSent, setIsOTPSent] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpResendTimer, setOtpResendTimer] = useState(0);
  const [isOTPVerifying, setIsOTPVerifying] = useState(false);
  const [showProviderConfig, setShowProviderConfig] = useState(false);
  
  // Provider configuration states
  const [twilioAccountSid, setTwilioAccountSid] = useState('');
  const [twilioAuthToken, setTwilioAuthToken] = useState('');
  const [twilioPhoneNumber, setTwilioPhoneNumber] = useState('');
  
  // Configure providers with user-provided credentials
  const configureProviders = () => {
    if (twilioAccountSid.trim() && twilioAuthToken.trim() && twilioPhoneNumber.trim()) {
      // Store in localStorage for persistence
      localStorage.setItem('ACfd9172eeae25bf29c2dbb1311d7d358b', twilioAccountSid.trim());
      localStorage.setItem('d04a0241023a0ea97d463d624d73829b', twilioAuthToken.trim());
      localStorage.setItem('+12513124247', twilioPhoneNumber.trim());
    }
    
    setShowProviderConfig(false);
  };
  
  // Check if Twilio is configured
  const isTwilioConfigured = () => {
    return twilioService.isConfigured();
  };

  // Check if booking can be cancelled (12 hours before booking date)
  const canCancelBooking = (booking: Bookings): boolean => {
    if (!booking.bookingDate || booking.bookingStatus === 'cancelled') {
      return false;
    }
    
    const bookingDateTime = new Date(booking.bookingDate);
    // If booking has a time, add it to the date
    if (booking.bookingTime) {
      const [hours, minutes] = booking.bookingTime.split(':').map(Number);
      bookingDateTime.setHours(hours, minutes);
    }
    
    const now = new Date();
    const hoursUntilBooking = differenceInHours(bookingDateTime, now);
    
    return hoursUntilBooking >= 12;
  };

  // Generate a 6-digit OTP
  const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Send OTP via Twilio SMS
  const sendOTP = async (booking: Bookings): Promise<boolean> => {
    setIsOTPSending(true);
    setOtpError('');
    
    try {
      if (!booking.clientPhone) {
        setOtpError('Phone number not available for this booking.');
        return false;
      }

      // Generate new OTP
      const newOTP = generateOTP();
      setGeneratedOTP(newOTP);
      
      // Format phone number to E.164 format
      const formattedPhone = twilioService.formatPhoneNumber(booking.clientPhone);
      
      // Send OTP via Twilio
      const result = await twilioService.sendOTP(formattedPhone);
      
      if (result.success) {
        setIsOTPSent(true);
        setOtpResendTimer(60); // 60 seconds cooldown
        toast({
          title: 'OTP Sent',
          description: `Verification code sent to ${formattedPhone}`,
        });
        return true;
      } else {
        setOtpError(result.message || 'Failed to send OTP. Please try again.');
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive',
        });
        return false;
      }
      
    } catch (error) {
      setOtpError('Failed to send OTP. Please try again.');
      console.error('OTP sending error:', error);
      toast({
        title: 'Error',
        description: 'Failed to send OTP. Please try again.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsOTPSending(false);
    }
  };

  // Handle OTP resend timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpResendTimer > 0) {
      interval = setInterval(() => {
        setOtpResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpResendTimer]);

  // Verify OTP and proceed with cancellation
  const verifyOTPAndCancel = async () => {
    if (!selectedBookingForCancel) return;
    
    setOtpError('');
    setIsOTPVerifying(true);
    
    try {
      // Verify OTP with Twilio
      const formattedPhone = twilioService.formatPhoneNumber(selectedBookingForCancel.clientPhone || '');
      const result = await twilioService.verifyOTP(formattedPhone, otpCode);
      
      if (!result.success || !result.valid) {
        setOtpError(result.message || 'Invalid OTP. Please check and try again.');
        return;
      }
      
      // OTP verified, proceed with cancellation
      setCancellingBookingId(selectedBookingForCancel._id);
      
      await BaseCrudService.update('bookings', {
        _id: selectedBookingForCancel._id,
        bookingStatus: 'cancelled'
      });
      
      // Update local state for active bookings
      setActiveBookings(prev => 
        prev.map(booking => 
          booking._id === selectedBookingForCancel._id 
            ? { ...booking, bookingStatus: 'cancelled' }
            : booking
        ).filter(booking => booking.bookingStatus !== 'cancelled')
      );
      
      // Update local state for past bookings (add cancelled booking to past)
      setPastBookings(prev => [
        ...prev,
        { ...selectedBookingForCancel, bookingStatus: 'cancelled' }
      ]);
      
      // Also update the main bookings array
      setBookings(prev => 
        prev.map(booking => 
          booking._id === selectedBookingForCancel._id 
            ? { ...booking, bookingStatus: 'cancelled' }
            : booking
        )
      );
      
      // Close OTP dialog and reset states
      setShowOTPDialog(false);
      resetOTPStates();
      
      toast({
        title: 'Success',
        description: 'Booking cancelled successfully.',
      });
      
    } catch (error) {
      console.error('Error cancelling booking:', error);
      setOtpError('Failed to cancel booking. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to cancel booking. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setCancellingBookingId(null);
      setIsOTPVerifying(false);
    }
  };

  // Reset OTP related states
  const resetOTPStates = () => {
    setSelectedBookingForCancel(null);
    setOtpCode('');
    setGeneratedOTP('');
    setIsOTPSent(false);
    setOtpError('');
    setOtpResendTimer(0);
  };

  // Handle cancel booking button click
  const handleCancelBookingClick = async (booking: Bookings) => {
    if (!isTwilioConfigured()) {
      setShowProviderConfig(true);
      return;
    }
    
    setSelectedBookingForCancel(booking);
    setShowOTPDialog(true);
    
    // Automatically send OTP when dialog opens
    await sendOTP(booking);
  };

  // Handle mark as completed button click
  const handleMarkAsCompleted = async (booking: Bookings) => {
    setCompletingBookingId(booking._id);
    try {
      await BaseCrudService.update('bookings', {
        _id: booking._id,
        bookingStatus: 'completed'
      });
      
      // Update local state for active bookings
      setActiveBookings(prev => 
        prev.filter(b => b._id !== booking._id)
      );
      
      // Update local state for past bookings (add completed booking to past)
      setPastBookings(prev => [
        ...prev,
        { ...booking, bookingStatus: 'completed' }
      ]);
      
      // Also update the main bookings array
      setBookings(prev => 
        prev.map(b => 
          b._id === booking._id 
            ? { ...b, bookingStatus: 'completed' }
            : b
        )
      );
      
    } catch (error) {
      console.error('Error marking booking as completed:', error);
    } finally {
      setCompletingBookingId(null);
    }
  };

  useEffect(() => {
    const fetchUserBookings = async () => {
      if (!member?.loginEmail) return;
      
      setIsLoading(true);
      try {
        const { items } = await BaseCrudService.getAll<Bookings>('bookings');
        // Filter bookings for the current user
        const userBookings = items.filter(booking => 
          booking.clientEmail === member.loginEmail
        );
        
        setBookings(userBookings);
        
        // Separate active and past bookings
        const now = new Date();
        const active = userBookings.filter(booking => {
          if (!booking.bookingDate) return false;
          const bookingDate = new Date(booking.bookingDate);
          return bookingDate >= now && booking.bookingStatus !== 'cancelled' && booking.bookingStatus !== 'completed';
        });
        
        const past = userBookings.filter(booking => {
          if (!booking.bookingDate) return true;
          const bookingDate = new Date(booking.bookingDate);
          return bookingDate < now || booking.bookingStatus === 'cancelled' || booking.bookingStatus === 'completed';
        });
        
        setActiveBookings(active);
        setPastBookings(past);

        // Subscribe to real-time updates for all active bookings
        const activeBookingIds = active.map(b => b._id);
        if (activeBookingIds.length > 0) {
          const unsubscribe = realtimeService.subscribeToMultiple(
            activeBookingIds,
            (updatedBooking) => {
              // Update the booking in state
              setRealtimeUpdates(prev => {
                const newMap = new Map(prev);
                newMap.set(updatedBooking._id, updatedBooking);
                return newMap;
              });

              // Update active bookings with the latest data
              setActiveBookings(prev =>
                prev.map(b => b._id === updatedBooking._id ? updatedBooking : b)
              );

              // Update main bookings array
              setBookings(prev =>
                prev.map(b => b._id === updatedBooking._id ? updatedBooking : b)
              );
            }
          );

          // Cleanup on unmount
          return () => {
            unsubscribe();
            realtimeService.stopAllPolling();
          };
        }
      } catch (error) {
        console.error('Error fetching user bookings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserBookings();
  }, [member?.loginEmail]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-500';
      case 'in-progress':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-purple-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getETAStatus = (etaStatus: string | undefined) => {
    switch (etaStatus?.toLowerCase()) {
      case 'scheduled':
        return { icon: Calendar, text: 'Scheduled', color: 'text-blue-400' };
      case 'on-the-way':
        return { icon: Navigation, text: 'On the way', color: 'text-orange-400' };
      case 'arrived':
        return { icon: CheckCircle, text: 'Arrived', color: 'text-green-400' };
      case 'in-service':
        return { icon: User, text: 'Service in progress', color: 'text-purple-400' };
      case 'completed':
        return { icon: CheckCircle, text: 'Completed', color: 'text-green-400' };
      default:
        // Default to 'Scheduled' if no status is set
        return { icon: Calendar, text: 'Scheduled', color: 'text-blue-400' };
    }
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'Not specified';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'PPP');
  };

  // Render booking card component
  const renderBookingCard = (booking: Bookings, index: number) => {
    const etaInfo = getETAStatus(booking.liveStatus);
    const ETAIcon = etaInfo.icon;
    
    return (
      <motion.div
        key={booking._id}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: index * 0.1 }}
      >
        <Card className="bg-secondary text-secondary-foreground">
          <CardContent className="p-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Booking Details */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-heading text-xl font-semibold mb-2">
                      {booking.serviceName}
                    </h3>
                    <p className="text-secondary-foreground/70">
                      with {booking.freelancerName}
                    </p>
                  </div>
                  <Badge className={`${getStatusColor(booking.bookingStatus || '')} text-[#3B3B3B]`}>
                    {booking.bookingStatus}
                  </Badge>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-brightpink" />
                    <span className="text-sm">
                      {formatDate(booking.bookingDate)} at {booking.bookingTime}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-electricblue" />
                    <span className="text-sm">
                      {booking.serviceLocationType === 'client' ? 'At your location' : 'At freelancer location'}
                    </span>
                  </div>
                </div>

                {booking.serviceAddress && (
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-palemint mt-0.5" />
                      <div className="flex-1">
                        <span className="text-sm">{booking.serviceAddress}</span>
                        {booking.serviceLocationType === 'freelancer' && (
                          <div className="text-xs text-green-400 mt-1">
                            ✓ Freelancer's exact address (revealed after booking confirmation)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <span className="text-secondary-foreground/70">Total:</span>
                    <span className="font-semibold text-brightpink">
                      ₹{booking.paymentAmount}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-secondary-foreground/70">Payment:</span>
                    <Badge variant={booking.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                      {booking.paymentStatus}
                    </Badge>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 flex flex-col sm:flex-row gap-2">
                  {/* Mark as Completed Button - Only for active bookings */}
                  {booking.bookingStatus !== 'cancelled' && booking.bookingStatus !== 'completed' && (
                    <Button 
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white flex-1"
                      onClick={() => handleMarkAsCompleted(booking)}
                      disabled={completingBookingId === booking._id}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {completingBookingId === booking._id ? 'Marking...' : 'Mark as Completed'}
                    </Button>
                  )}

                  {/* Cancel Booking Button - Only for active bookings */}
                  {canCancelBooking(booking) && (
                    <Button 
                      variant="destructive" 
                      size="sm"
                      className="bg-red-600 hover:bg-red-700 text-white flex-1"
                      onClick={() => handleCancelBookingClick(booking)}
                      disabled={cancellingBookingId === booking._id}
                    >
                      <X className="h-4 w-4 mr-2" />
                      {cancellingBookingId === booking._id ? 'Cancelling...' : 'Cancel Booking'}
                    </Button>
                  )}
                </div>

                {/* Write Review Button - Only show for completed bookings */}
                {booking.bookingStatus === 'completed' && (
                  <div className="mt-4">
                    <Button 
                      asChild
                      size="sm"
                      className="bg-logoGold text-logoBlack hover:bg-logoGold/90 w-full"
                    >
                      <Link to={`/review?booking=${booking._id}`}>
                        <Star className="h-4 w-4 mr-2" />
                        Write Review
                      </Link>
                    </Button>
                  </div>
                )}

                {/* Cancellation Policy Info - Only for active bookings */}
                {booking.bookingStatus !== 'cancelled' && booking.bookingStatus !== 'completed' && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-800 mb-1">Cancellation Policy</p>
                        <p className="text-blue-700">
                          {canCancelBooking(booking) 
                            ? "You can cancel this booking up to 12 hours before the scheduled time."
                            : "Cancellation is no longer available (less than 12 hours before booking)."
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ETA Status - Only for active bookings */}
              {booking.bookingStatus !== 'cancelled' && booking.bookingStatus !== 'completed' && (
                <div className="lg:col-span-1">
                  <div className="bg-white/5 rounded-lg p-4 h-full flex flex-col justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 bg-primary/20 rounded-full flex items-center justify-center">
                        <ETAIcon className={`h-8 w-8 ${etaInfo.color}`} />
                      </div>
                      <h4 className="font-semibold mb-2">Live Status</h4>
                      <p className={`text-sm ${etaInfo.color}`}>
                        {etaInfo.text}
                      </p>
                      
                      {/* Real-time Update Indicator */}
                      {realtimeUpdates.has(booking._id) && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="mt-3 p-2 bg-green-500/20 rounded-lg border border-green-500/50"
                        >
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <Zap className="h-3 w-3 text-green-500 animate-pulse" />
                            <span className="text-xs font-semibold text-green-500">Live Update</span>
                          </div>
                        </motion.div>
                      )}
                      
                      {booking.liveStatus && ['on the way', '10mins', '5mins', '2mins'].includes(booking.liveStatus.toLowerCase()) && (
                        <div className="mt-3">
                          <p className="text-xs text-secondary-foreground/70 mb-1">
                            Real-time update
                          </p>
                          <p className="font-semibold text-logoGold">
                            {booking.liveStatus}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Contact Info */}
            <div className="mt-6 pt-6 border-t border-secondary-foreground/10">
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-secondary-foreground/50" />
                  <span>{booking.clientName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-secondary-foreground/50" />
                  <span>{booking.clientEmail}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-secondary-foreground/50" />
                  <span>{booking.clientPhone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-secondary-foreground/50" />
                  <span>Booked on {formatDate(booking._createdDate)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-primary text-primary-foreground">
      {/* Header */}
      <section className="py-16 bg-secondary text-secondary-foreground">
        <div className="container mx-auto px-6 lg:px-12 max-w-[100rem]">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="font-heading text-4xl lg:text-6xl font-bold mb-6">
              My Bookings
            </h1>
            <p className="font-paragraph text-xl text-secondary-foreground/70 max-w-2xl mx-auto">
              Track your active bookings and view your booking history
            </p>
          </motion.div>
          
          {/* Provider Configuration Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center mt-8"
          >
            <Button
              variant="outline"
              onClick={() => setShowProviderConfig(true)}
              className="border-secondary-foreground/20 text-secondary-foreground hover:bg-secondary-foreground/10"
            >
              <Settings className="h-4 w-4 mr-2" />
              Configure Twilio SMS
            </Button>
            
            {/* Provider Status Indicator */}
            <div className="flex justify-center gap-4 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isTwilioConfigured() ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span>Twilio SMS {isTwilioConfigured() ? 'Ready' : 'Not Configured'}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="container mx-auto px-6 lg:px-12 max-w-[100rem]">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-logoGold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="font-paragraph text-lg">Loading your bookings...</p>
            </div>
          ) : (
            <Tabs defaultValue="active" className="w-full">
              <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8">
                <TabsTrigger value="active" className="flex items-center gap-2">
                  <Navigation className="h-4 w-4" />
                  Active Bookings ({activeBookings.length})
                </TabsTrigger>
                <TabsTrigger value="history" className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  History ({pastBookings.length})
                </TabsTrigger>
              </TabsList>

              {/* Active Bookings Tab */}
              <TabsContent value="active" className="space-y-6">
                {activeBookings.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center py-12"
                  >
                    <div className="w-24 h-24 mx-auto mb-6 bg-secondary/10 rounded-full flex items-center justify-center">
                      <Calendar className="h-12 w-12 text-primary-foreground/50" />
                    </div>
                    <h3 className="font-heading text-2xl font-semibold mb-4">
                      No Active Bookings
                    </h3>
                    <p className="font-paragraph text-primary-foreground/70 mb-6">
                      You don't have any active bookings at the moment.
                    </p>
                    <Button 
                      asChild
                      className="bg-logoGold text-logoBlack hover:bg-logoGold/90"
                    >
                      <Link to="/services">
                        Browse Services
                      </Link>
                    </Button>
                  </motion.div>
                ) : (
                  <div className="space-y-6">
                    <motion.h2
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6 }}
                      className="font-heading text-2xl font-bold text-center mb-8"
                    >
                      Your Active Bookings ({activeBookings.length})
                    </motion.h2>

                    <div className="grid gap-6">
                      {activeBookings.map((booking, index) => renderBookingCard(booking, index))}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Booking History Tab */}
              <TabsContent value="history" className="space-y-6">
                {pastBookings.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center py-12"
                  >
                    <div className="w-24 h-24 mx-auto mb-6 bg-secondary/10 rounded-full flex items-center justify-center">
                      <History className="h-12 w-12 text-primary-foreground/50" />
                    </div>
                    <h3 className="font-heading text-2xl font-semibold mb-4">
                      No Booking History
                    </h3>
                    <p className="font-paragraph text-primary-foreground/70 mb-6">
                      Your completed and cancelled bookings will appear here.
                    </p>
                  </motion.div>
                ) : (
                  <div className="space-y-6">
                    <motion.h2
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6 }}
                      className="font-heading text-2xl font-bold text-center mb-8"
                    >
                      Your Booking History ({pastBookings.length})
                    </motion.h2>

                    <div className="grid gap-6">
                      {pastBookings.map((booking, index) => renderBookingCard(booking, index))}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </section>

      {/* How Tracking Works */}
      <section className="py-16 bg-secondary text-secondary-foreground">
        <div className="container mx-auto px-6 lg:px-12 max-w-[100rem]">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-heading text-3xl lg:text-4xl font-bold mb-4">
              How Live Tracking Works
            </h2>
            <p className="font-paragraph text-lg text-secondary-foreground/70">
              Stay informed every step of the way with real-time updates
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                icon: Calendar,
                title: "Scheduled",
                description: "Your booking is confirmed and scheduled",
                color: "text-blue-400"
              },
              {
                icon: Navigation,
                title: "On the Way",
                description: "Freelancer is traveling to your location",
                color: "text-orange-400"
              },
              {
                icon: CheckCircle,
                title: "Arrived",
                description: "Freelancer has arrived at the location",
                color: "text-green-400"
              },
              {
                icon: User,
                title: "In Progress",
                description: "Service is being performed",
                color: "text-purple-400"
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
                  <step.icon className={`h-8 w-8 ${step.color}`} />
                </div>
                <h3 className="font-heading text-lg font-semibold mb-2">
                  {step.title}
                </h3>
                <p className="font-paragraph text-sm text-secondary-foreground/70">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* OTP Verification Dialog */}
      <Dialog open={showOTPDialog} onOpenChange={(open) => {
        if (!open) {
          setShowOTPDialog(false);
          resetOTPStates();
        }
      }}>
        <DialogContent className="bg-secondary text-secondary-foreground max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Security Verification
            </DialogTitle>
            <DialogDescription className="text-secondary-foreground/70">
              For your security, we need to verify your identity before cancelling this booking.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Booking Details */}
            {selectedBookingForCancel && (
              <div className="bg-white/5 rounded-lg p-3">
                <h4 className="font-medium mb-2">Booking to Cancel:</h4>
                <div className="text-sm space-y-1">
                  <p><strong>Service:</strong> {selectedBookingForCancel.serviceName}</p>
                  <p><strong>Date:</strong> {formatDate(selectedBookingForCancel.bookingDate)} at {selectedBookingForCancel.bookingTime}</p>
                  <p><strong>Freelancer:</strong> {selectedBookingForCancel.freelancerName}</p>
                </div>
              </div>
            )}

            {/* OTP Input Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="otp">Enter Verification Code</Label>
                {isOTPSent && (
                  <span className="text-xs text-green-600">
                    ✓ Code sent via SMS to {selectedBookingForCancel?.clientPhone}
                  </span>
                )}
              </div>
              
              <Input
                id="otp"
                type="text"
                placeholder="Enter 6-digit code"
                value={otpCode}
                onChange={(e) => {
                  setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                  setOtpError('');
                }}
                maxLength={6}
                className="text-center text-lg tracking-widest"
                disabled={!isOTPSent}
              />

              {/* OTP Error */}
              {otpError && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  {otpError}
                </div>
              )}

              {/* Resend OTP */}
              {isOTPSent && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-secondary-foreground/70">
                    Didn't receive the code?
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => selectedBookingForCancel && sendOTP(selectedBookingForCancel)}
                    disabled={otpResendTimer > 0 || isOTPSending}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    {otpResendTimer > 0 ? `Resend in ${otpResendTimer}s` : 'Resend Code'}
                  </Button>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowOTPDialog(false);
                resetOTPStates();
              }}
              className="border-secondary-foreground/20 text-secondary-foreground hover:bg-secondary-foreground/10"
            >
              Cancel
            </Button>
            
            {!isOTPSent ? (
              <Button
                onClick={() => selectedBookingForCancel && sendOTP(selectedBookingForCancel)}
                disabled={isOTPSending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isOTPSending ? 'Sending...' : 'Send Code via SMS'}
              </Button>
            ) : (
              <Button
                onClick={verifyOTPAndCancel}
                disabled={otpCode.length !== 6 || isOTPVerifying}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isOTPVerifying ? 'Verifying...' : 'Verify & Cancel Booking'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Twilio Configuration Dialog */}
      <Dialog open={showProviderConfig} onOpenChange={setShowProviderConfig}>
        <DialogContent className="bg-secondary text-secondary-foreground max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configure Twilio SMS
            </DialogTitle>
            <DialogDescription className="text-secondary-foreground/70">
              Set up your Twilio credentials to enable SMS OTP verification for booking cancellations.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Twilio Configuration */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold">Twilio SMS Configuration</h3>
                <Badge variant={isTwilioConfigured() ? "default" : "secondary"}>
                  {isTwilioConfigured() ? "Configured" : "Not Configured"}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="twilio-sid">Account SID</Label>
                  <Input
                    id="twilio-sid"
                    type="password"
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    value={twilioAccountSid}
                    onChange={(e) => setTwilioAccountSid(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="twilio-token">Auth Token</Label>
                  <Input
                    id="twilio-token"
                    type="password"
                    placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    value={twilioAuthToken}
                    onChange={(e) => setTwilioAuthToken(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="twilio-phone">Twilio Phone Number</Label>
                <Input
                  id="twilio-phone"
                  placeholder="+1234567890"
                  value={twilioPhoneNumber}
                  onChange={(e) => setTwilioPhoneNumber(e.target.value)}
                />
                <p className="text-xs text-secondary-foreground/70 mt-1">
                  Your verified Twilio phone number (include country code)
                </p>
              </div>
            </div>

            {/* Important Notes */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">How to Get Your Credentials:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>1. Sign up at <a href="https://www.twilio.com" target="_blank" rel="noopener noreferrer" className="underline">twilio.com</a></li>
                <li>2. Go to Console → Account → API keys & tokens</li>
                <li>3. Copy your Account SID and Auth Token</li>
                <li>4. Get a verified Twilio phone number from Phone Numbers section</li>
                <li>5. Paste all credentials here and save</li>
              </ul>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">Important Notes:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Credentials are stored securely in environment variables</li>
                <li>• For production, use environment variables instead of storing here</li>
                <li>• Twilio charges for SMS delivery (typically $0.0075 per SMS)</li>
                <li>• Service SID: VAd3e1619e0cc8a1296109fb6927e00af2</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowProviderConfig(false)}
              className="border-secondary-foreground/20 text-secondary-foreground hover:bg-secondary-foreground/10"
            >
              Cancel
            </Button>
            
            <Button
              onClick={configureProviders}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
