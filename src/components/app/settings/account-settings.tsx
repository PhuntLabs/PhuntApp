
'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Camera, MailWarning, User, Save } from 'lucide-react';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';

export function AccountSettings() {
  const { user, updateUserProfile, uploadFile, sendPasswordReset } = useAuth();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [bannerURL, setBannerURL] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const pfpInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setPhotoURL(user.photoURL || null);
      setBannerURL(user.bannerURL || null);
    }
  }, [user]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
        const downloadURL = await uploadFile(file, type === 'avatar' ? 'avatars' : 'banners');
        if (type === 'avatar') {
            setPhotoURL(downloadURL);
        } else {
            setBannerURL(downloadURL);
        }
        toast({ title: "Image uploaded!", description: "Click 'Save Changes' to apply." });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Upload Failed', description: error.message });
    }
  };
  
  const handleSave = async () => {
    setIsSaving(true);
    try {
        await updateUserProfile({ displayName, photoURL, bannerURL });
        toast({ title: 'Profile Updated', description: 'Your account details have been saved.' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
    } finally {
        setIsSaving(false);
    }
  }

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
        <p className="text-muted-foreground">Manage your account settings.</p>
      </div>

      <Card>
        <CardHeader className="p-0">
          <div className="relative h-28 w-full bg-accent rounded-t-lg">
            {bannerURL && (
                <Image src={bannerURL} alt="User banner" fill style={{ objectFit: 'cover' }} className="rounded-t-lg" />
            )}
             <button onClick={() => bannerInputRef.current?.click()} className="absolute bottom-2 right-2 bg-background/80 hover:bg-background text-foreground text-xs font-semibold py-1 px-2 rounded-md flex items-center gap-2 transition-colors">
                <Camera className="size-4"/> Change Banner
            </button>
            <input
                type="file"
                ref={bannerInputRef}
                onChange={(e) => handleFileChange(e, 'banner')}
                className="hidden"
                accept="image/png, image/jpeg, image/gif"
            />
          </div>
          <div className="flex items-end -mt-12 px-6">
            <div className="relative">
                <Avatar className="size-24 border-4 border-card rounded-full">
                    <AvatarImage src={photoURL || undefined} />
                    <AvatarFallback className="text-3xl">{displayName?.[0]}</AvatarFallback>
                </Avatar>
                 <button onClick={() => pfpInputRef.current?.click()} className="absolute bottom-1 right-1 bg-background/80 hover:bg-background rounded-full p-1.5 flex items-center justify-center transition-colors">
                    <Camera className="size-4 text-foreground"/>
                 </button>
                 <input
                    type="file"
                    ref={pfpInputRef}
                    onChange={(e) => handleFileChange(e, 'avatar')}
                    className="hidden"
                    accept="image/png, image/jpeg, image/gif"
                 />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
             <div className="space-y-1.5">
                <Label htmlFor="displayName">Username</Label>
                <Input 
                    id="displayName" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="max-w-xs"
                />
            </div>
             <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input 
                    id="email" 
                    value={user.email || ''}
                    disabled
                    className="max-w-xs"
                />
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/50 border-t py-3 px-6 flex justify-end">
            <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
        </CardFooter>
      </Card>
      
      <Separator/>

      <Card className="border-destructive/50">
        <CardHeader>
            <CardTitle>Password and Authentication</CardTitle>
        </CardHeader>
        <CardContent>
            <Button variant="secondary" onClick={handlePasswordReset}>
                <MailWarning className="mr-2 size-4"/>
                Send Password Reset Email
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
