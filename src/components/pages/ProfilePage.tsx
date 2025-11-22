import { useMember } from '@/integrations';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { LogOut } from 'lucide-react';

export default function ProfilePage() {
  const { member, actions } = useMember();

  const handleLogout = async () => {
    await actions.logout();
  };

  const initials = member?.contact?.firstName && member?.contact?.lastName
    ? `${member.contact.firstName[0]}${member.contact.lastName[0]}`.toUpperCase()
    : member?.loginEmail?.[0]?.toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="p-8 bg-white border border-gray-200">
          {/* Profile Header */}
          <div className="flex flex-col items-center mb-8">
            <Avatar className="w-24 h-24 mb-4">
              {member?.profile?.photo?.url && (
                <AvatarImage src={member.profile.photo.url} alt="Profile" />
              )}
              <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
              {member?.contact?.firstName && member?.contact?.lastName
                ? `${member.contact.firstName} ${member.contact.lastName}`
                : member?.profile?.nickname || 'User Profile'}
            </h1>
            <p className="text-lg text-gray-600">{member?.loginEmail}</p>
          </div>

          {/* Profile Information */}
          <div className="space-y-6 mb-8">
            <div className="border-t pt-6">
              <h2 className="text-lg font-heading font-semibold text-foreground mb-4">
                Account Information
              </h2>
              <div className="space-y-4">
                {member?.contact?.firstName && (
                  <div>
                    <p className="text-sm text-gray-500 font-paragraph">First Name</p>
                    <p className="text-base text-foreground font-paragraph">
                      {member.contact.firstName}
                    </p>
                  </div>
                )}
                {member?.contact?.lastName && (
                  <div>
                    <p className="text-sm text-gray-500 font-paragraph">Last Name</p>
                    <p className="text-base text-foreground font-paragraph">
                      {member.contact.lastName}
                    </p>
                  </div>
                )}
                {member?.contact?.phones && member.contact.phones.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 font-paragraph">Phone</p>
                    <p className="text-base text-foreground font-paragraph">
                      {member.contact.phones[0]}
                    </p>
                  </div>
                )}
                {member?.profile?.title && (
                  <div>
                    <p className="text-sm text-gray-500 font-paragraph">Title</p>
                    <p className="text-base text-foreground font-paragraph">
                      {member.profile.title}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500 font-paragraph">Email</p>
                  <p className="text-base text-foreground font-paragraph">
                    {member?.loginEmail}
                  </p>
                </div>
                {member?.status && (
                  <div>
                    <p className="text-sm text-gray-500 font-paragraph">Status</p>
                    <p className="text-base text-foreground font-paragraph capitalize">
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
              variant="destructive"
              className="flex items-center gap-2"
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
