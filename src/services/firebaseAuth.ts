// Firebase Auth Service - Real Implementation with Wix Secrets Manager
// This service uses Firebase SDK for real authentication
// Configuration is loaded from Wix Secrets Manager for security

import { secretsService } from './secretsService';
import { initializeFirebaseApp, getFirebaseAuth, getFirebaseAuthModules } from './firebaseConfig';

// Types to match Firebase Auth API
export type Auth = any;
export type User = {
  uid: string;
  email: string | null;
  phoneNumber: string | null;
  displayName: string | null;
};
export type ConfirmationResult = {
  confirm: (verificationCode: string) => Promise<{ user: User }>;
};
export type RecaptchaVerifier = {
  clear: () => void;
};

// --- Interfaces ---
export interface AuthResult {
  success: boolean;
  user?: User;
  error?: { code: string; message: string };
}

export interface PhoneAuthResult {
  success: boolean;
  confirmationResult?: ConfirmationResult;
  error?: { code: string; message: string };
}

class FirebaseAuthService {
  private auth: Auth | null = null;
  private firebaseApp: any = null;
  private currentUser: User | null = null;
  private authStateListeners: Array<(user: User | null) => void> = [];
  private recaptchaVerifier: RecaptchaVerifier | null = null;
  private initialized = false;

  constructor() {
    this.initializeFirebase();
  }

  private async initializeFirebase() {
    try {
      // Initialize Firebase app with config from Wix Secrets
      this.firebaseApp = await initializeFirebaseApp();
      if (this.firebaseApp) {
        this.auth = await getFirebaseAuth(this.firebaseApp);
        this.initialized = true;
        console.log('✅ Firebase Auth Service initialized successfully');
      } else {
        console.warn('⚠️ Firebase initialization failed - using fallback mode');
        this.initialized = false;
      }
    } catch (error) {
      console.error('Error initializing Firebase:', error);
      this.initialized = false;
    }
  }

