import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { BaseCrudService, useMember } from '@/integrations';
import { Bookings, RefundRequests } from '@/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Clock, User, Phone, Mail, Navigation, CheckCircle, AlertCircle, Calendar, X, Star, History, Zap } from 'lucide-react';
import { format, differenceInHours } from 'date-fns';
import { realtimeService } from '@/services/realtimeService';
import { useToast } from '@/hooks/use-toast';

export default function TrackingPage() {
  const { member } = useMember();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Bookings[]>([]);
  const [activeBookings, setActiveBookings] = useState<Bookings[]>([]);
  const [pastBookings, setPastBookings] = useState<Bookings[]>([]);
  const [refunds, setRefunds] = useState<RefundRequests[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);
  const [completingBookingId, setCompletingBookingId] = useState<string | null>(null);
  const [realtimeUpdates, setRealtimeUpdates] = useState<Map<string, Bookings>>(new Map());
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [selectedBookingToCancel, setSelectedBookingToCancel] = useState<Bookings | null>(null);

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

  // Handle cancel booking button click - Show confirmation dialog
  const handleCancelBookingClick = (booking: Bookings) => {
    setSelectedBookingToCancel(booking);
    setShowCancelConfirm(true);
  };

  // Confirm and process cancellation
  const handleCancelBookingConfirm = async () => {
    if (!selectedBookingToCancel) return;
    
    setCancellingBookingId(selectedBookingToCancel._id);
    try {
      await BaseCrudService.update('bookings', {
        _id: selectedBookingToCancel._id,
        bookingStatus: 'cancelled'
      });
      
      // Update local state for active bookings
      setActiveBookings(prev => 
        prev.filter(b => b._id !== selectedBookingToCancel._id)
      );
      
      // Update local state for past bookings (add cancelled booking to past)
      setPastBookings(prev => [
        ...prev,
        { ...selectedBookingToCancel, bookingStatus: 'cancelled' }
      ]);
      
      // Also update the main bookings array
      setBookings(prev => 
        prev.map(b => 
          b._id === selectedBookingToCancel._id 
            ? { ...b, bookingStatus: 'cancelled' }
            : b
        )
      );
      
      toast({
        title: 'Success',
        description: 'Booking cancelled successfully.',
      });

      // Close confirmation dialog
      setShowCancelConfirm(false);
      
      // Redirect to refund page with booking reference ID
      const refundUrl = `/refund?bookingRef=${selectedBookingToCancel.referenceId || selectedBookingToCancel._id}`;
      navigate(refundUrl);
      
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel booking. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setCancellingBookingId(null);
    }
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
      
      toast({
        title: 'Success',
        description: 'Booking marked as completed. You can now write a review!',
      });
      
    } catch (error) {
      console.error('Error marking booking as completed:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark booking as completed. Please try again.',
        variant: 'destructive',
      });
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

        // Fetch refunds for the current user
        const { items: refundItems } = await BaseCrudService.getAll<RefundRequests>('refunds');
        const userRefunds = refundItems?.filter(r => r.clientEmail === member.loginEmail) || [];
        setRefunds(userRefunds);

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
              
              {/* Booking Reference ID */}
              {booking.referenceId && (
                <div className="mt-4 pt-4 border-t border-secondary-foreground/10">
                  <div className="flex items-center justify-between">
                    <span className="text-secondary-foreground/70 text-xs font-medium">Reference ID:</span>
                    <span className="font-mono font-semibold text-logoGold">{booking.referenceId}</span>
                  </div>
                </div>
              )}
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
              <TabsList className="grid w-full grid-cols-3 max-w-2xl mx-auto mb-8">
                <TabsTrigger value="active" className="flex items-center gap-2">
                  <Navigation className="h-4 w-4" />
                  Active Bookings ({activeBookings.length})
                </TabsTrigger>
                <TabsTrigger value="history" className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  History ({pastBookings.length})
                </TabsTrigger>
                <TabsTrigger value="refunds" className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Refunds ({refunds.length})
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

              {/* Refunds Tab */}
              <TabsContent value="refunds" className="space-y-6">
                {refunds.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center py-12"
                  >
                    <div className="w-24 h-24 mx-auto mb-6 bg-secondary/10 rounded-full flex items-center justify-center">
                      <AlertCircle className="h-12 w-12 text-primary-foreground/50" />
                    </div>
                    <h3 className="font-heading text-2xl font-semibold mb-4">
                      No Refund Requests
                    </h3>
                    <p className="font-paragraph text-primary-foreground/70 mb-6">
                      You don't have any refund requests yet.
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
                      Your Refund Requests ({refunds.length})
                    </motion.h2>

                    <div className="grid gap-6">
                      {refunds.map((refund, index) => (
                        <motion.div
                          key={refund._id}
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: index * 0.1 }}
                        >
                          <Card className="bg-secondary text-secondary-foreground">
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between mb-4">
                                <div>
                                  <h3 className="font-heading text-lg font-semibold mb-2">
                                    Booking Reference: {refund.bookingReference}
                                  </h3>
                                  <p className="text-secondary-foreground/70 text-sm">
                                    Refund Amount: <span className="font-semibold text-brightpink">₹{refund.refundAmount?.toFixed(2)}</span>
                                  </p>
                                </div>
                                <Badge className={`${
                                  refund.status === 'Approved' ? 'bg-green-500' :
                                  refund.status === 'Rejected' ? 'bg-red-500' :
                                  'bg-yellow-500'
                                } text-white`}>
                                  {refund.status || 'Pending'}
                                </Badge>
                              </div>

                              <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-secondary-foreground/10">
                                <div>
                                  <p className="text-xs text-secondary-foreground/70 mb-1">Request Date</p>
                                  <p className="font-paragraph text-sm">
                                    {refund.requestDate ? format(new Date(refund.requestDate), 'MMM dd, yyyy') : '-'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-secondary-foreground/70 mb-1">Reason</p>
                                  <p className="font-paragraph text-sm truncate">{refund.refundReason || '-'}</p>
                                </div>
                              </div>

                              {refund.status === 'Approved' && (
                                <div className="mt-4 p-3 bg-green-500/20 rounded-lg border border-green-500/50">
                                  <p className="text-sm text-green-600 font-paragraph">
                                    ✓ Your refund has been approved and will be processed soon.
                                  </p>
                                </div>
                              )}

                              {refund.status === 'Rejected' && (
                                <div className="mt-4 p-3 bg-red-500/20 rounded-lg border border-red-500/50">
                                  <p className="text-sm text-red-600 font-paragraph">
                                    Your refund request has been rejected. Please contact support for more information.
                                  </p>
                                </div>
                              )}

                              {refund.status === 'Pending' && (
                                <div className="mt-4 p-3 bg-yellow-500/20 rounded-lg border border-yellow-500/50">
                                  <p className="text-sm text-yellow-600 font-paragraph">
                                    Your refund request is being reviewed. We will update you soon.
                                  </p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
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

      {/* Cancellation Confirmation Dialog */}
      <Dialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <DialogContent className="bg-secondary text-secondary-foreground max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Cancel Booking?
            </DialogTitle>
            <DialogDescription className="text-secondary-foreground/70">
              Are you sure you want to cancel this booking? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {selectedBookingToCancel && (
            <div className="space-y-4">
              {/* Booking Details */}
              <div className="bg-white/5 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-xs text-secondary-foreground/70 mb-1">Service</p>
                  <p className="font-semibold">{selectedBookingToCancel.serviceName}</p>
                </div>
                <div>
                  <p className="text-xs text-secondary-foreground/70 mb-1">Freelancer</p>
                  <p className="font-semibold">{selectedBookingToCancel.freelancerName}</p>
                </div>
                <div>
                  <p className="text-xs text-secondary-foreground/70 mb-1">Scheduled Date & Time</p>
                  <p className="font-semibold">
                    {formatDate(selectedBookingToCancel.bookingDate)} at {selectedBookingToCancel.bookingTime}
                  </p>
                </div>
                <div className="pt-3 border-t border-secondary-foreground/10">
                  <p className="text-xs text-secondary-foreground/70 mb-1">Refund Amount</p>
                  <p className="font-semibold text-logoGold text-lg">₹{selectedBookingToCancel.paymentAmount}</p>
                </div>
              </div>

              {/* Reference ID Info */}
              {selectedBookingToCancel.referenceId && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-xs text-blue-700 mb-1">Booking Reference ID</p>
                  <p className="font-mono font-semibold text-blue-900">{selectedBookingToCancel.referenceId}</p>
                  <p className="text-xs text-blue-600 mt-2">You'll need this ID to process your refund</p>
                </div>
              )}

              {/* Warning */}
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="text-xs text-red-700">
                  <strong>Note:</strong> After cancellation, you'll be redirected to the refund page to process your refund.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCancelConfirm(false)}
              className="border-secondary-foreground/20 text-secondary-foreground hover:bg-secondary-foreground/10"
            >
              Keep Booking
            </Button>
            
            <Button
              variant="destructive"
              onClick={handleCancelBookingConfirm}
              disabled={cancellingBookingId !== null}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {cancellingBookingId ? 'Cancelling...' : 'Yes, Cancel Booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
