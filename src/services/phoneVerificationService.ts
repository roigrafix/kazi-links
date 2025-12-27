import { useMember } from '@/integrations';
import { BaseCrudService } from '@/integrations';

/**
 * Service for managing phone number verification and storage
 */
class PhoneVerificationService {
  /**
   * Stores verified phone number in Wix Members
   * This should be called after successful OTP verification
   */
  async storeVerifiedPhoneNumber(phoneNumber: string): Promise<{ success: boolean; message: string }> {
    try {
      // Get the verified phone number from session storage
      const verifiedPhone = sessionStorage.getItem('verifiedPhoneNumber');
      
      if (!verifiedPhone) {
        return {
          success: false,
          message: 'No verified phone number found in session'
        };
      }

      // In a real implementation, you would update the Wix Members profile
      // For now, we'll store it in localStorage as a backup
      const verificationData = {
        phoneNumber: verifiedPhone,
        verifiedAt: new Date().toISOString(),
        verified: true
      };

      localStorage.setItem('phoneVerification', JSON.stringify(verificationData));

      return {
        success: true,
        message: 'Phone number stored successfully'
      };
    } catch (error: any) {
      console.error('Error storing phone number:', error);
      return {
        success: false,
        message: error.message || 'Failed to store phone number'
      };
    }
  }

  /**
   * Retrieves stored phone verification data
   */
  getVerificationData(): { phoneNumber?: string; verifiedAt?: string; verified?: boolean } | null {
    try {
      const data = localStorage.getItem('phoneVerification');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error retrieving verification data:', error);
      return null;
    }
  }

  /**
   * Checks if phone number is verified
   */
  isPhoneVerified(): boolean {
    const data = this.getVerificationData();
    return data?.verified === true;
  }

  /**
   * Gets the verified phone number
   */
  getVerifiedPhoneNumber(): string | null {
    const data = this.getVerificationData();
    return data?.phoneNumber || null;
  }

  /**
   * Clears phone verification data
   */
  clearVerificationData(): void {
    localStorage.removeItem('phoneVerification');
    sessionStorage.removeItem('verifiedPhoneNumber');
  }

  /**
   * Formats phone number for display
   */
  formatPhoneForDisplay(phoneNumber: string): string {
    // Format: +91 98765 43210
    if (phoneNumber.startsWith('+91')) {
      const digits = phoneNumber.slice(3);
      return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
    }
    return phoneNumber;
  }
}

export const phoneVerificationService = new PhoneVerificationService();
