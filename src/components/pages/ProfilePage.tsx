import { useMember, BaseCrudService } from '@/integrations';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, Edit2, MapPin, Phone, Mail, ChevronRight, Calendar, Clock, DollarSign, Settings, History, Bell, Lock, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { memberService } from '@/services/memberService';
import { Bookings } from '@/entities';
import { format } from 'date-fns';

export default function ProfilePage() {
  const { member, actions } = useMember();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [bookings, setBookings] = useState<Bookings[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [editFormData, setEditFormData] = useState({
    phone: member?.contact?.phones?.[0] || '',
    email: member?.loginEmail || '',
    address: member?.profile?.title || ''
  });

  // Fetch user's bookings
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setIsLoadingBookings(true);
        const { items } = await BaseCrudService.getAll<Bookings>('bookings');
        // Filter bookings for current user
        const userBookings = items.filter(booking => 
          booking.clientEmail === member?.loginEmail
        ).sort((a, b) => {
          const dateA = new Date(a.bookingDate || '').getTime();
          const dateB = new Date(b.bookingDate || '').getTime();
          return dateB - dateA;
        });
        setBookings(userBookings);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setIsLoadingBookings(false);
      }
    };

    if (member?.loginEmail) {
      fetchBookings();
    }
  }, [member?.loginEmail]);

  // ... keep existing code (Update form data when member data changes)

  // ... keep existing code (Update form data when member data changes)
  useEffect(() => {
    setEditFormData({
      phone: member?.contact?.phones?.[0] || '',
      email: member?.loginEmail || '',
      address: member?.profile?.title || ''
    });
  }, [member]);

  const handleLogout = async () => {
    await actions.logout();
  };

  const handleEditChange = (field: string, value: string) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveChanges = async () => {
    try {
      setIsSaving(true);
      
      // Check if member exists and has an email (used as ID)
      if (!member?.loginEmail) {
        throw new Error('Member email not found. Please log in again.');
      }

      // Update member data using the member service
      const updatePayload: any = {
        _id: member.loginEmail,
      };

      // Only include fields that have been modified
      if (editFormData.phone && editFormData.phone !== (member?.contact?.phones?.[0] || '')) {
        updatePayload.contact = {
          ...member.contact,
          phones: [editFormData.phone],
        };
      }

      if (editFormData.address && editFormData.address !== (member?.profile?.title || '')) {
        updatePayload.profile = {
          ...member.profile,
          title: editFormData.address,
        };
      }

      // If no fields were modified, just close the dialog
      if (Object.keys(updatePayload).length === 1) {
        setIsEditing(false);
        return;
      }

      // Update member using the service
      const success = await memberService.updateMember(updatePayload);
      
      if (!success) {
        throw new Error('Failed to update profile. Please try again.');
      }

      // Reload member data to reflect changes
      if ('loadCurrentMember' in actions && typeof actions.loadCurrentMember === 'function') {
        await (actions as any).loadCurrentMember();
      }
      
      toast({
        title: "Profile Updated",
        description: "Your profile information has been updated successfully.",
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const initials = member?.contact?.firstName && member?.contact?.lastName
    ? `${member.contact.firstName[0]}${member.contact.lastName[0]}`.toUpperCase()
    : member?.loginEmail?.[0]?.toUpperCase() || 'U';

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'paid':
        return 'text-green-600';
      case 'pending':
        return 'text-yellow-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const upcomingBookings = bookings.filter(b => {
    const bookingDate = new Date(b.bookingDate || '');
    return bookingDate > new Date() && b.bookingStatus !== 'cancelled';
  });

  const pastBookings = bookings.filter(b => {
    const bookingDate = new Date(b.bookingDate || '');
    return bookingDate <= new Date() || b.bookingStatus === 'cancelled';
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-logoBlack to-[#2a2a2a] py-8 px-4 md:px-6 lg:px-12">
      <div className="max-w-6xl mx-auto">
        {/* Profile Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Card className="p-6 md:p-8 bg-secondary border border-logoGold/20 shadow-lg">
            {/* Header with Name and Edit Button */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-6">
                <Avatar className="w-20 h-20 md:w-24 md:h-24 border-2 border-logoGold">
                  <AvatarImage src={member?.profile?.photo?.url} />
                  <AvatarFallback className="bg-logoGold text-logoBlack text-2xl font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-3xl md:text-4xl font-heading font-bold text-logoBlack mb-2">
                    {member?.contact?.firstName && member?.contact?.lastName
                      ? `${member.contact.firstName} ${member.contact.lastName}`
                      : member?.profile?.nickname || 'User Profile'}
                  </h1>
                  <p className="text-sm md:text-base text-logoBlack/70 font-paragraph">
                    Member since {member?._createdDate ? format(new Date(member._createdDate), 'MMM yyyy') : 'Recently'}
                  </p>
                </div>
              </div>
              <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-logoGold/30 text-logoBlack hover:bg-logoGold/10 self-end md:self-auto"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-secondary border-logoGold/20 max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-logoBlack font-heading">Edit Profile</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-logoBlack font-semibold">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={editFormData.email}
                        onChange={(e) => handleEditChange('email', e.target.value)}
                        className="bg-white text-logoBlack border-logoGold/30 font-paragraph"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-logoBlack font-semibold">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={editFormData.phone}
                        onChange={(e) => handleEditChange('phone', e.target.value)}
                        className="bg-white text-logoBlack border-logoGold/30 font-paragraph"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-logoBlack font-semibold">Address</Label>
                      <Input
                        id="address"
                        type="text"
                        placeholder="Enter your address"
                        value={editFormData.address}
                        onChange={(e) => handleEditChange('address', e.target.value)}
                        className="bg-white text-logoBlack border-logoGold/30 font-paragraph"
                      />
                    </div>
                    <div className="flex gap-3 justify-end pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                        className="border-logoGold/30 text-logoBlack hover:bg-logoGold/10"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSaveChanges}
                        disabled={isSaving}
                        className="bg-logoGold hover:bg-logoGold/90 text-logoBlack font-semibold"
                      >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </Card>
        </motion.div>

        {/* Tabs Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-secondary border border-logoGold/20 mb-6">
              <TabsTrigger value="overview" className="data-[state=active]:bg-logoGold data-[state=active]:text-logoBlack">
                Overview
              </TabsTrigger>
              <TabsTrigger value="bookings" className="data-[state=active]:bg-logoGold data-[state=active]:text-logoBlack">
                Bookings
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-logoGold data-[state=active]:text-logoBlack">
                Settings
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Contact Information */}
              <Card className="p-6 bg-secondary border border-logoGold/20">
                <h2 className="text-2xl font-heading font-bold text-logoBlack mb-6 flex items-center gap-2">
                  <Mail className="w-6 h-6 text-logoGold" />
                  Contact Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Phone */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="flex items-start gap-4"
                  >
                    <div className="w-12 h-12 bg-logoGold/15 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone className="w-6 h-6 text-logoGold" />
                    </div>
                    <div>
                      <p className="text-sm text-logoBlack/60 font-paragraph mb-1">Phone</p>
                      <p className="text-base text-logoBlack font-paragraph font-semibold">
                        {member?.contact?.phones?.[0] || 'Not added'}
                      </p>
                    </div>
                  </motion.div>

                  {/* Email */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="flex items-start gap-4"
                  >
                    <div className="w-12 h-12 bg-logoGold/15 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="w-6 h-6 text-logoGold" />
                    </div>
                    <div>
                      <p className="text-sm text-logoBlack/60 font-paragraph mb-1">Email</p>
                      <p className="text-base text-logoBlack font-paragraph font-semibold break-all">
                        {member?.loginEmail}
                      </p>
                    </div>
                  </motion.div>

                  {/* Address */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex items-start gap-4"
                  >
                    <div className="w-12 h-12 bg-logoGold/15 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-logoGold" />
                    </div>
                    <div>
                      <p className="text-sm text-logoBlack/60 font-paragraph mb-1">Address</p>
                      <p className="text-base text-logoBlack font-paragraph font-semibold">
                        {member?.profile?.title || 'Not added'}
                      </p>
                    </div>
                  </motion.div>
                </div>
              </Card>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <Card className="p-6 bg-secondary border border-logoGold/20 text-center">
                    <Calendar className="w-8 h-8 text-logoGold mx-auto mb-3" />
                    <p className="text-3xl font-bold text-logoBlack mb-2">{bookings.length}</p>
                    <p className="text-sm text-logoBlack/60 font-paragraph">Total Bookings</p>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <Card className="p-6 bg-secondary border border-logoGold/20 text-center">
                    <Clock className="w-8 h-8 text-logoGold mx-auto mb-3" />
                    <p className="text-3xl font-bold text-logoBlack mb-2">{upcomingBookings.length}</p>
                    <p className="text-sm text-logoBlack/60 font-paragraph">Upcoming</p>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  <Card className="p-6 bg-secondary border border-logoGold/20 text-center">
                    <History className="w-8 h-8 text-logoGold mx-auto mb-3" />
                    <p className="text-3xl font-bold text-logoBlack mb-2">{pastBookings.length}</p>
                    <p className="text-sm text-logoBlack/60 font-paragraph">Completed</p>
                  </Card>
                </motion.div>
              </div>
            </TabsContent>

            {/* Bookings Tab */}
            <TabsContent value="bookings" className="space-y-6">
              {isLoadingBookings ? (
                <Card className="p-12 bg-secondary border border-logoGold/20 text-center">
                  <p className="text-logoBlack/60 font-paragraph">Loading bookings...</p>
                </Card>
              ) : bookings.length === 0 ? (
                <Card className="p-12 bg-secondary border border-logoGold/20 text-center">
                  <Calendar className="w-12 h-12 text-logoGold/40 mx-auto mb-4" />
                  <p className="text-logoBlack/60 font-paragraph mb-4">No bookings yet</p>
                  <Button 
                    onClick={() => navigate('/services')}
                    className="bg-logoGold hover:bg-logoGold/90 text-logoBlack font-semibold"
                  >
                    Browse Services
                  </Button>
                </Card>
              ) : (
                <>
                  {/* Upcoming Bookings */}
                  {upcomingBookings.length > 0 && (
                    <div>
                      <h3 className="text-xl font-heading font-bold text-secondary mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-logoGold" />
                        Upcoming Bookings
                      </h3>
                      <div className="space-y-4">
                        {upcomingBookings.map((booking) => (
                          <motion.div
                            key={booking._id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <Card className="p-6 bg-secondary border border-logoGold/20 hover:border-logoGold/50 transition-colors">
                              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div className="flex-1">
                                  <h4 className="text-lg font-semibold text-logoBlack mb-2">{booking.serviceName}</h4>
                                  <div className="space-y-1 text-sm text-logoBlack/70 font-paragraph">
                                    <p className="flex items-center gap-2">
                                      <Calendar className="w-4 h-4 text-logoGold" />
                                      {booking.bookingDate ? format(new Date(booking.bookingDate), 'MMM dd, yyyy') : 'N/A'} at {booking.bookingTime}
                                    </p>
                                    <p className="flex items-center gap-2">
                                      <MapPin className="w-4 h-4 text-logoGold" />
                                      {booking.freelancerName}
                                    </p>
                                    <p className="flex items-center gap-2">
                                      <DollarSign className="w-4 h-4 text-logoGold" />
                                      ₹{booking.paymentAmount?.toFixed(2) || '0.00'}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-3">
                                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.bookingStatus || '')}`}>
                                    {booking.bookingStatus?.charAt(0).toUpperCase() + booking.bookingStatus?.slice(1) || 'Pending'}
                                  </span>
                                  <span className={`text-sm font-semibold ${getPaymentStatusColor(booking.paymentStatus || '')}`}>
                                    {booking.paymentStatus?.charAt(0).toUpperCase() + booking.paymentStatus?.slice(1) || 'Pending'}
                                  </span>
                                </div>
                              </div>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Past Bookings */}
                  {pastBookings.length > 0 && (
                    <div>
                      <h3 className="text-xl font-heading font-bold text-secondary mb-4 flex items-center gap-2">
                        <History className="w-5 h-5 text-logoGold" />
                        Booking History
                      </h3>
                      <div className="space-y-4">
                        {pastBookings.map((booking) => (
                          <motion.div
                            key={booking._id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <Card className="p-6 bg-secondary border border-logoGold/20 opacity-75 hover:opacity-100 transition-opacity">
                              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div className="flex-1">
                                  <h4 className="text-lg font-semibold text-logoBlack mb-2">{booking.serviceName}</h4>
                                  <div className="space-y-1 text-sm text-logoBlack/70 font-paragraph">
                                    <p className="flex items-center gap-2">
                                      <Calendar className="w-4 h-4 text-logoGold" />
                                      {booking.bookingDate ? format(new Date(booking.bookingDate), 'MMM dd, yyyy') : 'N/A'} at {booking.bookingTime}
                                    </p>
                                    <p className="flex items-center gap-2">
                                      <MapPin className="w-4 h-4 text-logoGold" />
                                      {booking.freelancerName}
                                    </p>
                                    <p className="flex items-center gap-2">
                                      <DollarSign className="w-4 h-4 text-logoGold" />
                                      ₹{booking.paymentAmount?.toFixed(2) || '0.00'}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-3">
                                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.bookingStatus || '')}`}>
                                    {booking.bookingStatus?.charAt(0).toUpperCase() + booking.bookingStatus?.slice(1) || 'Completed'}
                                  </span>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => navigate('/review')}
                                    className="border-logoGold/30 text-logoBlack hover:bg-logoGold/10"
                                  >
                                    Leave Review
                                  </Button>
                                </div>
                              </div>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card className="p-6 bg-secondary border border-logoGold/20">
                <h2 className="text-2xl font-heading font-bold text-logoBlack mb-6 flex items-center gap-2">
                  <Settings className="w-6 h-6 text-logoGold" />
                  Account Settings
                </h2>
                <div className="space-y-4">
                  {/* Notification Settings */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <button className="w-full flex items-center justify-between p-4 bg-logoGold/5 rounded-lg hover:bg-logoGold/10 transition-colors group">
                      <div className="flex items-center gap-4">
                        <Bell className="w-5 h-5 text-logoGold" />
                        <div className="text-left">
                          <p className="font-semibold text-logoBlack">Notifications</p>
                          <p className="text-sm text-logoBlack/60 font-paragraph">Manage notification preferences</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-logoBlack/40 group-hover:text-logoGold transition-colors" />
                    </button>
                  </motion.div>

                  {/* Privacy Settings */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <button className="w-full flex items-center justify-between p-4 bg-logoGold/5 rounded-lg hover:bg-logoGold/10 transition-colors group">
                      <div className="flex items-center gap-4">
                        <Shield className="w-5 h-5 text-logoGold" />
                        <div className="text-left">
                          <p className="font-semibold text-logoBlack">Privacy & Security</p>
                          <p className="text-sm text-logoBlack/60 font-paragraph">Manage your privacy settings</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-logoBlack/40 group-hover:text-logoGold transition-colors" />
                    </button>
                  </motion.div>

                  {/* Password Settings */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                  >
                    <button className="w-full flex items-center justify-between p-4 bg-logoGold/5 rounded-lg hover:bg-logoGold/10 transition-colors group">
                      <div className="flex items-center gap-4">
                        <Lock className="w-5 h-5 text-logoGold" />
                        <div className="text-left">
                          <p className="font-semibold text-logoBlack">Change Password</p>
                          <p className="text-sm text-logoBlack/60 font-paragraph">Update your password</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-logoBlack/40 group-hover:text-logoGold transition-colors" />
                    </button>
                  </motion.div>
                </div>
              </Card>

              {/* Danger Zone */}
              <Card className="p-6 bg-red-50 border border-red-200">
                <h2 className="text-2xl font-heading font-bold text-red-900 mb-6">Danger Zone</h2>
                <Button
                  onClick={handleLogout}
                  className="w-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2 py-6"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