  // --- Email Authentication ---
  async signInWithEmailAndPassword(email: string, password: string): Promise<AuthResult> {
    try {
      if (!this.auth) {
        await this.initializeFirebase();
      }

      if (!this.auth) {
        return {
          success: false,
          error: {
            code: 'auth/not-available',
            message: 'Firebase is not available. Please check your configuration.'
          }
        };
      }

      const authModules = await getFirebaseAuthModules();
      if (!authModules) {
        return {
          success: false,
          error: {
            code: 'auth/not-available',
            message: 'Firebase Auth modules not available'
          }
        };
      }

      const { signInWithEmailAndPassword } = authModules;
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      
      const user: User = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        phoneNumber: userCredential.user.phoneNumber,
        displayName: userCredential.user.displayName
      };

      this.currentUser = user;
      this.notifyAuthStateListeners(user);

      return { success: true, user };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: error.code || 'auth/error',
          message: error.message || 'Failed to sign in'
        }
      };
    }
  }

  async createUserWithEmailAndPassword(email: string, password: string): Promise<AuthResult> {
    try {
      if (!this.auth) {
        await this.initializeFirebase();
      }

      if (!this.auth) {
        return {
          success: false,
          error: {
            code: 'auth/not-available',
            message: 'Firebase is not available. Please check your configuration.'
          }
        };
      }

      const authModules = await getFirebaseAuthModules();
      if (!authModules) {
        return {
          success: false,
          error: {
            code: 'auth/not-available',
            message: 'Firebase Auth modules not available'
          }
        };
      }

      const { createUserWithEmailAndPassword } = authModules;
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      
      const user: User = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        phoneNumber: userCredential.user.phoneNumber,
        displayName: userCredential.user.displayName
      };

      this.currentUser = user;
      this.notifyAuthStateListeners(user);

      return { success: true, user };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: error.code || 'auth/error',
          message: error.message || 'Failed to create account'
        }
      };
    }
  }

  // --- Phone Authentication ---
  async setupRecaptcha(containerId: string): Promise<RecaptchaVerifier> {
    try {
      if (!this.auth) {
        await this.initializeFirebase();
      }

      if (!this.auth) {
        throw new Error('Firebase Auth not available');
      }

      const authModules = await getFirebaseAuthModules();
      if (!authModules) {
        throw new Error('Firebase Auth modules not available');
      }

      const { RecaptchaVerifier } = authModules;
      this.recaptchaVerifier = new RecaptchaVerifier(containerId, {
        size: 'invisible',
        callback: (token: string) => {
          console.log('reCAPTCHA verified:', token);
        },
        'expired-callback': () => {
          console.log('reCAPTCHA expired');
        }
      }, this.auth);

      return this.recaptchaVerifier;
    } catch (error: any) {
      console.error('Error setting up reCAPTCHA:', error);
      throw error;
    }
  }

  async sendPhoneVerificationCode(phoneNumber: string, containerId: string = 'recaptcha-container'): Promise<PhoneAuthResult> {
    try {
      if (!this.auth) {
        await this.initializeFirebase();
      }

      if (!this.auth) {
        return {
          success: false,
          error: {
            code: 'auth/not-available',
            message: 'Firebase is not available. Please check your configuration.'
          }
        };
      }

      const authModules = await getFirebaseAuthModules();
      if (!authModules) {
        return {
          success: false,
          error: {
            code: 'auth/not-available',
            message: 'Firebase Auth modules not available'
          }
        };
      }

      const { signInWithPhoneNumber } = authModules;

      // Setup reCAPTCHA if not already done
      if (!this.recaptchaVerifier) {
        await this.setupRecaptcha(containerId);
      }

      const confirmationResult = await signInWithPhoneNumber(
        this.auth,
        phoneNumber,
        this.recaptchaVerifier
      );

      return {
        success: true,
        confirmationResult
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: error.code || 'auth/error',
          message: error.message || 'Failed to send OTP'
        }
      };
    }
  }

  async verifyPhoneOTP(confirmationResult: ConfirmationResult, otp: string): Promise<AuthResult> {
    try {
      if (!confirmationResult) {
        return {
          success: false,
          error: {
            code: 'auth/invalid-confirmation',
            message: 'Invalid confirmation result'
          }
        };
      }

      const userCredential = await confirmationResult.confirm(otp);
      
      const user: User = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        phoneNumber: userCredential.user.phoneNumber,
        displayName: userCredential.user.displayName
      };

      this.currentUser = user;
      this.notifyAuthStateListeners(user);

      return { success: true, user };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: error.code || 'auth/error',
          message: error.message || 'Failed to verify OTP'
        }
      };
    }
  }

  // --- Sign Out ---
  async signOut(): Promise<void> {
    try {
      if (!this.auth) {
        await this.initializeFirebase();
      }

      if (this.auth) {
        const authModules = await getFirebaseAuthModules();
        if (authModules) {
          const { signOut } = authModules;
          await signOut(this.auth);
        }
      }

      this.currentUser = null;
      this.notifyAuthStateListeners(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  // --- State Management ---
  onAuthStateChanged(callback: (user: User | null) => void) {
    this.authStateListeners.push(callback);
    callback(this.currentUser);
    return () => {
      this.authStateListeners = this.authStateListeners.filter(l => l !== callback);
    };
  }

  private notifyAuthStateListeners(user: User | null) {
    this.authStateListeners.forEach(listener => listener(user));
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  getAuth(): Auth {
    return this.auth;
  }

  clearRecaptcha(): void {
    if (this.recaptchaVerifier) {
      try {
        this.recaptchaVerifier.clear();
      } catch (error) {
        console.warn('Error clearing reCAPTCHA:', error);
      }
      this.recaptchaVerifier = null;
    }
  }

  isInitialized(): boolean {
    return this.initialized && !!this.auth;
  }
}

export const firebaseAuth = new FirebaseAuthService();
export default firebaseAuth;