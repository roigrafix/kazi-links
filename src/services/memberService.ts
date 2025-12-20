/**
 * Member Service
 * Handles member profile updates using Wix Members API
 */

interface UpdateMemberPayload {
  _id: string;
  contact?: {
    firstName?: string;
    lastName?: string;
    phones?: string[];
    emails?: string[];
  };
  profile?: {
    nickname?: string;
    title?: string;
    photo?: {
      url?: string;
      height?: number;
      width?: number;
      offsetX?: number;
      offsetY?: number;
    };
  };
}

export const memberService = {
  /**
   * Update member profile information
   * Uses Wix Members API to update contact and profile data
   */
  async updateMember(payload: UpdateMemberPayload): Promise<boolean> {
    try {
      // Check if Wix Members API is available
      if (typeof window === 'undefined' || !window) {
        console.error('Window object not available');
        return false;
      }

      // Access Wix Members API
      const wixMembers = (window as any).Wix?.members;
      
      if (!wixMembers) {
        console.error('Wix Members API not available');
        return false;
      }

      // Call the updateMember method
      const result = await wixMembers.updateMember(payload);
      
      if (result) {
        console.log('Member updated successfully:', result);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error updating member:', error);
      return false;
    }
  },

  /**
   * Update member phone number
   */
  async updatePhone(memberId: string, phone: string): Promise<boolean> {
    return this.updateMember({
      _id: memberId,
      contact: {
        phones: [phone],
      },
    });
  },

  /**
   * Update member address (stored in profile.title)
   */
  async updateAddress(memberId: string, address: string): Promise<boolean> {
    return this.updateMember({
      _id: memberId,
      profile: {
        title: address,
      },
    });
  },

  /**
   * Update member name
   */
  async updateName(memberId: string, firstName: string, lastName: string): Promise<boolean> {
    return this.updateMember({
      _id: memberId,
      contact: {
        firstName,
        lastName,
      },
    });
  },

  /**
   * Update member nickname
   */
  async updateNickname(memberId: string, nickname: string): Promise<boolean> {
    return this.updateMember({
      _id: memberId,
      profile: {
        nickname,
      },
    });
  },

  /**
   * Check if Wix Members API is available
   */
  isAvailable(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(window as any).Wix?.members;
  },
};
