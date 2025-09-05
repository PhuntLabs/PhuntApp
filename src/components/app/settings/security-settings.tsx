'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

// A simple (and not cryptographically secure) way to generate a base32 secret for TOTP.
// In a real app, this should be done on a secure backend.
function generateRandomSecret() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let result = '';
    for (let i = 0; i < 16; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Dynamically import the TOTP library to avoid server-side rendering issues
const loadTotp = async () => {
  const { TOTP } = await import('otpauth');
  return TOTP;
};


export function SecuritySettings() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [isGenerating, setIsGenerating] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [totpInstance, setTotpInstance] = useState<any>(null);
  const [isEnabled, setIsEnabled] = useState(false); // You'd fetch this from user profile


  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
        const TOTP = await loadTotp();
        
        const newSecret = generateRandomSecret();
        const newTotp = new TOTP({
            issuer: "WhisperChat",
            label: user?.email || "User",
            algorithm: "SHA1",
            digits: 6,
            period: 30,
            secret: newSecret,
        });

        const qrCodeUrl = newTotp.toString();

        setSecret(newSecret);
        setQrCode(qrCodeUrl);
        setTotpInstance(newTotp);

    } catch (error) {
        console.error("Failed to generate TOTP", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not generate QR code.' });
    } finally {
        setIsGenerating(false);
    }
  };
  
  const handleVerify = async () => {
      setIsVerifying(true);
      try {
        if (!totpInstance) {
            throw new Error("TOTP instance not initialized.");
        }

        const delta = totpInstance.validate({ token: verificationCode, window: 1 });

        if (delta === null) {
            toast({ variant: 'destructive', title: 'Invalid Code', description: 'The verification code is incorrect. Please try again.' });
        } else {
            // In a real app, you would now save the encrypted secret to the user's profile
            // and set their 2FA status to enabled.
            toast({ title: 'Success!', description: 'Two-Factor Authentication has been enabled.' });
            setIsEnabled(true);
            setQrCode(''); // Clear the QR code after successful setup
            setSecret('');
            setVerificationCode('');
        }
    } catch (error: any) {
         toast({ variant: 'destructive', title: 'Verification Failed', description: error.message });
    } finally {
      setIsVerifying(false);
    }
  }

  const handleDisable = () => {
      // In a real app, you'd probably ask for a password or a 2FA code to disable it.
      setIsEnabled(false);
      toast({ title: '2FA Disabled', description: 'Two-Factor Authentication has been disabled.' });
  }

  return (
    <div>
      <h2 className="text-2xl font-bold">Security</h2>
      <p className="text-muted-foreground">Manage your account's security settings.</p>

       <Card className="mt-6">
            <CardHeader>
                <CardTitle>Two-Factor Authentication (2FA)</CardTitle>
                <CardDescription>
                    {isEnabled 
                        ? "2FA is currently enabled on your account."
                        : "Add an extra layer of security to your account by requiring a second authentication step."
                    }
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {isEnabled ? (
                    <p className="text-sm text-green-500 font-medium">
                        Your account is protected with two-factor authentication.
                    </p>
                ) : !qrCode ? (
                    <div>
                        <p className="text-sm text-muted-foreground">
                            Generate a QR code to scan with an authenticator app like Google Authenticator, Authy, or 1Password.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col sm:flex-row gap-6 items-center">
                        <Image src={qrCode} alt="2FA QR Code" width={160} height={160} className="rounded-lg bg-white p-2" />
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold">1. Scan the QR Code</h3>
                                <p className="text-sm text-muted-foreground">Use your authenticator app to scan this image.</p>
                            </div>
                             <div>
                                <h3 className="font-semibold">2. Enter Verification Code</h3>
                                <p className="text-sm text-muted-foreground">Enter the 6-digit code from your app to complete setup.</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <Input 
                                        placeholder="123456" 
                                        maxLength={6}
                                        value={verificationCode}
                                        onChange={(e) => setVerificationCode(e.target.value)}
                                        className="w-32"
                                        autoComplete="one-time-code"
                                    />
                                    <Button onClick={handleVerify} disabled={isVerifying || verificationCode.length < 6}>
                                        {isVerifying && <Loader2 className="mr-2 size-4 animate-spin" />}
                                        Verify & Enable
                                    </Button>
                                </div>
                            </div>
                             <div>
                                <h3 className="font-semibold">Can't scan?</h3>
                                <p className="text-sm text-muted-foreground">Manually enter this key into your authenticator app.</p>
                                <div className="mt-1 p-2 bg-muted rounded-md font-mono text-sm">
                                    {secret}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
            <CardFooter>
                 {!isEnabled && !qrCode && (
                    <Button onClick={handleGenerate} disabled={isGenerating}>
                        {isGenerating && <Loader2 className="mr-2 size-4 animate-spin" />}
                        Enable 2FA
                    </Button>
                )}
                {isEnabled && (
                     <Button onClick={handleDisable} variant="destructive">
                        Disable 2FA
                    </Button>
                )}
            </CardFooter>
      </Card>
    </div>
  );
}

    