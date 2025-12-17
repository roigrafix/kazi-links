/**
 * Google OAuth Service
 * Handles Google Sign-In authentication flow
 */

interface GoogleCredentialResponse {
  credential: string;
  clientId: string;
  select_by: string;
}

interface DecodedToken {
  iss: string;
  azp: string;
  aud: string;
  sub: string;
  email: string;
  email_verified: boolean;
  at_hash: string;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
  locale: string;
  iat: number;
  exp: number;
}

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  givenName: string;
  familyName: string;
  emailVerified: boolean;
  token: string;
}

let googleInitPromise: Promise<boolean> | null = null;

/**
 * Initialize Google OAuth SDK
 * This should be called once when the app loads
 */
export const initializeGoogleOAuth = (): Promise<boolean> => {
  // Return cached promise if already initializing
  if (googleInitPromise) {
    return googleInitPromise;
  }

  googleInitPromise = new Promise((resolve) => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    
    if (!clientId) {
      console.error('Google Client ID is not set. Please add VITE_GOOGLE_CLIENT_ID to your .env.local file');
      resolve(false);
      return;
    }

    // Check if script is already loaded
    if ((window as any).google?.accounts?.id) {
      resolve(true);
      return;
    }

    // Load the Google Identity Services library
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      // Initialize Google Sign-In
      const google = (window as any).google;
      if (google?.accounts?.id) {
        google.accounts.id.initialize({
          client_id: clientId,
          callback: (window as any).handleGoogleSignInCallback,
        });
        resolve(true);
      } else {
        resolve(false);
      }
    };

    script.onerror = () => {
      console.error('Failed to load Google Identity Services library');
      resolve(false);
    };

    document.head.appendChild(script);
  });

  return googleInitPromise;
};

/**
 * Decode JWT token (basic implementation)
 * Note: In production, you should validate this token on your backend
 */
export const decodeToken = (token: string): DecodedToken | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};

/**
 * Handle Google Sign-In response
 * @param response - The credential response from Google
 * @returns Decoded user information
 */
export const handleGoogleSignInResponse = (response: GoogleCredentialResponse): GoogleUser => {
  const decodedToken = decodeToken(response.credential);
  
  if (!decodedToken) {
    throw new Error('Failed to decode Google token');
  }

  return {
    id: decodedToken.sub,
    email: decodedToken.email,
    name: decodedToken.name,
    picture: decodedToken.picture,
    givenName: decodedToken.given_name,
    familyName: decodedToken.family_name,
    emailVerified: decodedToken.email_verified,
    token: response.credential,
  };
};

/**
 * Render Google Sign-In button
 * @param containerId - The ID of the container element
 */
export const renderGoogleSignInButton = (containerId: string) => {
  const google = (window as any).google;
  
  if (!google?.accounts?.id) {
    console.error('Google Sign-In is not initialized');
    return false;
  }

  try {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container with ID "${containerId}" not found`);
      return false;
    }

    google.accounts.id.renderButton(container, {
      type: 'standard',
      size: 'large',
      text: 'signin_with',
      locale: 'en_US',
    });

    return true;
  } catch (error) {
    console.error('Failed to render Google Sign-In button:', error);
    return false;
  }
};

/**
 * Trigger Google Sign-In prompt (One Tap)
 */
export const triggerGoogleSignInPrompt = () => {
  const google = (window as any).google;
  
  if (!google?.accounts?.id) {
    console.error('Google Sign-In is not initialized');
    return;
  }

  try {
    google.accounts.id.prompt((notification: any) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        console.log('One Tap UI not displayed');
      }
    });
  } catch (error) {
    console.error('Failed to trigger Google Sign-In prompt:', error);
  }
};

/**
 * Validate token on backend (recommended for production)
 * This should be implemented in your backend API
 */
export const validateTokenOnBackend = async (token: string) => {
  try {
    // This is a placeholder - implement this in your backend
    // Example:
    // const response = await fetch('/api/auth/google/verify', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ token }),
    // });
    // return await response.json();
    
    console.warn('Token validation on backend not implemented. Please implement this for production.');
    return { valid: true };
  } catch (error) {
    console.error('Failed to validate token on backend:', error);
    throw error;
  }
};

/**
 * Sign out from Google
 */
export const signOutFromGoogle = () => {
  const google = (window as any).google;
  if (google?.accounts?.id) {
    google.accounts.id.disableAutoSelect();
  }
};
