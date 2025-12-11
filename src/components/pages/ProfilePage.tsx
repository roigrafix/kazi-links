import { useMember } from '@/integrations';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { LogOut, Edit2, MapPin, Phone, Mail, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const { member, actions } = useMember();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    phone: member?.contact?.phones?.[0] || '',
    email: member?.loginEmail || '',
    address: member?.profile?.title || ''
  });

  const handleLogout = async () => {
    await actions.logout();
  };

  const handleEditChange = (field: string, value: string) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveChanges = async () => {
    try {
      toast({
        title: "Profile Updated",
        description: "Your profile information has been updated successfully.",
      });
      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const initials = member?.contact?.firstName && member?.contact?.lastName
    ? `${member.contact.firstName[0]}${member.contact.lastName[0]}`.toUpperCase()
    : member?.loginEmail?.[0]?.toUpperCase() || 'U';

  const menuItems = [
    { icon: '📅', label: 'My bookings', href: '/tracking' },
    { icon: '⭐', label: 'My rating', href: '#' },
    { icon: '📍', label: 'Manage addresses', href: '#' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-logoBlack to-[#2a2a2a] py-8 px-4 md:px-6 lg:px-12">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="p-6 md:p-8 bg-secondary border border-logoGold/20 shadow-lg mb-8">
            {/* Header with Name and Edit Button */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 pb-6 border-b border-logoGold/20">
              <div>
                <h1 className="text-3xl md:text-4xl font-heading font-bold text-logoBlack mb-2">
                  {member?.contact?.firstName && member?.contact?.lastName
                    ? `${member.contact.firstName} ${member.contact.lastName}`
                    : member?.profile?.nickname || 'User Profile'}
                </h1>
                <p className="text-base md:text-lg text-logoBlack/70 font-paragraph">
                  {member?.contact?.phones?.[0] || 'No phone number added'}
                </p>
              </div>
              <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-logoGold/30 text-logoBlack hover:bg-logoGold/10 self-end md:self-auto"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
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
                        className="bg-logoGold hover:bg-logoGold/90 text-logoBlack font-semibold"
                      >
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Contact Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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

            {/* Logout Button */}
            <Button
              onClick={handleLogout}
              className="w-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2 py-6"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </Card>
        </motion.div>

        {/* Menu Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-3"
        >
          {menuItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.05 }}
            >
              <button
                onClick={() => {
                  if (item.label === 'Manage addresses') {
                    setIsEditing(true);
                  } else if (item.label === 'My bookings') {
                    navigate('/tracking');
                  }
                }}
                className="w-full flex items-center justify-between p-4 bg-secondary border border-logoGold/20 rounded-lg hover:bg-logoGold/5 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-base font-paragraph font-medium text-logoBlack group-hover:text-logoGold transition-colors">
                    {item.label}
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-logoBlack/40 group-hover:text-logoGold transition-colors" />
              </button>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
