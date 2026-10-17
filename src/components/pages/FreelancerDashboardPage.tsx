import React, { useState, useEffect } from 'react';
import { useMember } from '@/integrations';
import { BaseCrudService } from '@/integrations';
import { Freelancers, Bookings, ClientReviews } from '@/entities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, User, Briefcase, TrendingUp, Star, MapPin, Phone, Mail, Navigation, MessageSquare, Download, Lock, CheckCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import PINVerificationModal from '@/components/PINVerificationModal';

const LIVE_STATUS_OPTIONS = ['On The Way', '10mins', '5mins', '2mins', 'Arrived'];

const getStatusColor = (status: string | undefined) => {
  switch (status) {
    case 'On The Way':
      return 'bg-blue-100 text-blue-800';
    case '10mins':
      return 'bg-yellow-100 text-yellow-800';
    case '5mins':
      return 'bg-orange-100 text-orange-800';
    case '2mins':
      return 'bg-red-100 text-red-800';
    case 'Arrived':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function FreelancerDashboardPage() {
  const { member } = useMember();
  const { toast } = useToast();
  const [freelancerProfile, setFreelancerProfile] = useState<Freelancers | null>(null);
  const [bookings, setBookings] = useState<Bookings[]>([]);
  const [reviews, setReviews] = useState<ClientReviews[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(null);
  const [pinVerificationOpen, setPinVerificationOpen] = useState(false);
  const [selectedBookingForPIN, setSelectedBookingForPIN] = useState<Bookings | null>(null);

  // Form states
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    bio: '',
    skills: '',
    servicesOffered: '',
    hourlyRate: 0,
    contactEmail: '',
    city: '',
    serviceArea: '',
    fullAddress: ''
  });

  const [availabilityForm, setAvailabilityForm] = useState({
    availableDays: '',
    workingHoursStart: '',
    workingHoursEnd: '',
    blockedDates: '',
    availabilityDescription: ''
  });

  useEffect(() => {
    loadFreelancerData();
  }, [member]);

  const loadFreelancerData = async () => {
    if (!member?.loginEmail) return;

    try {
      setLoading(true);
      
      // Find freelancer by email
      const { items: freelancers } = await BaseCrudService.getAll<Freelancers>('freelancers');
      const freelancer = freelancers.find(f => f.contactEmail === member.loginEmail);
      
      if (freelancer) {
        setFreelancerProfile(freelancer);
        
        // Load form data
        setProfileForm({
          fullName: freelancer.fullName || '',
          bio: freelancer.bio || '',
          skills: freelancer.skills || '',
          servicesOffered: freelancer.servicesOffered || '',
          hourlyRate: freelancer.hourlyRate || 0,
          contactEmail: freelancer.contactEmail || '',
          city: freelancer.city || '',
          serviceArea: freelancer.serviceArea || '',
          fullAddress: freelancer.fullAddress || ''
        });

        setAvailabilityForm({
          availableDays: freelancer.availableDays || '',
          workingHoursStart: freelancer.workingHoursStart || '',
          workingHoursEnd: freelancer.workingHoursEnd || '',
          blockedDates: freelancer.blockedDates || '',
          availabilityDescription: freelancer.availabilityDescription || ''
        });

        // Load bookings for this freelancer
        const { items: allBookings } = await BaseCrudService.getAll<Bookings>('bookings');
        const freelancerBookings = allBookings.filter(b => b.freelancerName === freelancer.fullName);
        setBookings(freelancerBookings);

        // Load reviews for this freelancer
        const { items: allReviews } = await BaseCrudService.getAll<ClientReviews>('clientreviews');
        const freelancerReviews = allReviews.filter(review => 
          review.freelancerId === freelancer._id
        ).sort((a, b) => {
          const dateA = new Date(a.reviewDate || a._createdDate || 0);
          const dateB = new Date(b.reviewDate || b._createdDate || 0);
          return dateB.getTime() - dateA.getTime();
        });
        setReviews(freelancerReviews);
      }
    } catch (error) {
      console.error('Error loading freelancer data:', error);
      toast({
        title: "Error",
        description: "Failed to load your profile data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    if (!freelancerProfile) return;

    try {
      setSaving(true);
      
      const updatedProfile = {
        ...freelancerProfile,
        ...profileForm
      };

      await BaseCrudService.update('freelancers', updatedProfile);
      setFreelancerProfile(updatedProfile);
      
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvailabilityUpdate = async () => {
    if (!freelancerProfile) return;

    try {
      setSaving(true);
      
      const updatedProfile = {
        ...freelancerProfile,
        ...availabilityForm
      };

      await BaseCrudService.update('freelancers', updatedProfile);
      setFreelancerProfile(updatedProfile);
      
      toast({
        title: "Success",
        description: "Availability updated successfully!",
      });
    } catch (error) {
      console.error('Error updating availability:', error);
      toast({
        title: "Error",
        description: "Failed to update availability.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleBookingLiveStatusUpdate = async (bookingId: string, status: string) => {
    try {
      setUpdatingBookingId(bookingId);
      
      const bookingToUpdate = bookings.find(b => b._id === bookingId);
      if (!bookingToUpdate) return;

      const updatedBooking = {
        ...bookingToUpdate,
        liveStatus: status
      };

      await BaseCrudService.update('bookings', updatedBooking);
      
      // Update local state
      setBookings(bookings.map(b => b._id === bookingId ? updatedBooking : b));
      
      toast({
        title: "Success",
        description: `Booking status updated to "${status}"`,
      });
    } catch (error) {
      console.error('Error updating booking live status:', error);
      toast({
        title: "Error",
        description: "Failed to update booking status.",
        variant: "destructive",
      });
    } finally {
      setUpdatingBookingId(null);
    }
  };

  const handleAddToCalendar = (booking: Bookings) => {
    if (!booking.bookingDate) {
      toast({
        title: "Error",
        description: "Booking date is not available.",
        variant: "destructive",
      });
      return;
    }

    // Parse booking date and time
    const bookingDate = new Date(booking.bookingDate);
    const [hours, minutes] = (booking.bookingTime || '09:00').split(':');
    bookingDate.setHours(parseInt(hours), parseInt(minutes));

    // Create calendar event details
    const eventTitle = `${booking.serviceName} - ${booking.clientName}`;
    const eventDescription = `Client: ${booking.clientName}\nService: ${booking.serviceName}\nLocation: ${booking.serviceAddress || booking.serviceCity}\nPayment: ₹${booking.paymentAmount}`;
    const eventLocation = booking.serviceAddress || `${booking.serviceCity}, ${booking.serviceState}`;
    
    // Format dates for calendar
    const startDate = bookingDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endDate = new Date(bookingDate.getTime() + 60 * 60 * 1000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    // Create Google Calendar link
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=${startDate}/${endDate}&details=${encodeURIComponent(eventDescription)}&location=${encodeURIComponent(eventLocation)}`;

    // Create iCal format for other calendar apps
    const icalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Freelancer Booking//EN
BEGIN:VEVENT
UID:${booking._id}@freelancer-booking
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${startDate}
DTEND:${endDate}
SUMMARY:${eventTitle}
DESCRIPTION:${eventDescription}
LOCATION:${eventLocation}
END:VEVENT
END:VCALENDAR`;

    // Show options to user
    const userChoice = window.confirm(
      'Choose your calendar app:\n\nOK = Google Calendar\nCancel = Download .ics file'
    );

    if (userChoice) {
      // Open Google Calendar
      window.open(googleCalendarUrl, '_blank');
      toast({
        title: "Success",
        description: "Opening Google Calendar...",
      });
    } else {
      // Download iCal file
      const element = document.createElement('a');
      element.setAttribute('href', 'data:text/calendar;charset=utf-8,' + encodeURIComponent(icalContent));
      element.setAttribute('download', `${booking.serviceName}-${booking.clientName}.ics`);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      
      toast({
        title: "Success",
        description: "Calendar file downloaded. Import it to your calendar app.",
      });
    }
  };

  const getBookingStats = () => {
    const totalBookings = bookings.length;
    const completedBookings = bookings.filter(b => b.bookingStatus === 'completed').length;
    const pendingBookings = bookings.filter(b => b.bookingStatus === 'pending').length;
    const totalEarnings = bookings
      .filter(b => b.bookingStatus === 'completed')
      .reduce((sum, b) => sum + (b.paymentAmount || 0), 0);
    
    // Calculate average rating from reviews
    const averageRating = reviews.length > 0 
      ? (reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length).toFixed(1)
      : '0.0';
    
    return { totalBookings, completedBookings, pendingBookings, totalEarnings, averageRating };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!freelancerProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md bg-white border-0 shadow-lg">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-heading font-bold text-gray-900">Profile Not Found</CardTitle>
            <CardDescription className="text-base text-gray-600 mt-3 leading-relaxed">
              No freelancer profile found for your account. Please contact support to set up your profile.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const stats = getBookingStats();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[120rem] mx-auto p-6">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20 border-2 border-logoGold/20">
                <AvatarImage src={freelancerProfile.profilePicture} />
                <AvatarFallback className="bg-logoGold text-logoBlack text-xl font-bold">
                  {freelancerProfile.fullName?.split(' ').map(n => n[0]).join('') || 'FL'}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <h1 className="text-4xl font-heading font-bold text-white leading-tight">
                  Welcome back, {freelancerProfile.fullName}
                </h1>
                <p className="text-xl font-paragraph text-white/80 leading-relaxed">
                  Manage your profile and track your progress
                </p>
              </div>
            </div>
            
            {/* Live Status Section */}
            <div className="bg-white rounded-lg shadow-lg p-6 min-w-fit">
              <div className="flex items-center gap-3 mb-4">
                <Navigation className="h-6 w-6 text-logoGold" />
                <h3 className="text-lg font-heading font-bold text-gray-900">Live Status</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">Update status for active bookings below</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-logoGold/10 rounded-lg">
                    <Briefcase className="h-8 w-8 text-logoGold" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Total Bookings</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalBookings}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Completed</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.completedBookings}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Clock className="h-8 w-8 text-orange-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Pending</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.pendingBookings}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Star className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Average Rating</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.averageRating} ⭐</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 h-14 bg-white border border-gray-200 rounded-lg p-1">
            <TabsTrigger 
              value="overview" 
              className="text-base font-medium data-[state=active]:bg-logoGold data-[state=active]:text-logoBlack data-[state=active]:shadow-sm"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="profile" 
              className="text-base font-medium data-[state=active]:bg-logoGold data-[state=active]:text-logoBlack data-[state=active]:shadow-sm"
            >
              Profile
            </TabsTrigger>
            <TabsTrigger 
              value="availability" 
              className="text-base font-medium data-[state=active]:bg-logoGold data-[state=active]:text-logoBlack data-[state=active]:shadow-sm"
            >
              Availability
            </TabsTrigger>
            <TabsTrigger 
              value="bookings" 
              className="text-base font-medium data-[state=active]:bg-logoGold data-[state=active]:text-logoBlack data-[state=active]:shadow-sm"
            >
              Bookings
            </TabsTrigger>
            <TabsTrigger 
              value="reviews" 
              className="text-base font-medium data-[state=active]:bg-logoGold data-[state=active]:text-logoBlack data-[state=active]:shadow-sm"
            >
              Reviews ({reviews.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8 mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Profile Summary */}
              <Card className="bg-white border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl font-heading font-bold text-gray-900">
                    <div className="p-2 bg-logoGold/10 rounded-lg">
                      <User className="h-6 w-6 text-logoGold" />
                    </div>
                    Profile Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-gray-500" />
                    <span className="text-base font-medium text-gray-700">
                      {freelancerProfile.city}, {freelancerProfile.serviceArea}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-500" />
                    <span className="text-base font-medium text-gray-700">{freelancerProfile.contactEmail}</span>
                  </div>
                  <div className="space-y-3">
                    <p className="text-base font-semibold text-gray-900">Skills:</p>
                    <div className="flex flex-wrap gap-2">
                      {freelancerProfile.skills?.split(',').map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-sm px-3 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200">
                          {skill.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-base font-semibold text-gray-900">Hourly Rate:</p>
                    <p className="text-2xl font-bold text-logoGold">₹{freelancerProfile.hourlyRate}/hour</p>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Bookings */}
              <Card className="bg-white border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl font-heading font-bold text-gray-900">
                    <div className="p-2 bg-logoGold/10 rounded-lg">
                      <Calendar className="h-6 w-6 text-logoGold" />
                    </div>
                    Recent Bookings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {bookings.slice(0, 5).map((booking) => (
                      <div key={booking._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="space-y-1">
                          <p className="font-semibold text-base text-gray-900">{booking.serviceName}</p>
                          <p className="text-sm text-gray-600">{booking.clientName}</p>
                        </div>
                        <div className="text-right space-y-2">
                          <Badge 
                            variant={booking.bookingStatus === 'completed' ? 'default' : 'secondary'}
                            className="text-sm px-3 py-1"
                          >
                            {booking.bookingStatus}
                          </Badge>
                          <p className="text-base font-bold text-gray-900">
                            ₹{booking.paymentAmount}
                          </p>
                        </div>
                      </div>
                    ))}
                    {bookings.length === 0 && (
                      <div className="text-center py-8">
                        <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-base text-gray-600 font-medium">No recent bookings</p>
                        <p className="text-sm text-gray-500 mt-1">Your recent bookings will appear here</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="profile" className="space-y-8 mt-8">
            <Card className="bg-white border-0 shadow-lg">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl font-heading font-bold text-gray-900">Update Profile Information</CardTitle>
                <CardDescription className="text-base text-gray-600 mt-2">
                  Keep your profile up to date to attract more clients
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-base font-semibold text-gray-900">Full Name</Label>
                    <Input
                      id="fullName"
                      value={profileForm.fullName}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, fullName: e.target.value }))}
                      className="h-12 text-base border-gray-300 focus:border-logoGold focus:ring-logoGold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail" className="text-base font-semibold text-gray-900">Contact Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={profileForm.contactEmail}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, contactEmail: e.target.value }))}
                      className="h-12 text-base border-gray-300 focus:border-logoGold focus:ring-logoGold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-base font-semibold text-gray-900">City</Label>
                    <Input
                      id="city"
                      value={profileForm.city}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, city: e.target.value }))}
                      className="h-12 text-base border-gray-300 focus:border-logoGold focus:ring-logoGold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serviceArea" className="text-base font-semibold text-gray-900">Service Area</Label>
                    <Input
                      id="serviceArea"
                      value={profileForm.serviceArea}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, serviceArea: e.target.value }))}
                      className="h-12 text-base border-gray-300 focus:border-logoGold focus:ring-logoGold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hourlyRate" className="text-base font-semibold text-gray-900">Hourly Rate (₹)</Label>
                    <Input
                      id="hourlyRate"
                      type="number"
                      value={profileForm.hourlyRate}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, hourlyRate: Number(e.target.value) }))}
                      className="h-12 text-base border-gray-300 focus:border-logoGold focus:ring-logoGold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullAddress" className="text-base font-semibold text-gray-900">Full Address</Label>
                  <Textarea
                    id="fullAddress"
                    value={profileForm.fullAddress}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, fullAddress: e.target.value }))}
                    rows={3}
                    className="text-base border-gray-300 focus:border-logoGold focus:ring-logoGold resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-base font-semibold text-gray-900">Bio</Label>
                  <Textarea
                    id="bio"
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                    rows={4}
                    placeholder="Tell clients about yourself..."
                    className="text-base border-gray-300 focus:border-logoGold focus:ring-logoGold resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="skills" className="text-base font-semibold text-gray-900">Skills (comma-separated)</Label>
                  <Textarea
                    id="skills"
                    value={profileForm.skills}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, skills: e.target.value }))}
                    rows={3}
                    placeholder="e.g., Photography, Video Editing, Graphic Design"
                    className="text-base border-gray-300 focus:border-logoGold focus:ring-logoGold resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="servicesOffered" className="text-base font-semibold text-gray-900">Services Offered</Label>
                  <Textarea
                    id="servicesOffered"
                    value={profileForm.servicesOffered}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, servicesOffered: e.target.value }))}
                    rows={4}
                    placeholder="Describe the services you offer..."
                    className="text-base border-gray-300 focus:border-logoGold focus:ring-logoGold resize-none"
                  />
                </div>

                <Button 
                  onClick={handleProfileUpdate} 
                  disabled={saving} 
                  className="w-full h-12 text-base font-semibold bg-logoGold text-logoBlack hover:bg-logoGold/90 disabled:opacity-50"
                >
                  {saving ? <LoadingSpinner /> : 'Update Profile'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="availability" className="space-y-8 mt-8">
            <Card className="bg-white border-0 shadow-lg">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl font-heading font-bold text-gray-900">Manage Availability</CardTitle>
                <CardDescription className="text-base text-gray-600 mt-2">
                  Set your working hours and availability to help clients book you
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="workingHoursStart" className="text-base font-semibold text-gray-900">Working Hours Start</Label>
                    <Input
                      id="workingHoursStart"
                      type="time"
                      value={availabilityForm.workingHoursStart}
                      onChange={(e) => setAvailabilityForm(prev => ({ ...prev, workingHoursStart: e.target.value }))}
                      className="h-12 text-base border-gray-300 focus:border-logoGold focus:ring-logoGold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="workingHoursEnd" className="text-base font-semibold text-gray-900">Working Hours End</Label>
                    <Input
                      id="workingHoursEnd"
                      type="time"
                      value={availabilityForm.workingHoursEnd}
                      onChange={(e) => setAvailabilityForm(prev => ({ ...prev, workingHoursEnd: e.target.value }))}
                      className="h-12 text-base border-gray-300 focus:border-logoGold focus:ring-logoGold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="availableDays" className="text-base font-semibold text-gray-900">Available Days (comma-separated)</Label>
                  <Input
                    id="availableDays"
                    value={availabilityForm.availableDays}
                    onChange={(e) => setAvailabilityForm(prev => ({ ...prev, availableDays: e.target.value }))}
                    placeholder="e.g., Monday, Tuesday, Wednesday, Thursday, Friday"
                    className="h-12 text-base border-gray-300 focus:border-logoGold focus:ring-logoGold"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="blockedDates" className="text-base font-semibold text-gray-900">Blocked/Unavailable Dates</Label>
                  <Textarea
                    id="blockedDates"
                    value={availabilityForm.blockedDates}
                    onChange={(e) => setAvailabilityForm(prev => ({ ...prev, blockedDates: e.target.value }))}
                    rows={3}
                    placeholder="List dates when you're not available (e.g., 2024-12-25, 2024-01-01)"
                    className="text-base border-gray-300 focus:border-logoGold focus:ring-logoGold resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="availabilityDescription" className="text-base font-semibold text-gray-900">Availability Description</Label>
                  <Textarea
                    id="availabilityDescription"
                    value={availabilityForm.availabilityDescription}
                    onChange={(e) => setAvailabilityForm(prev => ({ ...prev, availabilityDescription: e.target.value }))}
                    rows={4}
                    placeholder="Describe your availability in detail..."
                    className="text-base border-gray-300 focus:border-logoGold focus:ring-logoGold resize-none"
                  />
                </div>

                <Button 
                  onClick={handleAvailabilityUpdate} 
                  disabled={saving} 
                  className="w-full h-12 text-base font-semibold bg-logoGold text-logoBlack hover:bg-logoGold/90 disabled:opacity-50"
                >
                  {saving ? <LoadingSpinner /> : 'Update Availability'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-8 mt-8">
            <Card className="bg-white border-0 shadow-lg">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl font-heading font-bold text-gray-900">Your Bookings</CardTitle>
                <CardDescription className="text-base text-gray-600 mt-2">
                  Track all your bookings and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {bookings.map((booking) => (
                    <div key={booking._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="space-y-1">
                          <h3 className="font-bold text-xl text-gray-900">{booking.serviceName}</h3>
                          <p className="text-base text-gray-600">Client: {booking.clientName}</p>
                        </div>
                        <Badge 
                          variant={booking.bookingStatus === 'completed' ? 'default' : 'secondary'}
                          className="text-sm px-3 py-1"
                        >
                          {booking.bookingStatus}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Date</p>
                          <p className="text-base font-medium text-gray-900">
                            {booking.bookingDate ? new Date(booking.bookingDate).toLocaleDateString() : 'TBD'}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Location</p>
                          <p className="text-base font-medium text-gray-900">{booking.serviceCity}, {booking.serviceState}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Payment</p>
                          <p className="text-base font-bold text-gray-900">₹{booking.paymentAmount}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Status</p>
                          <p className="text-base font-medium text-gray-900">{booking.paymentStatus}</p>
                        </div>
                      </div>

                      {booking.serviceAddress && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Address:</p>
                          <p className="text-base text-gray-700">{booking.serviceAddress}</p>
                        </div>
                      )}

                      {/* Live Status Update Section for Booking */}
                      {booking.bookingStatus !== 'completed' && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <Navigation className="h-5 w-5 text-logoGold" />
                              <h4 className="font-semibold text-gray-900">Live Status Update</h4>
                            </div>
                            {booking.liveStatus && (
                              <Badge className={`${getStatusColor(booking.liveStatus)} text-sm px-3 py-1 font-semibold`}>
                                {booking.liveStatus}
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {LIVE_STATUS_OPTIONS.map((status) => (
                              <Button
                                key={status}
                                onClick={() => handleBookingLiveStatusUpdate(booking._id, status)}
                                disabled={updatingBookingId === booking._id || booking.liveStatus === status}
                                variant={booking.liveStatus === status ? 'default' : 'outline'}
                                size="sm"
                                className={`text-xs font-semibold transition-all ${
                                  booking.liveStatus === status
                                    ? 'bg-logoGold text-logoBlack hover:bg-logoGold/90'
                                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                {updatingBookingId === booking._id ? (
                                  <LoadingSpinner />
                                ) : (
                                  status
                                )}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Add to Calendar Button */}
                      <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                        <Button
                          onClick={() => handleAddToCalendar(booking)}
                          className="w-full h-11 text-base font-semibold bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center gap-2"
                        >
                          <Calendar className="h-5 w-5" />
                          Add to Calendar
                        </Button>
                        
                        {/* PIN Verification Button */}
                        {booking.bookingStatus !== 'completed' && booking.pin && (
                          <Button
                            onClick={() => {
                              setSelectedBookingForPIN(booking);
                              setPinVerificationOpen(true);
                            }}
                            className="w-full h-11 text-base font-semibold bg-purple-600 text-white hover:bg-purple-700 flex items-center justify-center gap-2"
                          >
                            <Lock className="h-5 w-5" />
                            Verify Service PIN
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}

                  {bookings.length === 0 && (
                    <div className="text-center py-12">
                      <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-lg font-medium text-gray-600 mb-2">No bookings yet</p>
                      <p className="text-base text-gray-500">Your bookings will appear here once clients start booking your services</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-8 mt-8">
            <Card className="bg-white border-0 shadow-lg">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl font-heading font-bold text-gray-900">Client Reviews</CardTitle>
                <CardDescription className="text-base text-gray-600 mt-2">
                  Reviews from clients who have booked your services
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reviews.length > 0 ? (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-logoGold/10 to-purple-100 rounded-lg p-6 mb-8">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Overall Rating</p>
                          <div className="flex items-center gap-3">
                            <p className="text-4xl font-bold text-gray-900">{stats.averageRating}</p>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-5 w-5 ${
                                    i < Math.round(Number(stats.averageRating)) ? 'text-logoGold fill-current' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-gray-900">{reviews.length}</p>
                          <p className="text-sm text-gray-600">Total Review{reviews.length !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      {reviews.map((review) => (
                        <div key={review._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < (review.rating || 0) ? 'text-logoGold fill-current' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm font-semibold text-gray-500">
                              {review.reviewDate 
                                ? new Date(review.reviewDate).toLocaleDateString()
                                : review._createdDate 
                                  ? new Date(review._createdDate).toLocaleDateString()
                                  : 'Recent'
                              }
                            </span>
                          </div>
                          
                          {review.reviewTitle && (
                            <h4 className="font-heading text-lg font-semibold text-gray-900 mb-2">
                              {review.reviewTitle}
                            </h4>
                          )}
                          
                          <p className="font-paragraph text-gray-700 mb-4 leading-relaxed">
                            "{review.reviewContent}"
                          </p>
                          
                          <div className="pt-4 border-t border-gray-200">
                            <p className="font-semibold text-gray-900">{review.clientName}</p>
                            <p className="text-sm text-gray-600">Verified Booking</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                      <Star className="h-12 w-12 text-gray-300" />
                    </div>
                    <h3 className="font-heading text-xl font-semibold text-gray-900 mb-2">
                      No Reviews Yet
                    </h3>
                    <p className="font-paragraph text-gray-600 max-w-md mx-auto">
                      Once clients complete bookings and leave reviews, they will appear here. Keep providing excellent service to earn positive reviews!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
