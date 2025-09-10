
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
import { MessageSquare } from 'lucide-react';

export default function SignupPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signup } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signup(email, password, username);
      router.push('/channels/me');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Sign-up Failed',
        description: error.message,
      });
    }
  };

  return (
    <Card className="w-full max-w-lg bg-card/80 backdrop-blur-md border-white/10 mx-auto">
       <CardContent className="p-8 md:p-12">
         <div className="text-center mb-8">
            <CardTitle className="text-3xl">Create an account</CardTitle>
         </div>
        <form onSubmit={handleSubmit} className="space-y-4">
           <div className="space-y-2">
            <Label htmlFor="username" className="text-xs font-bold uppercase text-muted-foreground">Username</Label>
            <Input
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-secondary/50 border-border"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-bold uppercase text-muted-foreground">Email</Label>
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
            <Label htmlFor="password" className="text-xs font-bold uppercase text-muted-foreground">Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              className="bg-secondary/50 border-border"
            />
          </div>
          <Button type="submit" className="w-full h-11 text-base">
            Continue
          </Button>
           <div className="text-sm text-muted-foreground pt-2">
            <Link href="/login" className="text-primary hover:underline">
              Already have an account?
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
