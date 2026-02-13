'use client';

import React, { useState, useEffect } from 'react';
import { authenticateWithPasskey } from '@/lib/core/auth/webauthn';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, Fingerprint } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PasskeyAuthenticationProps {
  email: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  className?: string;
}

export function PasskeyAuthentication({
  email,
  onSuccess,
  onError,
  className,
}: PasskeyAuthenticationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleAuthenticate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await authenticateWithPasskey(email);

      onSuccess?.();
      // Redirect to dashboard or home
      router.push('/agency');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={className}>
      <Button
        onClick={handleAuthenticate}
        disabled={isLoading}
        size="lg"
        className="w-full gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Authenticating...
          </>
        ) : (
          <>
            <Fingerprint className="h-4 w-4" />
            Sign in with Passkey
          </>
        )}
      </Button>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950">
          <div className="flex gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
