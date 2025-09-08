
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { X, Save, Pencil, Sparkles } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { MobileProfileEditor } from '../settings/mobile/mobile-profile-editor';

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
        toast({ title: 'Profile Updated' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
    } finally {
        setIsSaving(false);
    }
  }

  
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
       <Tabs defaultValue="main" className="flex-1 flex flex-col min-h-0">
         <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="main">Main Profile</TabsTrigger>
            <TabsTrigger value="server">Per-server Profiles</TabsTrigger>
        </TabsList>
         <ScrollArea className="flex-1">
            <TabsContent value="main">
                 <div className="p-4 pt-0 space-y-6">
                    <div className="space-y-2 pt-4">
                        <Label htmlFor="display-name">Username</Label>
                        <Input id="display-name" value={user.displayName} disabled />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="avatar-url">Avatar</Label>
                         <div className="flex items-center gap-4">
                            <Avatar className="size-16">
                                <AvatarImage src={photoURL || undefined} />
                                <AvatarFallback>{displayName?.[0]}</AvatarFallback>
                            </Avatar>
                            <Input
                                id="avatar-url"
                                placeholder="https://..."
                                value={photoURL}
                                onChange={(e) => setPhotoURL(e.target.value)}
                            />
                         </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="banner-url">Banner URL</Label>
                        <Input
                            id="banner-url"
                            placeholder="https://..."
                            value={bannerURL}
                            onChange={(e) => setBannerURL(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Profile Theme</Label>
                         <div className="p-4 bg-muted rounded-lg">
                             <div className="h-20 bg-accent rounded-lg relative overflow-hidden flex flex-col items-center justify-end p-2 border">
                                {bannerURL && <Image src={bannerURL} alt="Banner Preview" fill className="object-cover" />}
                                 <div className="relative z-10 w-full bg-background/50 backdrop-blur-sm p-2 rounded-md border">
                                    <div className="flex items-center gap-2">
                                        <Avatar className="size-8">
                                            <AvatarImage src={photoURL || undefined} />
                                            <AvatarFallback>{displayName?.[0]}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-bold text-sm">{displayName}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="outline" className="w-full mt-2">
                                        <Sparkles className="mr-2" />
                                        Change Profile Theme
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="bottom" className="h-[90vh] p-0">
                                    <MobileProfileEditor />
                                </SheetContent>
                            </Sheet>
                         </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="about-me">About Me</Label>
                        <Textarea 
                            id="about-me"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            rows={4}
                            placeholder="Tell everyone a little about yourself"
                        />
                    </div>
                </div>
            </TabsContent>
            <TabsContent value="server">
                <div className="p-4 text-center text-muted-foreground">
                    <p>Per-server profiles are not yet available on mobile.</p>
                </div>
            </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
