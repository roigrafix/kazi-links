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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Profile Not Found</CardTitle>
            <CardDescription>
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
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={freelancerProfile.profilePicture} />
              <AvatarFallback>
                {freelancerProfile.fullName?.split(' ').map(n => n[0]).join('') || 'FL'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-heading font-bold text-foreground">
                Welcome back, {freelancerProfile.fullName}
              </h1>
              <p className="text-lg text-foreground/70">
                Manage your profile and track your progress
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Briefcase className="h-8 w-8 text-logoGold" />
                  <div>
                    <p className="text-sm text-foreground/70">Total Bookings</p>
                    <p className="text-2xl font-bold text-foreground">{stats.totalBookings}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-8 w-8 text-electricblue" />
                  <div>
                    <p className="text-sm text-foreground/70">Completed</p>
                    <p className="text-2xl font-bold text-foreground">{stats.completedBookings}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-8 w-8 text-neonyellow" />
                  <div>
                    <p className="text-sm text-foreground/70">Pending</p>
                    <p className="text-2xl font-bold text-foreground">{stats.pendingBookings}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Star className="h-8 w-8 text-brightpink" />
                  <div>
                    <p className="text-sm text-foreground/70">Total Earnings</p>
                    <p className="text-2xl font-bold text-foreground">₹{stats.totalEarnings.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Profile Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-foreground/70" />
                    <span className="text-sm">{freelancerProfile.city}, {freelancerProfile.serviceArea}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-foreground/70" />
                    <span className="text-sm">{freelancerProfile.contactEmail}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Skills:</p>
                    <div className="flex flex-wrap gap-1">
                      {freelancerProfile.skills?.split(',').map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {skill.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Hourly Rate:</p>
                    <p className="text-lg font-bold text-logoGold">₹{freelancerProfile.hourlyRate}/hour</p>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Bookings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Recent Bookings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {bookings.slice(0, 5).map((booking) => (
                      <div key={booking._id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{booking.serviceName}</p>
                          <p className="text-xs text-foreground/70">{booking.clientName}</p>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant={booking.bookingStatus === 'completed' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {booking.bookingStatus}
                          </Badge>
                          <p className="text-xs text-foreground/70 mt-1">
                            ₹{booking.paymentAmount}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Update Profile Information</CardTitle>
                <CardDescription>
                  Keep your profile up to date to attract more clients
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={profileForm.fullName}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, fullName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={profileForm.contactEmail}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, contactEmail: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={profileForm.city}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, city: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="serviceArea">Service Area</Label>
                    <Input
                      id="serviceArea"
                      value={profileForm.serviceArea}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, serviceArea: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="hourlyRate">Hourly Rate (₹)</Label>
                    <Input
                      id="hourlyRate"
                      type="number"
                      value={profileForm.hourlyRate}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, hourlyRate: Number(e.target.value) }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="fullAddress">Full Address</Label>
                  <Textarea
                    id="fullAddress"
                    value={profileForm.fullAddress}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, fullAddress: e.target.value }))}
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                    rows={3}
                    placeholder="Tell clients about yourself..."
                  />
                </div>

                <div>
                  <Label htmlFor="skills">Skills (comma-separated)</Label>
                  <Textarea
                    id="skills"
                    value={profileForm.skills}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, skills: e.target.value }))}
                    rows={2}
                    placeholder="e.g., Photography, Video Editing, Graphic Design"
                  />
                </div>

                <div>
                  <Label htmlFor="servicesOffered">Services Offered</Label>
                  <Textarea
                    id="servicesOffered"
                    value={profileForm.servicesOffered}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, servicesOffered: e.target.value }))}
                    rows={3}
                    placeholder="Describe the services you offer..."
                  />
                </div>

                <Button onClick={handleProfileUpdate} disabled={saving} className="w-full">
                  {saving ? <LoadingSpinner /> : 'Update Profile'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="availability" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Manage Availability</CardTitle>
                <CardDescription>
                  Set your working hours and availability to help clients book you
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="workingHoursStart">Working Hours Start</Label>
                    <Input
                      id="workingHoursStart"
                      type="time"
                      value={availabilityForm.workingHoursStart}
                      onChange={(e) => setAvailabilityForm(prev => ({ ...prev, workingHoursStart: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="workingHoursEnd">Working Hours End</Label>
                    <Input
                      id="workingHoursEnd"
                      type="time"
                      value={availabilityForm.workingHoursEnd}
                      onChange={(e) => setAvailabilityForm(prev => ({ ...prev, workingHoursEnd: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="availableDays">Available Days (comma-separated)</Label>
                  <Input
                    id="availableDays"
                    value={availabilityForm.availableDays}
                    onChange={(e) => setAvailabilityForm(prev => ({ ...prev, availableDays: e.target.value }))}
                    placeholder="e.g., Monday, Tuesday, Wednesday, Thursday, Friday"
                  />
                </div>

                <div>
                  <Label htmlFor="blockedDates">Blocked/Unavailable Dates</Label>
                  <Textarea
                    id="blockedDates"
                    value={availabilityForm.blockedDates}
                    onChange={(e) => setAvailabilityForm(prev => ({ ...prev, blockedDates: e.target.value }))}
                    rows={2}
                    placeholder="List dates when you're not available (e.g., 2024-12-25, 2024-01-01)"
                  />
                </div>

                <div>
                  <Label htmlFor="availabilityDescription">Availability Description</Label>
                  <Textarea
                    id="availabilityDescription"
                    value={availabilityForm.availabilityDescription}
                    onChange={(e) => setAvailabilityForm(prev => ({ ...prev, availabilityDescription: e.target.value }))}
                    rows={3}
                    placeholder="Describe your availability in detail..."
                  />
                </div>

                <Button onClick={handleAvailabilityUpdate} disabled={saving} className="w-full">
                  {saving ? <LoadingSpinner /> : 'Update Availability'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Bookings</CardTitle>
                <CardDescription>
                  Track all your bookings and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div key={booking._id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-medium text-lg">{booking.serviceName}</h3>
                          <p className="text-sm text-foreground/70">Client: {booking.clientName}</p>
                        </div>
                        <Badge 
                          variant={booking.bookingStatus === 'completed' ? 'default' : 'secondary'}
                        >
                          {booking.bookingStatus}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-foreground/70">Date</p>
                          <p className="font-medium">
                            {booking.bookingDate ? new Date(booking.bookingDate).toLocaleDateString() : 'TBD'}
                          </p>
                        </div>
                        <div>
                          <p className="text-foreground/70">Location</p>
                          <p className="font-medium">{booking.serviceCity}, {booking.serviceState}</p>
                        </div>
                        <div>
                          <p className="text-foreground/70">Payment</p>
                          <p className="font-medium">₹{booking.paymentAmount}</p>
                        </div>
                        <div>
                          <p className="text-foreground/70">Status</p>
                          <p className="font-medium">{booking.paymentStatus}</p>
                        </div>
                      </div>

                      {booking.serviceAddress && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm text-foreground/70">Address:</p>
                          <p className="text-sm">{booking.serviceAddress}</p>
                        </div>
                      )}
                    </div>
                  ))}

                  {bookings.length === 0 && (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-foreground/30 mx-auto mb-4" />
                      <p className="text-foreground/70">No bookings yet</p>
                      <p className="text-sm text-foreground/50">Your bookings will appear here once clients start booking your services</p>
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