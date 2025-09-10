
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { AvatarEffect, ProfileEffect } from '@/lib/types';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { MobileProfileEditor } from './mobile/mobile-profile-editor';
import { Check, Edit, Palette, Sparkles, X } from 'lucide-react';


export function ProfileSettings() {
  const { user, updateUserProfile } = useAuth();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [bannerURL, setBannerURL] = useState('');
  const [bio, setBio] = useState('');
  const [profileColor, setProfileColor] = useState<string>('#000000');
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setPhotoURL(user.photoURL || '');
      setBannerURL(user.bannerURL || '');
      setBio(user.bio || '');
      setProfileColor(user.profileColor || '#1f2937'); // default to a dark gray
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
          profileColor,
        });
        toast({ title: 'Profile Updated', description: 'Your changes have been saved.' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
    } finally {
        setIsSaving(false);
    }
  }

  if (!user) return null;

  const hasChanges = displayName !== user.displayName ||
                     photoURL !== user.photoURL ||
                     bannerURL !== user.bannerURL ||
                     bio !== user.bio ||
                     profileColor !== user.profileColor;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
            <h2 className="text-2xl font-bold">Profiles</h2>
            <p className="text-muted-foreground">Customize your user profile.</p>
        </div>
         <Dialog>
            <DialogTrigger asChild>
                <Button variant="secondary"><Sparkles className="mr-2"/>Customize</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl h-[90vh]">
                <MobileProfileEditor />
            </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
           <div>
             <Label className="text-xs font-bold uppercase text-muted-foreground">Avatar</Label>
             <div className="flex items-center gap-4 mt-2">
                <Button>Change Avatar</Button>
                <Button variant="ghost">Remove Avatar</Button>
             </div>
           </div>
           <div>
             <Label className="text-xs font-bold uppercase text-muted-foreground">Profile Color</Label>
             <div className="flex items-center gap-4 mt-2">
                <div className="p-4 border rounded-md" style={{backgroundColor: '#000000'}}>
                    <Check className="text-white"/>
                </div>
                <div className="relative">
                    <Input 
                        type="color" 
                        value={profileColor} 
                        onChange={(e) => setProfileColor(e.target.value)}
                        className="w-16 h-10 p-1 bg-card border rounded-md cursor-pointer"
                    />
                    <Edit className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-4 text-white pointer-events-none"/>
                </div>
             </div>
           </div>
            <div>
             <Label className="text-xs font-bold uppercase text-muted-foreground">Profile Banner</Label>
             <p className="text-xs text-muted-foreground mt-1">We recommend an image of at least 600x240.</p>
             <div className="flex items-center gap-4 mt-2">
                <Button>Change Banner</Button>
                <Button variant="ghost">Remove Banner</Button>
             </div>
           </div>
            <div>
             <Label className="text-xs font-bold uppercase text-muted-foreground">About Me</Label>
             <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="mt-2"
                rows={5}
                maxLength={190}
             />
             <p className="text-xs text-right text-muted-foreground mt-1">{bio.length}/190</p>
           </div>
        </div>
        <div className="space-y-4">
             <Label className="text-xs font-bold uppercase text-muted-foreground">Preview</Label>
             <div className="rounded-lg overflow-hidden border" style={{ backgroundColor: profileColor }}>
                <div className="h-24 bg-accent relative">
                     {bannerURL && <Image src={bannerURL} alt="Banner Preview" fill className="object-cover"/>}
                </div>
                <div className="p-4">
                    <div className="flex items-end -mt-12">
                         <Avatar className="size-20 border-4" style={{borderColor: profileColor}}>
                            <AvatarImage src={photoURL || undefined} />
                            <AvatarFallback>{displayName?.[0]}</AvatarFallback>
                        </Avatar>
                    </div>
                    <div className="mt-2 space-y-1">
                        <h3 className="text-lg font-bold text-white">{displayName}</h3>
                        <p className="text-sm text-white/80">{user.displayName_lowercase}</p>
                    </div>
                    <Separator className="my-3 bg-white/20"/>
                     <div>
                        <h4 className="text-xs font-bold uppercase text-white/80 mb-1">About Me</h4>
                        <p className="text-sm text-white/80 whitespace-pre-wrap h-auto max-h-24 overflow-y-auto">{bio}</p>
                    </div>
                </div>
             </div>
        </div>
      </div>
       {hasChanges && (
         <div className="fixed bottom-4 right-1/2 translate-x-1/2 w-auto bg-background/80 backdrop-blur-sm p-2 rounded-full flex items-center gap-4 border shadow-lg z-50">
            <p className="text-sm px-2">You have unsaved changes!</p>
            <Button size="sm" variant="ghost" onClick={() => window.location.reload()}>Reset</Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
        </div>
      )}
    </div>
  );
}
