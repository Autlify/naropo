import {
  startAuthentication,
  startRegistration,
  browserSupportsWebAuthn,
} from '@simplewebauthn/browser';
import type {
  AuthenticationResponseJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/types';

/**
 * WebAuthn/Passkey utility functions
 */

export const isWebAuthnSupported = async (): Promise<boolean> => {
  try {
    return (
      typeof window !== 'undefined' &&
      window.PublicKeyCredential !== undefined &&
      navigator.credentials !== undefined
    );
  } catch {
    return false;
  }
}

/**
 * Check if user verification is supported
 */

export const isUserVerificationSupported = async (): Promise<boolean> => {
  try {
    return await browserSupportsWebAuthn();
  } catch {
    return false;
  }
}

/**
 * Detect authenticator capabilities
 */
export const detectAuthenticatorCapabilities = async (): Promise<
  {
    isPlatform: boolean;
    isCrossPlatform: boolean;
    supportsUserVerification: boolean;
    deviceType: 'platform' | 'cross-platform' | 'both' | 'none';
    description: string;
  }> => {
  const isSupported = await isWebAuthnSupported();
  const hasUserVerification = await isUserVerificationSupported();

  if (!isSupported) {
    return {
      isPlatform: false,
      isCrossPlatform: false,
      supportsUserVerification: false,
      deviceType: 'none',
      description: 'WebAuthn not supported on this device',
    };
  }

  const userAgent = navigator.userAgent.toLowerCase();
  const isPlatform =
    /iphone|ipad|mac|windows/.test(userAgent) && hasUserVerification;
  const isCrossPlatform = true; // Hardware keys always work

  let deviceType: 'platform' | 'cross-platform' | 'both' | 'none' = 'none';
  let description = '';

  if (isPlatform && isCrossPlatform) {
    deviceType = 'both';
    description = getDeviceDescription();
  } else if (isPlatform) {
    deviceType = 'platform';
    description = getDeviceDescription();
  } else if (isCrossPlatform) {
    deviceType = 'cross-platform';
    description = 'Security keys (USB, NFC)';
  }

  return {
    isPlatform,
    isCrossPlatform,
    supportsUserVerification: hasUserVerification,
    deviceType,
    description,
  };
}

/**
 * Get human-readable device description
 */
export const getDeviceDescription = (): string => {
  const userAgent = navigator.userAgent.toLowerCase();

  if (/iphone/.test(userAgent)) return 'Face ID & Touch ID';
  if (/ipad/.test(userAgent)) return 'Face ID & Touch ID';
  if (/mac/.test(userAgent)) return 'Face ID & Touch ID';
  if (/windows/.test(userAgent)) return 'Windows Hello';
  if (/android/.test(userAgent)) return 'Biometric Authentication';
  if (/linux/.test(userAgent)) return 'Linux Authentication';

  return 'Device Authentication';
}

/**
 * Start passkey registration
 */
export const registerPasskey = async (
  userId: string,
  userName: string,
  userEmail: string,
  passkeyName: string = 'My Passkey'
): Promise<RegistrationResponseJSON> => {
  try {
    // Get registration options from server
    const optionsResponse = await fetch('/api/auth/passkey', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'register', email: userEmail, userName }),
    });

    if (!optionsResponse.ok) throw new Error('Failed to get registration options');
    const { options, token } = await optionsResponse.json();

    // Start registration with device
    const attResp = await startRegistration(options);

    // Verify with server
    const verifyResponse = await fetch('/api/auth/passkey/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'register',
        email: userEmail,
        token,
        credential: attResp,
        deviceName: passkeyName,
      }),
    });

    if (!verifyResponse.ok) throw new Error('Failed to verify passkey');
    const result = await verifyResponse.json();

    return result;
  } catch (error) {
    console.error('Passkey registration failed:', error);
    throw error;
  }
}

/**
 * Start passkey authentication
 */
export const authenticateWithPasskey = async (email: string): Promise<AuthenticationResponseJSON> => {
  try {
    // Get authentication options from server
    const optionsResponse = await fetch('/api/auth/passkey', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'signin', email }),
    });

    if (!optionsResponse.ok) throw new Error('Failed to get authentication options');
    const { options } = await optionsResponse.json();

    // Start authentication with device
    const assertionResp = await startAuthentication(options);

    // Verify with server
    const verifyResponse = await fetch('/api/auth/passkey/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'signin', email, credential: assertionResp }),
    });

    if (!verifyResponse.ok) throw new Error('Authentication failed');
    const result = await verifyResponse.json();

    return result;
  } catch (error) {
    console.error('Passkey authentication failed:', error);
    throw error;
  }
}

/**
 * Get device icon based on capabilities
 */
export const getAuthenticatorIcon = (
  deviceType: 'platform' | 'cross-platform' | 'both' | 'none'
): string => {
  const userAgent = navigator.userAgent.toLowerCase();

  switch (deviceType) {
    case 'both':
      if (/iphone|ipad|mac/.test(userAgent)) return '🍎';
      if (/windows/.test(userAgent)) return '🪟';
      if (/android/.test(userAgent)) return '🤖';
      return '📱';
    case 'platform':
      if (/iphone|ipad|mac/.test(userAgent)) return '🍎';
      if (/windows/.test(userAgent)) return '🪟';
      return '📱';
    case 'cross-platform':
      return '🔐';
    default:
      return '❌';
  }
}
