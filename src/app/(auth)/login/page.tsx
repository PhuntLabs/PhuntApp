
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import Image from 'next/image';
import { MessageSquare } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      router.push('/channels/me');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.message,
      });
    }
  };

  return (
    <Card className="w-full max-w-4xl bg-card/80 backdrop-blur-md border-white/10 mx-auto">
      <CardContent className="p-0 grid grid-cols-1 md:grid-cols-2">
        <div className="p-8 md:p-12">
           <div className="text-center mb-8">
             <MessageSquare className="mx-auto size-12 text-primary mb-4"/>
            <CardTitle className="text-3xl">Welcome Back!</CardTitle>
            <CardDescription className="text-muted-foreground mt-2">We're so excited to see you again!</CardDescription>
           </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold uppercase text-muted-foreground">Email or Phone Number</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-secondary/50 border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password"  className="text-xs font-bold uppercase text-muted-foreground">Password</Label>
              <div className="relative">
                <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-secondary/50 border-border"
                />
                <Button type="button" variant="link" size="sm" className="absolute right-2 top-1/2 -translate-y-1/2 h-auto" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? 'Hide' : 'Show'}
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                    <Checkbox id="remember-me" />
                    <Label htmlFor="remember-me">Remember me</Label>
                </div>
                <Link href="#" className="text-primary hover:underline">
                 Reset Password
                </Link>
            </div>
            <Button type="submit" className="w-full h-11 text-base">
              Login
            </Button>
            <div className="text-sm text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="text-primary hover:underline">
                    Register
                </Link>
            </div>
          </form>
        </div>
        <div className="hidden md:flex flex-col items-center justify-center p-12 bg-secondary/30 rounded-r-lg">
            <div className="text-center">
                 <h3 className="text-xl font-semibold">Login with QR Code</h3>
                 <p className="text-muted-foreground mt-1">Scan this with the Phunt mobile app to log in instantly.</p>
                 <div className="p-2 bg-white rounded-lg mt-4 inline-block">
                    <Image src="/qr-code.png" alt="QR Code" width={176} height={176} data-ai-hint="qr code"/>
                </div>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
