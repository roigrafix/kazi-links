// Firebase Auth Service - Mock Implementation
// Note: Firebase SDK is not installed. This is a mock service for development.
// To use real Firebase, install: npm install firebase

// Mock types to match Firebase Auth API
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

// Firebase Configuration (for reference when real SDK is installed)
const firebaseConfig = {
  apiKey: "AIzaSyB79Ulw8ssi5I8nzpcueoX3poDOex2OtaY",
  authDomain: "kazilinks-95d1d.firebaseapp.com",
  projectId: "kazilinks-95d1d",
  storageBucket: "kazilinks-95d1d.firebasestorage.app",
  messagingSenderId: "448542748498",
  appId: "1:448542748498:web:bbaa6b46c32a86ad37d48b",
  measurementId: "G-50650X2SB9"
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
  private auth: Auth;
  private currentUser: User | null = null;
  private authStateListeners: Array<(user: User | null) => void> = [];
  private recaptchaVerifier: RecaptchaVerifier | null = null;

  constructor() {
    // Mock auth instance - replace with real Firebase when SDK is installed
    this.auth = {} as Auth;
    console.warn('Firebase Auth Service: Using mock implementation. Install firebase package for real authentication.');
  }

  // --- Email Authentication ---
  async signInWithEmailAndPassword(email: string, password: string): Promise<AuthResult> {
    // Mock implementation - replace with real Firebase SDK
    console.warn('Mock: signInWithEmailAndPassword called');
    return {
      success: false,
      error: {
        code: 'auth/not-implemented',
        message: 'Firebase SDK not installed. Please install firebase package.'
      }
    };
  }

  async createUserWithEmailAndPassword(email: string, password: string): Promise<AuthResult> {
    // Mock implementation - replace with real Firebase SDK
    console.warn('Mock: createUserWithEmailAndPassword called');
    return {
      success: false,
      error: {
        code: 'auth/not-implemented',
        message: 'Firebase SDK not installed. Please install firebase package.'
      }
    };
  }

  // --- Phone Authentication ---
  async setupRecaptcha(containerId: string): Promise<RecaptchaVerifier> {
    // Mock implementation
    console.warn('Mock: setupRecaptcha called');
    this.recaptchaVerifier = {
      clear: () => console.log('Mock: RecaptchaVerifier cleared')
    };
    return this.recaptchaVerifier;
  }

  async sendPhoneVerificationCode(phoneNumber: string, containerId: string = 'recaptcha-container'): Promise<PhoneAuthResult> {
    // Mock implementation - replace with real Firebase SDK
    console.warn('Mock: sendPhoneVerificationCode called for', phoneNumber);
    return {
      success: false,
      error: {
        code: 'auth/not-implemented',
        message: 'Firebase SDK not installed. Please install firebase package to enable phone authentication.'
      }
    };
  }

  async verifyPhoneOTP(confirmationResult: ConfirmationResult, otp: string): Promise<AuthResult> {
    // Mock implementation - replace with real Firebase SDK
    console.warn('Mock: verifyPhoneOTP called');
    return {
      success: false,
      error: {
        code: 'auth/not-implemented',
        message: 'Firebase SDK not installed. Please install firebase package.'
      }
    };
  }

  // --- Sign Out ---
  async signOut(): Promise<void> {
    // Mock implementation
    console.warn('Mock: signOut called');
    this.currentUser = null;
    this.notifyAuthStateListeners(null);
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
       this.recaptchaVerifier.clear();
       this.recaptchaVerifier = null;
    }
  }
}

export const firebaseAuth = new FirebaseAuthService();
export default firebaseAuth;