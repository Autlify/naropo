'use client';

import React, { useEffect, useState } from 'react';
import { detectAuthenticatorCapabilities, getDeviceDescription } from '@/lib/core/auth/webauthn';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

interface DeviceCapabilities {
  isPlatform: boolean;
  isCrossPlatform: boolean;
  supportsUserVerification: boolean;
  deviceType: 'platform' | 'cross-platform' | 'both' | 'none';
  description: string;
}

interface PasskeyDeviceDetectorProps {
  onCapabilitiesDetected?: (capabilities: DeviceCapabilities) => void;
  showDetails?: boolean;
}

export function PasskeyDeviceDetector({
  onCapabilitiesDetected,
  showDetails = true,
}: PasskeyDeviceDetectorProps) {
  const [capabilities, setCapabilities] = useState<DeviceCapabilities | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const detectCapabilities = async () => {
      try {
        const caps = await detectAuthenticatorCapabilities();
        setCapabilities(caps);
        onCapabilitiesDetected?.(caps);
      } catch (error) {
        console.error('Failed to detect capabilities:', error);
        setCapabilities({
          isPlatform: false,
          isCrossPlatform: false,
          supportsUserVerification: false,
          deviceType: 'none',
          description: 'Unable to detect device capabilities',
        });
      } finally {
        setLoading(false);
      }
    };

    detectCapabilities();
  }, [onCapabilitiesDetected]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-2">
        <Loader2 className="h-4 w-4 animate-spin text-fg-secondary" />
        <span className="text-sm text-fg-secondary">Detecting device capabilities...</span>
      </div>
    );
  }

  if (!capabilities || capabilities.deviceType === 'none') {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
          <div>
            <p className="font-medium text-red-900 dark:text-red-100">
              {capabilities?.description}
            </p>
            <p className="mt-1 text-sm text-red-800 dark:text-red-200">
              Passkeys require a compatible device. Please use a modern browser on a supported device.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Status Badge */}
      <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 dark:bg-green-950">
        <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" />
        <div>
          <p className="font-medium text-green-900 dark:text-green-100">Device Ready</p>
          <p className="text-sm text-green-800 dark:text-green-200">
            Your device supports biometric authentication
          </p>
        </div>
      </div>

      {/* Capabilities Details */}
      {showDetails && (
        <div className="rounded-lg border border-border/50 bg-muted/30 p-4 space-y-3">
          <div className="text-sm font-semibold text-fg-primary">Available Authentication Methods</div>
          
          <div className="space-y-2">
            {/* Platform Authenticator */}
            {capabilities.isPlatform && (
              <div className="flex items-center gap-3 rounded-md bg-white/50 p-2 dark:bg-muted/50">
                <div className="text-2xl">🍎</div>
                <div>
                  <p className="font-medium text-fg-primary">{getDeviceDescription()}</p>
                  <p className="text-xs text-fg-secondary">Built-in device authentication</p>
                </div>
              </div>
            )}

            {/* Cross-Platform Authenticator */}
            {capabilities.isCrossPlatform && (
              <div className="flex items-center gap-3 rounded-md bg-white/50 p-2 dark:bg-muted/50">
                <div className="text-2xl">🔐</div>
                <div>
                  <p className="font-medium text-fg-primary">Security Keys</p>
                  <p className="text-xs text-fg-secondary">USB, NFC, or Bluetooth keys</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* User Verification Status */}
      <div className="text-xs text-fg-secondary">
        {capabilities.supportsUserVerification ? (
          <span className="text-green-600 dark:text-green-400">✓ User verification supported</span>
        ) : (
          <span className="text-amber-600 dark:text-amber-400">⚠ Limited verification support</span>
        )}
      </div>
    </div>
  );
}
