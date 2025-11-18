import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BaseCrudService } from '@/integrations';
import { Bookings } from '@/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, User, Phone, Mail, Navigation, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function TrackingPage() {
  const [bookings, setBookings] = useState<Bookings[]>([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [filteredBookings, setFilteredBookings] = useState<Bookings[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

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
                                      ${booking.paymentAmount}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-secondary-foreground/70">Payment:</span>
                                    <Badge variant={booking.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                                      {booking.paymentStatus}
                                    </Badge>
                                  </div>
                                </div>
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
    </div>
  );
}