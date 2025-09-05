'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import Image from "next/image";

export function SecuritySettings() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  const handleGenerate = async () => {
    setIsGenerating(true);
    // In a real app, you would make an API call to your backend here
    // to generate a TOTP secret and QR code.
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network latency
    
    // Placeholder data
    const fakeSecret = 'JBSWY3DPEHPK3PXP';
    const fakeQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=otpauth://totp/WhisperChat:user@example.com?secret=${fakeSecret}&issuer=WhisperChat`;
    
    setSecret(fakeSecret);
    setQrCode(fakeQrCodeUrl);
    setIsGenerating(false);
  };
  
  const handleVerify = async () => {
      setIsVerifying(true);
      // In a real app, you would send the verificationCode to your backend
      // to verify it against the secret.
      await new Promise(resolve => setTimeout(resolve, 1000));
      // On success, you'd probably show a success message and update the UI
      // On failure, show an error toast.
      setIsVerifying(false);
  }

  return (
    <div>
      <h2 className="text-2xl font-bold">Security</h2>
      <p className="text-muted-foreground">Manage your account's security settings.</p>

       <Card className="mt-6">
            <CardHeader>
                <CardTitle>Two-Factor Authentication (2FA)</CardTitle>
                <CardDescription>Add an extra layer of security to your account by requiring a second authentication step.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {!qrCode ? (
                    <div>
                        <p className="text-sm text-muted-foreground">
                            Generate a QR code to scan with an authenticator app like Google Authenticator, Authy, or 1Password.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col sm:flex-row gap-6 items-center">
                        <Image src={qrCode} alt="2FA QR Code" width={150} height={150} className="rounded-lg bg-white p-2" />
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
                 {!qrCode && (
                    <Button onClick={handleGenerate} disabled={isGenerating}>
                        {isGenerating && <Loader2 className="mr-2 size-4 animate-spin" />}
                        Generate QR Code
                    </Button>
                )}
            </CardFooter>
      </Card>
    </div>
  );
}
    