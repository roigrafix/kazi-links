import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  Auth,
  User
} from "firebase/auth";

// --- Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyB79Ulw8ssi5I8nzpcueoX3poDOex2OtaY", // Double check this API key from your console
  authDomain: "kazilinks-95d1d.firebaseapp.com",
  projectId: "kazilinks-95d1d",
  storageBucket: "kazilinks-95d1d.firebasestorage.app",
  messagingSenderId: "448542748498",
  appId: "1:448542748498:web:bbaa6b46c32a86ad37d48b",
  measurementId: "G-50650X2SB9"
};

// --- Interfaces (Kept these so your other files don't break) ---
export interface AuthResult {
  success: boolean;
  user?: User; // Updated to use real Firebase User type
  error?: { code: string; message: string };
}

class FirebaseAuthService {
  private auth: Auth; // The real Firebase Auth instance
  private currentUser: User | null = null;
  private authStateListeners: Array<(user: User | null) => void> = [];

  constructor() {
    // 1. Initialize Firebase immediately
    const app = initializeApp(firebaseConfig);
    this.auth = getAuth(app);
    
    // 2. Start listening for real auth changes
    onAuthStateChanged(this.auth, (user) => {
      this.currentUser = user;
      this.notifyAuthStateListeners(user);
    });
  }

  // --- Real Sign In ---
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

  // --- Real Sign Up ---
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

  // --- Real Sign Out ---
  async signOut(): Promise<void> {
    try {
      await signOut(this.auth);
      // The onAuthStateChanged listener will handle updating the state automatically
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }

  // --- State Management Helpers ---
  onAuthStateChanged(callback: (user: User | null) => void) {
    this.authStateListeners.push(callback);
    callback(this.currentUser); // Trigger immediately with current value
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
}

export const firebaseAuth = new FirebaseAuthService();
export default firebaseAuth;
