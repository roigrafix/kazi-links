/**
 * Firebase Configuration Module
 * Handles Firebase SDK initialization and availability checks
 * Fetches configuration from Wix Secrets Manager
 * 
 * This module gracefully handles cases where Firebase SDK is not installed
 */

import { secretsService } from './secretsService';

let firebaseInitialized = false;
let firebaseAvailable = false;
let firebaseConfig: any = null;

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
 * Load Firebase configuration from Wix Secrets Manager
 */
async function loadFirebaseConfig(): Promise<any> {
  try {
    // Initialize secrets service if not already done
    await secretsService.initialize();
    
    // Get Firebase config from secrets
    const config = secretsService.getFirebaseConfig();
    
    // Validate that we have the required fields
    if (!config.apiKey || !config.authDomain || !config.projectId) {
      console.warn(
        '⚠️ Firebase configuration is incomplete in Wix Secrets Manager.\n' +
        'Required fields: apiKey, authDomain, projectId\n' +
        'Please ensure all Firebase configuration details are saved in Wix Secrets Manager.'
      );
      return null;
    }
    
    firebaseConfig = config;
    return config;
  } catch (error) {
    console.error('Error loading Firebase configuration from Wix Secrets:', error);
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
    // First, load Firebase configuration from Wix Secrets
    const config = await loadFirebaseConfig();
    if (!config) {
      firebaseAvailable = false;
      firebaseInitialized = true;
      return false;
    }

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
 * Uses configuration from Wix Secrets Manager if not provided
 */
export async function initializeFirebaseApp(config?: any) {
  try {
    const available = await isFirebaseAvailable();
    if (!available) {
      return null;
    }

    // Use provided config or load from Wix Secrets
    let appConfig = config;
    if (!appConfig) {
      appConfig = firebaseConfig || (await loadFirebaseConfig());
    }

    if (!appConfig) {
      console.warn('Firebase configuration not available');
      return null;
    }

    const firebaseApp = await safeImport('firebase/app');
    if (!firebaseApp) {
      return null;
    }

    const { initializeApp } = firebaseApp;
    return initializeApp(appConfig);
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

/**
 * Get Firebase configuration
 * Loads from Wix Secrets Manager if not already loaded
 */
export async function getFirebaseConfigFromSecrets() {
  if (firebaseConfig) {
    return firebaseConfig;
  }
  return await loadFirebaseConfig();
}
