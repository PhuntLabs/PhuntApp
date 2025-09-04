'use client';

import { User } from 'firebase/auth';
import { LogOut, Settings, Save } from 'lucide-react';
import Image from 'next/image';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { useState, useEffect } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useAuth } from '@/hooks/use-auth';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { updateProfile } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '../ui/textarea';

interface UserNavProps {
    user: User | null;
    logout: () => void;
}

export function UserNav({ user: authUser, logout }: UserNavProps) {
  const { user, setUser } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [bannerURL, setBannerURL] = useState((user as any)?.bannerURL || '');
  const [bio, setBio] = useState((user as any)?.bio || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    // When the popover opens, sync state with the latest user object
    if (isPopoverOpen && user) {
        setDisplayName(user.displayName || '');
        setPhotoURL(user.photoURL || '');
        setBannerURL((user as any).bannerURL || '');
        setBio((user as any).bio || '');
    }
  }, [isPopoverOpen, user]);
  
  if (!user) return null;

  const handleProfileUpdate = async () => {
    if (!user) return;
    try {
        await updateProfile(user, { displayName, photoURL });
        
        const userRef = doc(db, 'users', user.uid);
        
        await setDoc(userRef, { displayName, photoURL, bannerURL, bio }, { merge: true });

        const updatedUser = { ...user, displayName, photoURL, bannerURL, bio };
        setUser(updatedUser);

        toast({
            title: 'Profile Updated',
            description: 'Your changes have been saved successfully.',
        });
        setIsEditing(false);
    } catch(error: any) {
        toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: error.message,
        });
    }
  }

  const handleCancel = () => {
    // Reset fields to current user state
    setDisplayName(user.displayName || '');
    setPhotoURL(user.photoURL || '');
    setBannerURL((user as any).bannerURL || '');
    setBio((user as any).bio || '');
    setIsEditing(false);
  }

  return (
    <Popover open={isPopoverOpen} onOpenChange={(open) => {
      setIsPopoverOpen(open);
      if (!open) {
        setIsEditing(false); // Reset edit mode on close
      }
    }}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-2 p-2 hover:bg-sidebar-accent rounded-md cursor-pointer transition-colors w-full text-left">
            <Avatar className="size-8">
              <AvatarImage src={user.photoURL || undefined} />
              <AvatarFallback>{user.displayName?.[0].toUpperCase() || user.email?.[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-semibold truncate">{user.displayName || user.email}</span>
            </div>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 mb-2" side="top" align="start">
        <div className="relative h-20 bg-accent rounded-t-lg -mx-4 -mt-4">
            {bannerURL && (
                <Image src={bannerURL} alt="User banner" fill style={{ objectFit: 'cover' }} className="rounded-t-lg" />
            )}
            <Avatar className="size-20 absolute top-10 left-4 border-4 border-popover">
              <AvatarImage src={user.photoURL || undefined} />
              <AvatarFallback className="text-2xl">{user.displayName?.[0].toUpperCase() || user.email?.[0].toUpperCase()}</AvatarFallback>
            </Avatar>
        </div>
        <div className="pt-12">
           {!isEditing ? (
             <>
                <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>Edit Profile</Button>
                </div>
                <h3 className="text-xl font-bold">{displayName}</h3>
                <p className="text-sm text-muted-foreground -mt-1">{user.email}</p>
                <Separator className="my-2" />
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{bio || 'No bio yet.'}</p>
             </>
           ) : (
             <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="photoURL">Profile Picture URL</Label>
                    <Input id="photoURL" value={photoURL} onChange={(e) => setPhotoURL(e.target.value)} placeholder="https://example.com/image.png"/>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="bannerURL">Banner URL</Label>
                    <Input id="bannerURL" value={bannerURL} onChange={(e) => setBannerURL(e.target.value)} placeholder="https://example.com/banner.gif"/>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us about yourself..."/>
                </div>
                 <div className="flex justify-end gap-2 mt-4">
                    <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
                    <Button onClick={handleProfileUpdate}>
                        <Save className="mr-2 h-4 w-4" />
                        <span>Save</span>
                    </Button>
                 </div>
             </div>
           )}
           
           {/* Actions are always visible outside of edit mode */}
           {!isEditing && (
            <>
              <Separator className="my-4" />
              <div className="flex flex-col gap-1">
                  <Button variant="ghost" className="justify-start" onClick={() => setIsEditing(true)}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Edit Profile & Settings</span>
                  </Button>
                  <Button variant="ghost" onClick={() => logout()} className="justify-start text-red-500 hover:text-red-500 hover:bg-red-500/10">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                  </Button>
              </div>
            </>
           )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
