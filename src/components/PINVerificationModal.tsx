import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Lock, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { validatePIN } from '@/lib/pin-generator';

interface PINVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (pin: string) => Promise<boolean>;
  bookingId: string;
  clientName: string;
}

export default function PINVerificationModal({
  isOpen,
  onClose,
  onVerify,
  bookingId,
  clientName
}: PINVerificationModalProps) {
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleVerify = async () => {
    if (!pin || pin.length !== 6) {
      setErrorMessage('Please enter a valid 6-digit PIN');
      return;
    }

    if (!validatePIN(pin)) {
      setErrorMessage('PIN must contain only digits');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const isValid = await onVerify(pin);
      if (isValid) {
        setVerificationStatus('success');
        setTimeout(() => {
          setPin('');
          setVerificationStatus('idle');
          onClose();
        }, 2000);
      } else {
        setVerificationStatus('error');
        setErrorMessage('Invalid PIN. Please check and try again.');
      }
    } catch (error) {
      setVerificationStatus('error');
      setErrorMessage('An error occurred while verifying the PIN. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setPin('');
    setVerificationStatus('idle');
    setErrorMessage('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-secondary text-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-purple-600" />
            Verify Service PIN
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Enter the PIN provided by {clientName} to activate the service for booking {bookingId}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {verificationStatus === 'idle' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Enter 6-Digit PIN
                </label>
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setPin(value);
                    setErrorMessage('');
                  }}
                  placeholder="000000"
                  className="text-center text-2xl font-mono tracking-widest bg-white text-gray-900 border-gray-300"
                />
              </div>

              {errorMessage && (
                <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{errorMessage}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={handleClose}
                  variant="outline"
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleVerify}
                  disabled={isLoading || pin.length !== 6}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify PIN'
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {verificationStatus === 'success' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">PIN Verified!</h3>
              <p className="text-sm text-gray-600">
                Service has been activated successfully. You can now proceed with the service.
              </p>
            </motion.div>
          )}

          {verificationStatus === 'error' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6"
            >
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Verification Failed</h3>
              <p className="text-sm text-gray-600 mb-4">
                {errorMessage || 'The PIN you entered is incorrect. Please try again.'}
              </p>
              <Button
                onClick={() => {
                  setPin('');
                  setVerificationStatus('idle');
                  setErrorMessage('');
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Try Again
              </Button>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
