'use client';

import { User } from 'firebase/auth';
import { LogOut, Settings, Save } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { useState } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useAuth } from '@/hooks/use-auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { updateProfile } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';


interface UserNavProps {
    user: User | null;
    logout: () => void;
}

export function UserNav({ user: authUser, logout }: UserNavProps) {
  const { user, setUser } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const { toast } = useToast();
  
  if (!user) return null;

  const handleProfileUpdate = async () => {
    if (!user) return;
    try {
        // Update Firebase Auth profile
        await updateProfile(user, { displayName, photoURL });
        
        // Update Firestore user document
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { displayName, photoURL });

        // Update local auth state
        setUser({...user, displayName, photoURL });

        toast({
            title: 'Profile Updated',
            description: 'Your changes have been saved successfully.',
        });
    } catch(error: any) {
        toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: error.message,
        });
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="flex items-center gap-2 p-2 hover:bg-sidebar-accent rounded-md cursor-pointer transition-colors">
            <Avatar className="size-8">
              <AvatarImage src={user.photoURL || undefined} />
              <AvatarFallback>{user.displayName?.[0].toUpperCase() || user.email?.[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col text-left group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-semibold truncate">{user.displayName || user.email}</span>
            </div>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md p-0">
        <div className="relative h-24 bg-primary/10">
            {/* Placeholder for banner image */}
        </div>
        <div className="p-6">
            <Avatar className="size-20 absolute top-12 left-6 border-4 border-card">
              <AvatarImage src={user.photoURL || undefined} />
              <AvatarFallback className="text-2xl">{user.displayName?.[0].toUpperCase() || user.email?.[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="pt-10">
                <DialogTitle className="text-2xl">{user.displayName}</DialogTitle>
                <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <Separator className="my-4" />
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="photoURL">Profile Picture URL</Label>
                    <Input id="photoURL" value={photoURL} onChange={(e) => setPhotoURL(e.target.value)} placeholder="https://example.com/image.png"/>
                </div>
            </div>
             <DialogFooter className="mt-6 gap-2">
                 <DialogClose asChild>
                    <Button variant="ghost">Cancel</Button>
                 </DialogClose>
                 <DialogClose asChild>
                    <Button onClick={handleProfileUpdate}>
                        <Save className="mr-2 h-4 w-4" />
                        <span>Save Changes</span>
                    </Button>
                 </DialogClose>
            </DialogFooter>
            <Separator className="my-4" />
             <div className="flex flex-col gap-2">
                 <Button variant="ghost" className="justify-start" disabled>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                </Button>
                <Button variant="ghost" onClick={() => logout()} className="justify-start text-red-500 hover:text-red-500 hover:bg-red-500/10">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                </Button>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
