
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { X, Save, Pencil, Image as ImageIcon } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

interface MobileEditProfileProps {
  onClose: () => void;
}

export function MobileEditProfile({ onClose }: MobileEditProfileProps) {
  const { user, updateUserProfile } = useAuth();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [bannerURL, setBannerURL] = useState('');
  const [bio, setBio] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setPhotoURL(user.photoURL || '');
      setBannerURL(user.bannerURL || '');
      setBio(user.bio || '');
    }
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateUserProfile({
        displayName,
        photoURL,
        bannerURL,
        bio,
      });
      toast({ title: 'Profile Saved!' });
      onClose();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="h-full flex flex-col bg-background">
      <header className="p-4 border-b flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X />
        </Button>
        <h1 className="text-lg font-semibold">Edit Profile</h1>
        <Button variant="ghost" size="icon" onClick={handleSave} disabled={isSaving}>
          <Save />
        </Button>
      </header>
      <ScrollArea className="flex-1">
        <div className="relative">
          <div className="h-32 bg-accent relative">
            {bannerURL && <Image src={bannerURL} alt="Banner" fill objectFit="cover" />}
            <Button variant="secondary" size="icon" className="absolute top-2 right-2 rounded-full size-8">
              <ImageIcon className="size-4" />
            </Button>
          </div>
          <div className="p-4">
            <div className="-mt-16">
              <Avatar className="size-24 border-4 border-background rounded-full relative">
                <AvatarImage src={photoURL || undefined} />
                <AvatarFallback>{displayName?.[0]}</AvatarFallback>
                 <Button variant="secondary" size="icon" className="absolute bottom-0 right-0 rounded-full size-8">
                    <Pencil className="size-4" />
                </Button>
              </Avatar>
            </div>
          </div>
        </div>
        <div className="p-4 pt-0 space-y-6">
            <div className="space-y-2">
                <Label htmlFor="display-name">Display Name</Label>
                <Input id="display-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
             <div className="space-y-2">
                <Label htmlFor="avatar-url">Avatar URL</Label>
                <Input id="avatar-url" value={photoURL} onChange={(e) => setPhotoURL(e.target.value)} />
            </div>
             <div className="space-y-2">
                <Label htmlFor="banner-url">Banner URL</Label>
                <Input id="banner-url" value={bannerURL} onChange={(e) => setBannerURL(e.target.value)} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="about-me">About Me</Label>
                <Textarea id="about-me" value={bio} onChange={(e) => setBio(e.target.value)} rows={4} />
            </div>
        </div>
      </ScrollArea>
    </div>
  );
}
