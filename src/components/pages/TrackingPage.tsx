import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BaseCrudService } from '@/integrations';
import { Bookings } from '@/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { MapPin, Clock, User, Phone, Mail, Navigation, CheckCircle, AlertCircle, Calendar, X, Shield, MessageSquare, Settings, Star } from 'lucide-react';
import { format, differenceInHours } from 'date-fns';
import { notificationService, OTPDeliveryOptions } from '@/services/notificationService';

export default function TrackingPage() {
  const [bookings, setBookings] = useState<Bookings[]>([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [filteredBookings, setFilteredBookings] = useState<Bookings[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);
  
  // OTP states
  const [showOTPDialog, setShowOTPDialog] = useState(false);
  const [selectedBookingForCancel, setSelectedBookingForCancel] = useState<Bookings | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [generatedOTP, setGeneratedOTP] = useState('');
  const [isOTPSending, setIsOTPSending] = useState(false);
  const [isOTPSent, setIsOTPSent] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpResendTimer, setOtpResendTimer] = useState(0);
  const [deliveryMethod, setDeliveryMethod] = useState<'email' | 'sms'>('email');
  const [showProviderConfig, setShowProviderConfig] = useState(false);
  
  // Provider configuration states
  const [sendGridApiKey, setSendGridApiKey] = useState('');
  const [twilioAccountSid, setTwilioAccountSid] = useState('');
  const [twilioAuthToken, setTwilioAuthToken] = useState('');
  const [twilioPhoneNumber, setTwilioPhoneNumber] = useState('');
  
  // Get available delivery methods
  const availableMethods = notificationService.getAvailableMethods();
  const providerStatus = notificationService.getProviderStatus();

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

  // Configure providers with user-provided credentials
  const configureProviders = () => {
    if (sendGridApiKey.trim()) {
      notificationService.setSendGridApiKey(sendGridApiKey.trim());
    }
    
    if (twilioAccountSid.trim() && twilioAuthToken.trim() && twilioPhoneNumber.trim()) {
      notificationService.setTwilioCredentials(
        twilioAccountSid.trim(),
        twilioAuthToken.trim(),
        twilioPhoneNumber.trim()
      );
    }
    
    setShowProviderConfig(false);
  };

  // Send OTP via configured provider
  const sendOTP = async (booking: Bookings): Promise<boolean> => {
    setIsOTPSending(true);
    setOtpError('');
    
    try {
      // Generate new OTP
      const newOTP = generateOTP();
      setGeneratedOTP(newOTP);
      
      // Determine recipient based on delivery method
      const recipient = deliveryMethod === 'email' ? booking.clientEmail : booking.clientPhone;
      
      if (!recipient) {
        setOtpError(`${deliveryMethod === 'email' ? 'Email' : 'Phone number'} not available for this booking.`);
        return false;
      }
      
      // Prepare OTP delivery options
      const otpOptions: OTPDeliveryOptions = {
        method: deliveryMethod,
        recipient,
        code: newOTP,
        bookingDetails: {
          serviceName: booking.serviceName || 'Service',
          freelancerName: booking.freelancerName || 'Freelancer',
          bookingDate: format(new Date(booking.bookingDate || new Date()), 'PPP'),
          bookingTime: booking.bookingTime || 'Time not specified'
        }
      };
      
      // Send OTP using the notification service
      const result = await notificationService.sendOTP(otpOptions);
      
      if (result.success) {
        setIsOTPSent(true);
        setOtpResendTimer(60); // 60 seconds cooldown
        console.log(`OTP sent via ${result.provider} to ${recipient}: ${newOTP} (Message ID: ${result.messageId})`);
        return true;
      } else {
        setOtpError(`Failed to send OTP via ${result.provider}: ${result.error}`);
        return false;
      }
      
    } catch (error) {
      setOtpError('Failed to send OTP. Please try again.');
      console.error('OTP sending error:', error);
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
    
    // Verify OTP
    if (otpCode.trim() !== generatedOTP) {
      setOtpError('Invalid OTP. Please check and try again.');
      return;
    }
    
    // Proceed with cancellation
    setCancellingBookingId(selectedBookingForCancel._id);
    try {
      await BaseCrudService.update('bookings', {
        _id: selectedBookingForCancel._id,
        bookingStatus: 'cancelled'
      });
      
      // Update local state
      setFilteredBookings(prev => 
        prev.map(booking => 
          booking._id === selectedBookingForCancel._id 
            ? { ...booking, bookingStatus: 'cancelled' }
            : booking
        )
      );
      
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
      
    } catch (error) {
      console.error('Error cancelling booking:', error);
      setOtpError('Failed to cancel booking. Please try again.');
    } finally {
      setCancellingBookingId(null);
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
    setDeliveryMethod('email');
  };

  // Handle cancel booking button click
  const handleCancelBookingClick = async (booking: Bookings) => {
    setSelectedBookingForCancel(booking);
    setShowOTPDialog(true);
    
    // Set default delivery method based on available options
    const methods = notificationService.getAvailableMethods();
    if (methods.length > 0) {
      setDeliveryMethod(methods[0]);
    } else {
      // If no providers configured, show configuration dialog
      setShowProviderConfig(true);
      return;
    }
    
    // Automatically send OTP when dialog opens
    await sendOTP(booking);
  };

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const { items } = await BaseCrudService.getAll<Bookings>('bookings');
        setBookings(items);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      }
    };

    fetchBookings();
  }, []);

  const handleSearch = () => {
    if (!searchEmail && !searchPhone) return;
    
    setIsLoading(true);
    setHasSearched(true);
    
    setTimeout(() => {
      const filtered = bookings.filter(booking => 
        (searchEmail && booking.clientEmail?.toLowerCase().includes(searchEmail.toLowerCase())) ||
        (searchPhone && booking.clientPhone?.includes(searchPhone))
      );
      setFilteredBookings(filtered);
      setIsLoading(false);
    }, 1000); // Simulate API delay
  };

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

  const getETAStatus = (etaStatus: string) => {
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
        return { icon: AlertCircle, text: 'Unknown', color: 'text-gray-400' };
    }
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'Not specified';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'PPP');
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
              Track Your Booking
            </h1>
            <p className="font-paragraph text-xl text-secondary-foreground/70 max-w-2xl mx-auto">
              Enter your contact details to track your service booking and get real-time updates
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
              Configure Notification Providers
            </Button>
            
            {/* Provider Status Indicators */}
            <div className="flex justify-center gap-4 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${providerStatus.sendGrid.configured ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span>SendGrid {providerStatus.sendGrid.configured ? 'Ready' : 'Not Configured'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${providerStatus.twilio.configured ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span>Twilio {providerStatus.twilio.configured ? 'Ready' : 'Not Configured'}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Search Form */}
      <section className="py-12">
        <div className="container mx-auto px-6 lg:px-12 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="bg-secondary text-secondary-foreground">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Find Your Booking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                  />
                </div>
                
                <div className="text-center text-sm text-secondary-foreground/70">
                  OR
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="Enter your phone number"
                    value={searchPhone}
                    onChange={(e) => setSearchPhone(e.target.value)}
                  />
                </div>
                
                <Button 
                  onClick={handleSearch}
                  disabled={(!searchEmail && !searchPhone) || isLoading}
                  className="w-full bg-logoGold text-logoBlack hover:bg-logoGold/90"
                >
                  {isLoading ? 'Searching...' : 'Track Booking'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Search Results */}
      {hasSearched && (
        <section className="pb-16">
          <div className="container mx-auto px-6 lg:px-12 max-w-[100rem]">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 border-4 border-logoGold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="font-paragraph text-lg">Searching for your bookings...</p>
              </div>
            ) : filteredBookings.length === 0 ? (
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
                  No bookings found
                </h3>
                <p className="font-paragraph text-primary-foreground/70 mb-6">
                  We couldn't find any bookings with the provided contact information.
                </p>
                <Button 
                  onClick={() => {
                    setSearchEmail('');
                    setSearchPhone('');
                    setHasSearched(false);
                    setFilteredBookings([]);
                  }}
                  className="bg-logoGold text-logoBlack hover:bg-logoGold/90"
                >
                  Try Again
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
                  Your Bookings ({filteredBookings.length})
                </motion.h2>

                <div className="grid gap-6">
                  {filteredBookings.map((booking, index) => {
                    const etaInfo = getETAStatus(booking.etaStatus || 'scheduled');
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
                                      ₹{booking.paymentAmount ? (booking.paymentAmount * 83).toFixed(2) : '0.00'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-secondary-foreground/70">Payment:</span>
                                    <Badge variant={booking.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                                      {booking.paymentStatus}
                                    </Badge>
                                  </div>
                                </div>

                                {/* Cancel Booking Button */}
                                {canCancelBooking(booking) && (
                                  <div className="mt-4">
                                    <Button 
                                      variant="destructive" 
                                      size="sm"
                                      className="bg-red-600 hover:bg-red-700 text-white"
                                      onClick={() => handleCancelBookingClick(booking)}
                                      disabled={cancellingBookingId === booking._id}
                                    >
                                      <X className="h-4 w-4 mr-2" />
                                      {cancellingBookingId === booking._id ? 'Cancelling...' : 'Cancel Booking'}
                                    </Button>
                                  </div>
                                )}

                                {/* Write Review Button - Only show for completed bookings */}
                                {booking.bookingStatus === 'completed' && (
                                  <div className="mt-4">
                                    <Button 
                                      asChild
                                      size="sm"
                                      className="bg-logoGold text-logoBlack hover:bg-logoGold/90"
                                    >
                                      <Link to={`/review?booking=${booking._id}`}>
                                        <Star className="h-4 w-4 mr-2" />
                                        Write Review
                                      </Link>
                                    </Button>
                                  </div>
                                )}

                                {/* Cancellation Policy Info */}
                                {booking.bookingStatus !== 'cancelled' && (
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

                              {/* ETA Status */}
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
                                    
                                    {booking.etaStatus === 'on-the-way' && (
                                      <div className="mt-3">
                                        <p className="text-xs text-secondary-foreground/70 mb-1">
                                          Estimated arrival
                                        </p>
                                        <p className="font-semibold text-logoGold">
                                          15-20 minutes
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
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
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* How Tracking Works */}
      {!hasSearched && (
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
      )}

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

            {/* Delivery Method Selection */}
            {availableMethods.length > 1 && (
              <div className="space-y-3">
                <Label>Choose delivery method:</Label>
                <RadioGroup
                  value={deliveryMethod}
                  onValueChange={(value: 'email' | 'sms') => setDeliveryMethod(value)}
                  className="flex gap-6"
                >
                  {availableMethods.includes('email') && (
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="email" id="email-method" />
                      <Label htmlFor="email-method" className="flex items-center gap-2 cursor-pointer">
                        <Mail className="h-4 w-4" />
                        Email ({selectedBookingForCancel?.clientEmail})
                      </Label>
                    </div>
                  )}
                  {availableMethods.includes('sms') && (
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="sms" id="sms-method" />
                      <Label htmlFor="sms-method" className="flex items-center gap-2 cursor-pointer">
                        <MessageSquare className="h-4 w-4" />
                        SMS ({selectedBookingForCancel?.clientPhone})
                      </Label>
                    </div>
                  )}
                </RadioGroup>
              </div>
            )}

            {/* OTP Input Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="otp">Enter Verification Code</Label>
                {isOTPSent && (
                  <span className="text-xs text-green-600">
                    ✓ Code sent via {deliveryMethod} to {deliveryMethod === 'email' ? selectedBookingForCancel?.clientEmail : selectedBookingForCancel?.clientPhone}
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
                disabled={isOTPSending || availableMethods.length === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isOTPSending ? 'Sending...' : `Send Code via ${deliveryMethod.toUpperCase()}`}
              </Button>
            ) : (
              <Button
                onClick={verifyOTPAndCancel}
                disabled={otpCode.length !== 6 || cancellingBookingId === selectedBookingForCancel?._id}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {cancellingBookingId === selectedBookingForCancel?._id ? 'Cancelling...' : 'Verify & Cancel Booking'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Provider Configuration Dialog */}
      <Dialog open={showProviderConfig} onOpenChange={setShowProviderConfig}>
        <DialogContent className="bg-secondary text-secondary-foreground max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configure Notification Providers
            </DialogTitle>
            <DialogDescription className="text-secondary-foreground/70">
              Set up SendGrid and Twilio credentials to enable real OTP delivery for booking cancellations.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* SendGrid Configuration */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">SendGrid (Email Delivery)</h3>
                <Badge variant={providerStatus.sendGrid.configured ? "default" : "secondary"}>
                  {providerStatus.sendGrid.configured ? "Configured" : "Not Configured"}
                </Badge>
              </div>
              
              <div>
                <Label htmlFor="sendgrid-key">SendGrid API Key</Label>
                <Input
                  id="sendgrid-key"
                  type="password"
                  placeholder="SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={sendGridApiKey}
                  onChange={(e) => setSendGridApiKey(e.target.value)}
                />
                <p className="text-xs text-secondary-foreground/70 mt-1">
                  Get your API key from SendGrid dashboard → Settings → API Keys
                </p>
              </div>
            </div>

            {/* Twilio Configuration */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold">Twilio (SMS Delivery)</h3>
                <Badge variant={providerStatus.twilio.configured ? "default" : "secondary"}>
                  {providerStatus.twilio.configured ? "Configured" : "Not Configured"}
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
              <h4 className="font-medium text-blue-800 mb-2">Important Notes:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Credentials are stored locally in your browser session</li>
                <li>• For production use, store credentials securely on your server</li>
                <li>• SendGrid requires a verified sender email address</li>
                <li>• Twilio requires a verified phone number for SMS delivery</li>
                <li>• Both services may have usage limits and costs</li>
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