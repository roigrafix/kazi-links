/**
 * Firebase Configuration Module
 * Handles Firebase SDK initialization and availability checks
 * 
 * This module gracefully handles cases where Firebase SDK is not installed
 */

let firebaseInitialized = false;
let firebaseAvailable = false;

/**
 * Safely import a module with error handling
 */
async function safeImport(modulePath: string): Promise<any> {
  try {
    // Use Function constructor to avoid static module resolution
    const importFn = new Function('path', 'return import(path)');
    return await importFn(modulePath);
  } catch (error) {
    return null;
  }
}

/**
 * Check if Firebase SDK is available
 */
export async function isFirebaseAvailable(): Promise<boolean> {
  if (firebaseInitialized) {
    return firebaseAvailable;
  }

  try {
    // Try to import Firebase modules using safe import
    const firebaseApp = await safeImport('firebase/app');
    const firebaseAuth = await safeImport('firebase/auth');
    
    if (firebaseApp && firebaseAuth) {
      firebaseAvailable = true;
      firebaseInitialized = true;
      return true;
    }
    
    firebaseAvailable = false;
    firebaseInitialized = true;
    console.warn(
      '⚠️ Firebase SDK is not installed. Phone authentication will be disabled.\n' +
      'To enable Firebase, run: npm install firebase'
    );
    return false;
  } catch (error) {
    firebaseAvailable = false;
    firebaseInitialized = true;
    console.warn(
      '⚠️ Firebase SDK is not installed. Phone authentication will be disabled.\n' +
      'To enable Firebase, run: npm install firebase'
    );
    return false;
  }
}

/**
 * Initialize Firebase App
 */
export async function initializeFirebaseApp(config: any) {
  try {
    const available = await isFirebaseAvailable();
    if (!available) {
      return null;
    }

    const firebaseApp = await safeImport('firebase/app');
    if (!firebaseApp) {
      return null;
    }

    const { initializeApp } = firebaseApp;
    return initializeApp(config);
  } catch (error: any) {
    console.warn('Failed to initialize Firebase:', error.message);
    return null;
  }
}

/**
 * Get Firebase Auth instance
 */
export async function getFirebaseAuth(app: any) {
  try {
    const available = await isFirebaseAvailable();
    if (!available) {
      return null;
    }

    const firebaseAuth = await safeImport('firebase/auth');
    if (!firebaseAuth) {
      return null;
    }

    const { getAuth } = firebaseAuth;
    return getAuth(app);
  } catch (error: any) {
    console.warn('Failed to get Firebase Auth:', error.message);
    return null;
  }
}

/**
 * Get Firebase Auth modules
 */
export async function getFirebaseAuthModules() {
  try {
    const available = await isFirebaseAvailable();
    if (!available) {
      return null;
    }

    return await safeImport('firebase/auth');
  } catch (error: any) {
    console.warn('Failed to get Firebase Auth modules:', error.message);
    return null;
  }
}
