/**
 * Google Firebase Phone Authentication Service
 * Handles phone number verification using Firebase Authentication
 * 
 * IMPORTANT: Store your Firebase credentials in .env.local:
 *   VITE_FIREBASE_API_KEY=your_api_key
 *   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
 *   VITE_FIREBASE_PROJECT_ID=your_project_id
 *   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
 *   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
 *   VITE_FIREBASE_APP_ID=your_app_id
 */

interface PhoneAuthResult {
  success: boolean;
  message: string;
  verificationId?: string;
  error?: string;
}

interface VerifyOTPResult {
  success: boolean;
  message: string;
  valid: boolean;
  error?: string;
}

class GooglePhoneAuthService {
  private firebaseConfig: any;
  private auth: any;
  private firebaseModules: any;
  private initialized: boolean = false;

  constructor() {
    this.firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
    };

    if (!this.isConfigured()) {
      console.warn(
        'Firebase credentials not configured. Phone authentication will be disabled. ' +
        'Configure credentials in .env.local with VITE_FIREBASE_* variables'
      );
    }
  }

  /**
   * Check if Firebase is properly configured
   */
  isConfigured(): boolean {
    return !!(
      this.firebaseConfig.apiKey &&
      this.firebaseConfig.authDomain &&
      this.firebaseConfig.projectId
    );
  }

  /**
   * Initialize Firebase Auth
   */
  async initialize(): Promise<boolean> {
    if (this.initialized) return true;
    if (!this.isConfigured()) return false;

    try {
      // Dynamically import Firebase modules
      // @ts-ignore - Firebase is an optional dependency
      const firebaseApp = await import('firebase/app').catch((err) => {
        console.error('Failed to import firebase/app:', err.message);
        return null;
      });
      // @ts-ignore - Firebase is an optional dependency
      const firebaseAuth = await import('firebase/auth').catch((err) => {
        console.error('Failed to import firebase/auth:', err.message);
        return null;
      });

      if (!firebaseApp || !firebaseAuth) {
        const errorMsg = 'Firebase SDK is not installed. Please run: npm install firebase';
        console.error(errorMsg);
        console.error('Installation command: npm install firebase');
        return false;
      }

      const { initializeApp } = firebaseApp;
      const { getAuth } = firebaseAuth;

      // Initialize Firebase
      const app = initializeApp(this.firebaseConfig);
      this.auth = getAuth(app);
      this.firebaseModules = firebaseAuth;
      this.initialized = true;

      console.log('✅ Firebase Authentication initialized successfully');
      return true;
    } catch (error: any) {
      console.error('❌ Failed to initialize Firebase:', error.message);
      if (error.message?.includes('Cannot find module')) {
        console.error('📦 Firebase SDK is not installed.');
        console.error('💡 To fix this, run: npm install firebase');
      }
      return false;
    }
  }

  /**
   * Send OTP to phone number
   * @param phoneNumber - Phone number in E.164 format (e.g., +1234567890)
   * @returns Promise with verification ID
   */
  async sendOTP(phoneNumber: string): Promise<PhoneAuthResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        message: 'Firebase is not configured. Please check your environment variables.',
      };
    }

    // Validate phone number format
    if (!phoneNumber.startsWith('+')) {
      return {
        success: false,
        message: 'Phone number must be in E.164 format (e.g., +91XXXXXXXXXX)',
      };
    }

    try {
      // Initialize Firebase if not already done
      const initialized = await this.initialize();
      if (!initialized) {
        return {
          success: false,
          message: 'Failed to initialize Firebase authentication',
        };
      }

      // Create reCAPTCHA verifier
      // @ts-ignore - Firebase is an optional dependency
      const firebaseAuth = await import('firebase/auth').catch(() => null);
      if (!firebaseAuth) {
        return {
          success: false,
          message: 'Firebase authentication module not available',
        };
      }

      const { RecaptchaVerifier, signInWithPhoneNumber } = firebaseAuth;
      
      const recaptchaVerifier = new RecaptchaVerifier(
        'recaptcha-container',
        {
          size: 'invisible',
          callback: (token: any) => {
            console.log('reCAPTCHA verified');
          },
        },
        this.auth
      );

      // Send verification code
      const confirmationResult = await signInWithPhoneNumber(
        this.auth,
        phoneNumber,
        recaptchaVerifier
      );

      // Store verification ID for later use
      (window as any).confirmationResult = confirmationResult;

      return {
        success: true,
        message: 'OTP sent successfully to your phone number',
        verificationId: confirmationResult.verificationId,
      };
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      
      let errorMessage = 'Failed to send OTP. Please try again.';
      if (error.code === 'auth/invalid-phone-number') {
        errorMessage = 'Invalid phone number format. Please use E.164 format (e.g., +91XXXXXXXXXX)';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later.';
      }

      return {
        success: false,
        message: errorMessage,
        error: error.message,
      };
    }
  }

  /**
   * Verify OTP code
   * @param otpCode - 6-digit OTP code
   * @returns Promise with verification result
   */
  async verifyOTP(otpCode: string): Promise<VerifyOTPResult> {
    if (!otpCode || otpCode.length !== 6) {
      return {
        success: false,
        message: 'Please enter a valid 6-digit OTP',
        valid: false,
      };
    }

    try {
      const confirmationResult = (window as any).confirmationResult;
      
      if (!confirmationResult) {
        return {
          success: false,
          message: 'No verification session found. Please send OTP again.',
          valid: false,
        };
      }

      // Verify the OTP code
      const result = await confirmationResult.confirm(otpCode);

      if (result.user) {
        return {
          success: true,
          message: 'Phone number verified successfully',
          valid: true,
        };
      }

      return {
        success: false,
        message: 'Invalid OTP. Please try again.',
        valid: false,
      };
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      
      let errorMessage = 'Invalid OTP. Please try again.';
      if (error.code === 'auth/invalid-verification-code') {
        errorMessage = 'Invalid OTP code. Please check and try again.';
      } else if (error.code === 'auth/code-expired') {
        errorMessage = 'OTP code has expired. Please request a new one.';
      }

      return {
        success: false,
        message: errorMessage,
        valid: false,
        error: error.message,
      };
    }
  }

  /**
   * Format phone number to E.164 format
   * @param phoneNumber - Phone number (various formats)
   * @returns Formatted phone number
   */
  formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');

    // If it's an Indian number (10 digits), add +91
    if (cleaned.length === 10) {
      return `+91${cleaned}`;
    }

    // If it already has country code
    if (cleaned.length > 10) {
      return `+${cleaned}`;
    }

    // If it starts with 0, remove it and add +91
    if (phoneNumber.startsWith('0') && cleaned.length === 10) {
      return `+91${cleaned.substring(1)}`;
    }

    return `+${cleaned}`;
  }

  /**
   * Clear reCAPTCHA verifier
   */
  clearRecaptcha(): void {
    try {
      const recaptchaContainer = document.getElementById('recaptcha-container');
      if (recaptchaContainer) {
        recaptchaContainer.innerHTML = '';
      }
    } catch (error) {
      console.error('Error clearing reCAPTCHA:', error);
    }
  }
}

export const googlePhoneAuthService = new GooglePhoneAuthService();
export default googlePhoneAuthService;
