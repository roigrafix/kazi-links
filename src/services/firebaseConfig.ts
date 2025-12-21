/**
 * Firebase Configuration Module
 * Handles Firebase SDK initialization and availability checks
 * 
 * This module gracefully handles cases where Firebase SDK is not installed
 */

let firebaseInitialized = false;
let firebaseAvailable = false;

/**
 * Check if Firebase SDK is available
 */
export async function isFirebaseAvailable(): Promise<boolean> {
  if (firebaseInitialized) {
    return firebaseAvailable;
  }

  try {
    // Try to import Firebase modules - using dynamic import with type assertion
    await import('firebase/app' as any);
    await import('firebase/auth' as any);
    firebaseAvailable = true;
    firebaseInitialized = true;
    return true;
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

    const { initializeApp } = await import('firebase/app' as any);
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

    const { getAuth } = await import('firebase/auth' as any);
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

    return await import('firebase/auth' as any);
  } catch (error: any) {
    console.warn('Failed to get Firebase Auth modules:', error.message);
    return null;
  }
}
