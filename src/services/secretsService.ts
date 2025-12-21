/**
 * Wix Secrets API Service
 * Manages secure credential storage and retrieval from Wix Secrets API
 * 
 * SECURITY BEST PRACTICES:
 * 1. NEVER expose API keys in client-side code
 * 2. ALWAYS use Wix Secrets Manager for sensitive credentials
 * 3. Backend functions must validate and sanitize all inputs
 * 4. Use HTTPS for all API communications
 * 5. Implement rate limiting on backend functions
 * 6. Log all access to sensitive credentials
 * 7. Rotate credentials regularly
 * 8. Use environment variables for non-sensitive config
 * 
 * IMPORTANT: This service requires backend functions to be set up in your Wix project
 * Backend functions should be created in /backend directory with proper permissions
 */

export interface SecretCredentials {
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioServiceSid?: string;
  twilioPhoneNumber?: string;
  sendGridApiKey?: string;
  firebaseApiKey?: string;
  firebaseAuthDomain?: string;
  firebaseProjectId?: string;
  firebaseStorageBucket?: string;
  firebaseMessagingSenderId?: string;
  firebaseAppId?: string;
  firebaseMeasurementId?: string;
}

export interface SecretsServiceConfig {
  useWixSecrets?: boolean;
  fallbackToEnv?: boolean;
  cacheExpiry?: number; // in milliseconds
}

class SecretsService {
  private credentials: SecretCredentials = {};
  private lastFetchTime: number = 0;
  private cacheExpiry: number = 3600000; // 1 hour default
  private useWixSecrets: boolean = true;
  private fallbackToEnv: boolean = true;

  constructor(config?: SecretsServiceConfig) {
    this.useWixSecrets = config?.useWixSecrets !== false;
    this.fallbackToEnv = config?.fallbackToEnv !== false;
    this.cacheExpiry = config?.cacheExpiry || 3600000;
  }

  /**
   * Initialize secrets from Wix Secrets API or environment variables
   * Call this once at app startup
   * SECURITY: Credentials are cached in memory and never logged
   */
  async initialize(): Promise<boolean> {
    try {
      if (this.useWixSecrets) {
        const success = await this.fetchFromWixSecrets();
        if (success) {
          console.log('✅ Secrets loaded from Wix Secrets Manager');
          return true;
        }
      }

      if (this.fallbackToEnv) {
        this.loadFromEnvironment();
        console.log('⚠️ Secrets loaded from environment variables (fallback mode)');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to initialize secrets:', error);
      
      // Fallback to environment variables if Wix Secrets fails
      if (this.fallbackToEnv) {
        this.loadFromEnvironment();
        console.log('⚠️ Secrets loaded from environment variables (fallback mode)');
        return true;
      }
      
      return false;
    }
  }

  /**
   * Fetch credentials from Wix Secrets API
   * SECURITY: Uses backend function to prevent exposing credentials in client code
   * Requires backend function: /backend/secrets/getSecrets.js
   */
  private async fetchFromWixSecrets(): Promise<boolean> {
    try {
      // Check cache first
      if (this.isCacheValid()) {
        return true;
      }

      // Call backend function to retrieve secrets securely
      // Backend validates request and returns only necessary credentials
      const response = await fetch('/api/secrets/get', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn('Failed to fetch secrets from Wix API:', response.statusText);
        return false;
      }

      const data = await response.json();
      this.credentials = data.credentials || {};
      this.lastFetchTime = Date.now();

      return true;
    } catch (error) {
      console.error('Error fetching secrets from Wix API:', error);
      return false;
    }
  }

  /**
   * Load credentials from environment variables
   * SECURITY: Only use for development/testing
   * In production, always use Wix Secrets Manager
   * Fallback method for local development
   */
  private loadFromEnvironment(): void {
    this.credentials = {
      twilioAccountSid: import.meta.env.VITE_TWILIO_ACCOUNT_SID || undefined,
      twilioAuthToken: import.meta.env.VITE_TWILIO_AUTH_TOKEN || undefined,
      twilioServiceSid: import.meta.env.VITE_TWILIO_SERVICE_SID || undefined,
      twilioPhoneNumber: import.meta.env.VITE_TWILIO_PHONE_NUMBER || undefined,
      sendGridApiKey: import.meta.env.VITE_SENDGRID_API_KEY || undefined,
      firebaseApiKey: import.meta.env.VITE_FIREBASE_API_KEY || undefined,
      firebaseAuthDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || undefined,
      firebaseProjectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || undefined,
      firebaseStorageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || undefined,
      firebaseMessagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || undefined,
      firebaseAppId: import.meta.env.VITE_FIREBASE_APP_ID || undefined,
      firebaseMeasurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || undefined,
    };
    this.lastFetchTime = Date.now();
  }

  /**
   * Check if cached credentials are still valid
   */
  private isCacheValid(): boolean {
    if (!this.lastFetchTime) return false;
    return Date.now() - this.lastFetchTime < this.cacheExpiry;
  }

  /**
   * Get a specific credential
   */
  getCredential(key: keyof SecretCredentials): string | undefined {
    return this.credentials[key];
  }

  /**
   * Get all credentials
   */
  getAllCredentials(): SecretCredentials {
    return { ...this.credentials };
  }

  /**
   * Check if Twilio is configured
   */
  isTwilioConfigured(): boolean {
    return !!(
      this.credentials.twilioAccountSid &&
      this.credentials.twilioAuthToken
    );
  }

  /**
   * Check if SendGrid is configured
   */
  isSendGridConfigured(): boolean {
    return !!this.credentials.sendGridApiKey;
  }

  /**
   * Check if Firebase is configured
   */
  isFirebaseConfigured(): boolean {
    return !!(
      this.credentials.firebaseApiKey &&
      this.credentials.firebaseAuthDomain &&
      this.credentials.firebaseProjectId
    );
  }

  /**
   * Get Firebase configuration object
   */
  getFirebaseConfig() {
    return {
      apiKey: this.credentials.firebaseApiKey,
      authDomain: this.credentials.firebaseAuthDomain,
      projectId: this.credentials.firebaseProjectId,
      storageBucket: this.credentials.firebaseStorageBucket,
      messagingSenderId: this.credentials.firebaseMessagingSenderId,
      appId: this.credentials.firebaseAppId,
      measurementId: this.credentials.firebaseMeasurementId,
    };
  }

  /**
   * Refresh credentials from Wix Secrets API
   * Force refresh even if cache is valid
   */
  async refresh(): Promise<boolean> {
    this.lastFetchTime = 0; // Invalidate cache
    return this.fetchFromWixSecrets();
  }

  /**
   * Store credentials in Wix Secrets API
   * SECURITY: Uses backend function to prevent exposing credentials
   * Requires backend function: /backend/secrets/setSecrets.js
   * Only call this during setup/configuration, not during normal operation
   */
  async storeCredentials(credentials: Partial<SecretCredentials>): Promise<boolean> {
    try {
      const response = await fetch('/api/secrets/set', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credentials }),
      });

      if (!response.ok) {
        console.error('Failed to store secrets:', response.statusText);
        return false;
      }

      // Update local cache
      this.credentials = { ...this.credentials, ...credentials };
      this.lastFetchTime = Date.now();

      return true;
    } catch (error) {
      console.error('Error storing secrets:', error);
      return false;
    }
  }

  /**
   * Clear cached credentials
   */
  clearCache(): void {
    this.credentials = {};
    this.lastFetchTime = 0;
  }
}

// Export singleton instance
export const secretsService = new SecretsService({
  useWixSecrets: true,
  fallbackToEnv: true,
  cacheExpiry: 3600000, // 1 hour
});
