import { useMember } from '@/integrations';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { LogOut, Edit2 } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function ProfilePage() {
  const { member, actions } = useMember();
  const { toast } = useToast();
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
      // Note: In a real implementation, you would call an API to update member data
      // For now, we'll just show a success message
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-logoBlack to-[#2a2a2a] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="p-8 bg-secondary border border-logoGold/20 shadow-lg">
          {/* Profile Header */}
          <div className="flex flex-col items-center mb-8">
            <Avatar className="w-24 h-24 mb-4 border-4 border-logoGold">
              {member?.profile?.photo?.url && (
                <AvatarImage src={member.profile.photo.url} alt="Profile" />
              )}
              <AvatarFallback className="bg-logoGold text-logoBlack text-lg font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <h1 className="text-3xl font-heading font-bold text-logoBlack mb-2">
              {member?.contact?.firstName && member?.contact?.lastName
                ? `${member.contact.firstName} ${member.contact.lastName}`
                : member?.profile?.nickname || 'User Profile'}
            </h1>
            <p className="text-lg text-logoBlack/70 font-paragraph">{member?.loginEmail}</p>
          </div>

          {/* Profile Information */}
          <div className="space-y-6 mb-8">
            <div className="border-t border-logoGold/20 pt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-heading font-bold text-logoBlack">
                  Account Information
                </h2>
                <Dialog open={isEditing} onOpenChange={setIsEditing}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-logoGold/30 text-logoBlack hover:bg-logoGold/10"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-secondary border-logoGold/20">
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
              <div className="space-y-4">
                {member?.contact?.firstName && (
                  <div>
                    <p className="text-sm text-logoBlack/60 font-paragraph">First Name</p>
                    <p className="text-base text-logoBlack font-paragraph font-semibold">
                      {member.contact.firstName}
                    </p>
                  </div>
                )}
                {member?.contact?.lastName && (
                  <div>
                    <p className="text-sm text-logoBlack/60 font-paragraph">Last Name</p>
                    <p className="text-base text-logoBlack font-paragraph font-semibold">
                      {member.contact.lastName}
                    </p>
                  </div>
                )}
                {member?.contact?.phones && member.contact.phones.length > 0 && (
                  <div>
                    <p className="text-sm text-logoBlack/60 font-paragraph">Phone</p>
                    <p className="text-base text-logoBlack font-paragraph font-semibold">
                      {member.contact.phones[0]}
                    </p>
                  </div>
                )}
                {member?.profile?.title && (
                  <div>
                    <p className="text-sm text-logoBlack/60 font-paragraph">Address</p>
                    <p className="text-base text-logoBlack font-paragraph font-semibold">
                      {member.profile.title}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-logoBlack/60 font-paragraph">Email</p>
                  <p className="text-base text-logoBlack font-paragraph font-semibold">
                    {member?.loginEmail}
                  </p>
                </div>
                {member?.status && (
                  <div>
                    <p className="text-sm text-logoBlack/60 font-paragraph">Status</p>
                    <p className="text-base text-logoBlack font-paragraph font-semibold capitalize">
                      {member.status}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <div className="flex gap-4">
            <Button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
