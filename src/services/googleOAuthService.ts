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

/**
 * Initialize Google OAuth SDK
 * This should be called once when the app loads
 */
export const initializeGoogleOAuth = () => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  
  if (!clientId) {
    console.error('Google Client ID is not set. Please add VITE_GOOGLE_CLIENT_ID to your .env.local file');
    return false;
  }

  // Load the Google Identity Services library
  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);

  return true;
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
export const handleGoogleSignInResponse = (response: GoogleCredentialResponse) => {
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
