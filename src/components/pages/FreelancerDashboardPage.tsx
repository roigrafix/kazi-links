import React, { useState, useEffect } from 'react';
import { useMember } from '@/integrations';
import { BaseCrudService } from '@/integrations';
import { Freelancers, Bookings } from '@/entities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, User, Briefcase, TrendingUp, Star, MapPin, Phone, Mail } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';

export default function FreelancerDashboardPage() {
  const { member } = useMember();
  const { toast } = useToast();
  const [freelancerProfile, setFreelancerProfile] = useState<Freelancers | null>(null);
  const [bookings, setBookings] = useState<Bookings[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

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

  const getBookingStats = () => {
    const totalBookings = bookings.length;
    const completedBookings = bookings.filter(b => b.bookingStatus === 'completed').length;
    const pendingBookings = bookings.filter(b => b.bookingStatus === 'pending').length;
    const totalEarnings = bookings
      .filter(b => b.bookingStatus === 'completed')
      .reduce((sum, b) => sum + (b.paymentAmount || 0), 0);
    
    return { totalBookings, completedBookings, pendingBookings, totalEarnings };
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
          <div className="flex items-center gap-6 mb-8">
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
                    <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Total Earnings</p>
                    <p className="text-3xl font-bold text-gray-900">₹{stats.totalEarnings.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-14 bg-white border border-gray-200 rounded-lg p-1">
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
        </Tabs>
      </div>
    </div>
  );
}