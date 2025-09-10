
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { MailWarning, User, Save, Sword, Zap, Car, Bike, Tag, Edit, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function AccountSettings() {
  const { user, updateUserProfile, sendPasswordReset } = useAuth();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
    }
  }, [user]);

  const handlePasswordReset = async () => {
    try {
      await sendPasswordReset();
      toast({
        title: 'Password Reset Email Sent',
        description: 'Check your inbox for instructions to reset your password.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to Send Email',
        description: error.message,
      });
    }
  };
  
  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
        <div>
            <h2 className="text-2xl font-bold">My Account</h2>
        </div>
        <div className="relative rounded-lg overflow-hidden border">
            <div className="h-24 bg-accent">
                {user.bannerURL && <Image src={user.bannerURL} alt="Banner" fill className="object-cover"/>}
            </div>
            <div className="p-4 bg-background/80 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                     <div className="-mt-16">
                        <Avatar className="size-24 border-4 border-background">
                            <AvatarImage src={user.photoURL || undefined} />
                            <AvatarFallback className="text-3xl">{displayName?.[0]}</AvatarFallback>
                        </Avatar>
                     </div>
                     <div>
                        <h3 className="text-xl font-bold">{displayName}</h3>
                        <p className="text-sm text-muted-foreground">@{user.displayName_lowercase}</p>
                     </div>
                </div>
            </div>
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle>Account Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground">Username</p>
                        <p>{user.displayName}</p>
                    </div>
                     <Button variant="secondary" disabled>Edit</Button>
                </div>
                 <Separator />
                 <div className="flex justify-between items-center">
                    <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground">Email</p>
                        <p>{user.email}</p>
                    </div>
                     <Button variant="secondary" disabled>Edit</Button>
                </div>
                  <Separator />
                 <div className="flex justify-between items-center">
                    <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground">Phone Number</p>
                        <p className="text-muted-foreground italic">You haven't added a phone number.</p>
                    </div>
                     <Button variant="secondary">Add</Button>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
