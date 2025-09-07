
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
import { Switch } from '@/components/ui/switch';

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
  
  const handleTagToggle = async (serverId: string, show: boolean) => {
      try {
          const newServerTags = { ...user?.serverTags, [serverId]: show };
          await updateUserProfile({ serverTags: newServerTags });
          toast({ title: 'Tag preference saved!' })
      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Failed to update preference', description: error.message });
      }
  }

  if (!user) {
    return null;
  }
  
  const ServerTagSelector = ({ server }: { server: Server }) => {
    if (!server.tag) {
        return <p className="text-sm text-muted-foreground">No tag available in this server.</p>
    }

    const TagIcon = tagIcons[server.tag.icon];
    const isEnabled = user.serverTags?.[server.id] !== false;

    return (
        <div className="flex items-center justify-between p-2 rounded-md bg-muted">
            <Badge variant="secondary" className="gap-1.5 text-sm">
                <TagIcon className="size-4"/>
                <span>{server.tag.name}</span>
            </Badge>
            <Switch
                checked={isEnabled}
                onCheckedChange={(checked) => handleTagToggle(server.id, checked)}
            />
        </div>
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
            <CardDescription>Toggle the visibility of server-specific tags next to your name.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            {servers.filter(s => s.tag?.name).length > 0 ? servers.filter(s => s.tag?.name).map(server => (
                <div key={server.id} className="grid grid-cols-3 items-center gap-4">
                     <Label className="font-semibold">{server.name}</Label>
                     <div className="col-span-2">
                        <ServerTagSelector server={server} />
                     </div>
                </div>
            )) : (
                <p className="text-sm text-muted-foreground text-center py-4">None of your servers have a member tag configured.</p>
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
