
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

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
        await updateUserProfile({ displayName });
        toast({ title: 'Success', description: 'Your display name has been updated.' });
    } catch(e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
        setIsSaving(false);
    }
  };

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

  const hasChanges = user.displayName !== displayName;

  return (
    <div className="space-y-6">
        <div>
            <h2 className="text-2xl font-bold">My Account</h2>
        </div>
        <div className="relative rounded-lg overflow-hidden border bg-secondary/30">
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
                        <p className="text-sm text-muted-foreground">@{user.username}</p>
                     </div>
                </div>
            </div>
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle>Account Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="display-name">Display Name</Label>
                    <Input id="display-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label>Username</Label>
                    <Input value={user.username} disabled />
                    <CardDescription>Usernames can only be changed once a month. (This UI is a placeholder)</CardDescription>
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
            {hasChanges && (
                <CardFooter>
                    <div className="p-2 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-md flex items-center justify-between w-full">
                         <p className="text-sm">You have unsaved changes.</p>
                         <div>
                            <Button size="sm" variant="ghost" onClick={() => setDisplayName(user.displayName)}>Reset</Button>
                            <Button size="sm" onClick={handleSave} disabled={isSaving}>Save</Button>
                         </div>
                    </div>
                </CardFooter>
            )}
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Password and Authentication</CardTitle>
            </CardHeader>
             <CardContent>
                 <Button onClick={handlePasswordReset}>Change Password</Button>
            </CardContent>
        </Card>
    </div>
  );
}
