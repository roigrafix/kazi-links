// Firebase SDK imports - Note: Firebase SDK needs to be installed via npm
// For now, using type-only definitions to prevent build errors
// TODO: Install firebase package: npm install firebase

// Type definitions for Firebase (placeholder until package is installed)
export type Auth = any;
export type User = any;
export type RecaptchaVerifier = any;
export type ConfirmationResult = any;
export type PhoneAuthProvider = any;

// Placeholder Firebase functions
const initializeApp = (config: any): any => {
  console.warn('Firebase SDK not installed. Please run: npm install firebase');
  return {};
};

const getAuth = (app: any): any => {
  console.warn('Firebase SDK not installed. Please run: npm install firebase');
  return {};
};

const signInWithEmailAndPassword = async (auth: any, email: string, password: string): Promise<any> => {
  throw new Error('Firebase SDK not installed. Please run: npm install firebase');
};

const createUserWithEmailAndPassword = async (auth: any, email: string, password: string): Promise<any> => {
  throw new Error('Firebase SDK not installed. Please run: npm install firebase');
};

const signOut = async (auth: any): Promise<void> => {
  throw new Error('Firebase SDK not installed. Please run: npm install firebase');
};

const onAuthStateChanged = (auth: any, callback: (user: any) => void): any => {
  console.warn('Firebase SDK not installed. Please run: npm install firebase');
  return () => {};
};

const RecaptchaVerifier = class {
  constructor(auth: any, containerId: string, options: any) {
    console.warn('Firebase SDK not installed. Please run: npm install firebase');
  }
};

const signInWithPhoneNumber = async (auth: any, phoneNumber: string, verifier: any): Promise<any> => {
  throw new Error('Firebase SDK not installed. Please run: npm install firebase');
};

const signInWithCredential = async (auth: any, credential: any): Promise<any> => {
  throw new Error('Firebase SDK not installed. Please run: npm install firebase');
};

// --- Configuration ---
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
    const app = initializeApp(firebaseConfig);
    this.auth = getAuth(app);
    
    onAuthStateChanged(this.auth, (user) => {
      this.currentUser = user;
      this.notifyAuthStateListeners(user);
    });
  }

  // --- Email Authentication ---
  async signInWithEmailAndPassword(email: string, password: string): Promise<AuthResult> {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message
        }
      };
    }
  }

  async createUserWithEmailAndPassword(email: string, password: string): Promise<AuthResult> {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message
        }
      };
    }
  }

  // --- Phone Authentication ---
  async setupRecaptcha(containerId: string): Promise<RecaptchaVerifier> {
    try {
      this.recaptchaVerifier = new RecaptchaVerifier(this.auth, containerId, {
        size: 'invisible',
        callback: () => {
          console.log('reCAPTCHA verified');
        },
        'expired-callback': () => {
          console.log('reCAPTCHA expired');
        }
      });
      return this.recaptchaVerifier;
    } catch (error: any) {
      console.error('Error setting up reCAPTCHA:', error);
      throw error;
    }
  }

  async sendPhoneVerificationCode(phoneNumber: string, containerId: string = 'recaptcha-container'): Promise<PhoneAuthResult> {
    try {
      if (!this.recaptchaVerifier) {
        await this.setupRecaptcha(containerId);
      }

      const confirmationResult = await signInWithPhoneNumber(
        this.auth,
        phoneNumber,
        this.recaptchaVerifier!
      );

      return {
        success: true,
        confirmationResult
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message
        }
      };
    }
  }

  async verifyPhoneOTP(confirmationResult: ConfirmationResult, otp: string): Promise<AuthResult> {
    try {
      const userCredential = await confirmationResult.confirm(otp);
      return { success: true, user: userCredential.user };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message
        }
      };
    }
  }

  // --- Sign Out ---
  async signOut(): Promise<void> {
    try {
      await signOut(this.auth);
    } catch (error) {
      console.error('Sign out error:', error);
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
    this.recaptchaVerifier = null;
  }
}

export const firebaseAuth = new FirebaseAuthService();
export default firebaseAuth;