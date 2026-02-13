'use client';

import React, { useState } from 'react';
import { registerPasskey } from '@/lib/core/auth/webauthn';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, AlertCircle, Plus } from 'lucide-react';
import clsx from 'clsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PasskeyRegistrationProps {
  userId: string;
  userName: string;
  userEmail: string;
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
}

type RegistrationStep = 'idle' | 'name' | 'registering' | 'success' | 'error';

export function PasskeyRegistration({
  userId,
  userName,
  userEmail,
  onSuccess,
  onError,
}: PasskeyRegistrationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<RegistrationStep>('idle');
  const [passkeyName, setPasskeyName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleStartRegistration = () => {
    setIsOpen(true);
    setStep('name');
    setError(null);
  };

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passkeyName.trim()) {
      setError('Please enter a name for this passkey');
      return;
    }

    setStep('registering');
    setError(null);

    try {
      const result = await registerPasskey(
        userId,
        userName,
        userEmail,
        passkeyName
      );

      setStep('success');
      onSuccess?.(result);

      // Auto-close after 2 seconds
      setTimeout(() => {
        setIsOpen(false);
        setStep('idle');
        setPasskeyName('');
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
      setStep('error');
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    }
  };

  return (
    <>
      <Button
        onClick={handleStartRegistration}
        className="gap-2"
        variant="outline"
      >
        <Plus className="h-4 w-4" />
        Add Passkey
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          {/* Idle / Name Input */}
          {step === 'name' && (
            <>
              <DialogHeader>
                <DialogTitle>Create a New Passkey</DialogTitle>
                <DialogDescription>
                  Give your passkey a name so you can identify it later
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleNameSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="passkey-name">Passkey Name</Label>
                  <Input
                    id="passkey-name"
                    placeholder="e.g., My iPhone, Work MacBook"
                    value={passkeyName}
                    onChange={(e) => setPasskeyName(e.target.value)}
                    autoFocus
                  />
                  <p className="text-xs text-fg-secondary">
                    Use a descriptive name to help you remember which device this is
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsOpen(false);
                      setStep('idle');
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    Continue
                  </Button>
                </div>
              </form>
            </>
          )}

          {/* Registering State */}
          {step === 'registering' && (
            <div className="space-y-4 py-8 text-center">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
              <div>
                <h3 className="font-semibold text-fg-primary">Confirming with {passkeyName}</h3>
                <p className="mt-2 text-sm text-fg-secondary">
                  Verify your identity using Face ID, Touch ID, or your security key
                </p>
              </div>
            </div>
          )}

          {/* Success State */}
          {step === 'success' && (
            <div className="space-y-4 py-8">
              <div className="flex justify-center">
                <div className="rounded-full bg-green-100 p-3 dark:bg-green-950">
                  <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-fg-primary">Passkey Created</h3>
                <p className="mt-2 text-sm text-fg-secondary">
                  {passkeyName} is now ready to use for signing in
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {step === 'error' && (
            <>
              <div className="space-y-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
                  <div>
                    <p className="font-medium text-red-900 dark:text-red-100">Registration Failed</p>
                    <p className="mt-1 text-sm text-red-800 dark:text-red-200">{error}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep('name');
                    setError(null);
                  }}
                  className="flex-1"
                >
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsOpen(false);
                    setStep('idle');
                  }}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
