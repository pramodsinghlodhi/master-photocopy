'use client';

import { useState } from 'react';
import { signInWithPhoneNumber, RecaptchaVerifier, ConfirmationResult } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Phone, Shield } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
    confirmationResult: ConfirmationResult;
  }
}

interface AgentOTPLoginProps {
  onLoginSuccess: (user: any) => void;
}

export function AgentOTPLogin({ onLoginSuccess }: AgentOTPLoginProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth!, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved
        },
        'expired-callback': () => {
          // Response expired
          toast({
            title: "reCAPTCHA Expired",
            description: "Please try again.",
            variant: "destructive"
          });
        }
      });
    }
  };

  const sendOTP = async () => {
    try {
      setLoading(true);
      
      if (!phoneNumber) {
        toast({
          title: "Phone number required",
          description: "Please enter a valid phone number.",
          variant: "destructive"
        });
        return;
      }

      // Format phone number
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
      
      setupRecaptcha();
      const result = await signInWithPhoneNumber(auth!, formattedPhone, window.recaptchaVerifier);
      
      setConfirmationResult(result);
      setStep('otp');
      
      toast({
        title: "OTP Sent",
        description: "Please check your phone for the verification code."
      });
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send OTP. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    try {
      setLoading(true);
      
      if (!otp || !confirmationResult) {
        toast({
          title: "OTP required",
          description: "Please enter the verification code.",
          variant: "destructive"
        });
        return;
      }

      const result = await confirmationResult.confirm(otp);
      const user = result.user;
      
      toast({
        title: "Login Successful",
        description: "Welcome to the agent portal!"
      });
      
      onLoginSuccess(user);
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      toast({
        title: "Verification Failed",
        description: "Invalid OTP. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPhoneNumber('');
    setOtp('');
    setStep('phone');
    setConfirmationResult(null);
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = undefined as any;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 px-4 py-8">
      {/* Mobile Header */}
      <div className="text-center text-white mb-8 pt-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm mb-4">
          <Shield className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Agent Login</h1>
        <p className="text-blue-100 text-lg">
          {step === 'phone' 
            ? 'Enter your phone number to continue'
            : 'Enter the verification code'
          }
        </p>
      </div>

      {/* Login Card */}
      <div className="max-w-md mx-auto">
        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <CardContent className="p-8">
            {step === 'phone' ? (
              <div className="space-y-6">
                <div>
                  <label htmlFor="phone" className="block text-lg font-semibold text-gray-800 mb-3">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Phone className="h-6 w-6 text-blue-500" />
                    </div>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter phone number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="pl-12 h-14 text-lg border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                      disabled={loading}
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    Enter with country code (+91) or without for India
                  </p>
                </div>

                <Button
                  onClick={sendOTP}
                  disabled={loading || !phoneNumber}
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl shadow-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    'Send OTP'
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label htmlFor="otp" className="block text-lg font-semibold text-gray-800 mb-3">
                    Verification Code
                  </label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    disabled={loading}
                    className="text-center text-2xl tracking-widest h-16 border-2 border-gray-200 focus:border-blue-500 rounded-xl font-bold"
                  />
                  <p className="mt-2 text-sm text-gray-600 text-center">
                    Code sent to {phoneNumber}
                  </p>
                </div>

                <div className="space-y-4">
                  <Button
                    onClick={verifyOTP}
                    disabled={loading || otp.length !== 6}
                    className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-xl shadow-lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Verify & Login'
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={resetForm}
                    disabled={loading}
                    className="w-full h-12 text-base font-medium border-2 border-gray-300 rounded-xl hover:bg-gray-50"
                  >
                    Change Phone Number
                  </Button>
                </div>
              </div>
            )}

            {/* reCAPTCHA container */}
            <div id="recaptcha-container" className="mt-6"></div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Footer */}
      <div className="text-center text-white/80 mt-8 pb-8">
        <p className="text-sm">
          Secure delivery agent authentication
        </p>
      </div>
    </div>
  );
}
