
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { MailWarning, User, Save, Sword, Zap, Car, Bike, Tag } from 'lucide-react';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useServers } from '@/hooks/use-servers';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Server, ServerTag } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

const tagIcons = {
    Sword, Zap, Car, Bike
};

export function AccountSettings() {
  const { user, updateUserProfile, sendPasswordReset } = useAuth();
  const { servers } = useServers(!!user);
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [bannerURL, setBannerURL] = useState('');
  const [bio, setBio] = useState('');
  const [customStatus, setCustomStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setPhotoURL(user.photoURL || '');
      setBannerURL(user.bannerURL || '');
      setBio(user.bio || '');
      setCustomStatus(user.customStatus || '');
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
          customStatus,
        });
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
  
  const handleTagSelect = async (serverId: string, tagId: string) => {
      try {
          await updateUserProfile({ serverTags: { [serverId]: tagId } });
          toast({ title: 'Tag Applied!', description: 'Your new server tag is now active.'})
      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Failed to apply tag', description: error.message });
      }
  }

  if (!user) {
    return null;
  }
  
  const ServerTagSelector = ({ server }: { server: Server }) => {
    const availableTags = server.tags?.filter(tag => !server.claimedTags?.[tag.id] || server.claimedTags?.[tag.id] === user.uid) || [];
    const currentTagId = user.serverTags?.[server.id] || 'none';

    if (!server.tags || server.tags.length === 0) {
        return <p className="text-sm text-muted-foreground">No tags available in this server.</p>
    }

    return (
        <Select value={currentTagId} onValueChange={(tagId) => handleTagSelect(server.id, tagId)}>
            <SelectTrigger>
                <SelectValue placeholder="Select a tag..."/>
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="none">
                    <div className="flex items-center gap-2">
                        <Tag className="size-4"/> None
                    </div>
                </SelectItem>
                {availableTags.map(tag => {
                     const Icon = tagIcons[tag.icon];
                     return (
                        <SelectItem key={tag.id} value={tag.id}>
                            <div className="flex items-center gap-2">
                                <Icon className="size-4"/> {tag.name}
                            </div>
                        </SelectItem>
                    )
                })}
            </SelectContent>
        </Select>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User Profile</CardTitle>
          <CardDescription>This information will be displayed on your profile.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
                <Avatar className="size-20">
                    <AvatarImage src={photoURL || undefined} />
                    <AvatarFallback className="text-3xl">{displayName?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="displayName">Username</Label>
                        <Input 
                            id="displayName" 
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="photoURL">Avatar URL</Label>
                        <Input 
                            id="photoURL" 
                            value={photoURL}
                            onChange={(e) => setPhotoURL(e.target.value)}
                        />
                    </div>
                </div>
            </div>
             <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input 
                    id="email" 
                    value={user.email || ''}
                    disabled
                />
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="bannerURL">Profile Banner URL</Label>
                <Input 
                    id="bannerURL" 
                    value={bannerURL}
                    onChange={(e) => setBannerURL(e.target.value)}
                />
            </div>
             <div className="space-y-1.5">
                <Label htmlFor="customStatus">Custom Status</Label>
                <Input 
                    id="customStatus" 
                    value={customStatus}
                    onChange={(e) => setCustomStatus(e.target.value)}
                    maxLength={50}
                />
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="bio">Bio</Label>
                <Textarea 
                    id="bio" 
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us a little about yourself."
                    maxLength={200}
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

      <Card>
        <CardHeader>
            <CardTitle>Server Tags</CardTitle>
            <CardDescription>Apply a unique tag from a server you're in. This tag will be displayed next to your name within that server.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            {servers.length > 0 ? servers.map(server => (
                <div key={server.id} className="grid grid-cols-3 items-center gap-4">
                     <Label className="font-semibold">{server.name}</Label>
                     <div className="col-span-2">
                        <ServerTagSelector server={server} />
                     </div>
                </div>
            )) : (
                <p className="text-sm text-muted-foreground text-center py-4">You are not a member of any servers yet.</p>
            )}
        </CardContent>
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
