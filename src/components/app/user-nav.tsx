
'use client';

import { User } from 'firebase/auth';
import { LogOut, Save, Code, Bot, Settings, Pencil, UserPlus, Moon, Sun, XCircle, CircleDot } from 'lucide-react';
import Image from 'next/image';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { useState, useEffect } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import type { UserProfile, UserStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useFriendRequests } from '@/hooks/use-friend-requests';

interface UserNavProps {
    user: UserProfile; 
    logout?: () => void;
    as?: 'button' | 'trigger';
    children?: React.ReactNode;
}

const statusConfig: Record<UserStatus, { label: string; icon: React.ElementType, color: string }> = {
    online: { label: 'Online', icon: CircleDot, color: 'text-green-500' },
    idle: { label: 'Idle', icon: Moon, color: 'text-yellow-500' },
    dnd: { label: 'Do Not Disturb', icon: XCircle, color: 'text-red-500' },
    offline: { label: 'Offline', icon: CircleDot, color: 'text-gray-500' },
};

export function UserNav({ user, logout, as = 'button', children }: UserNavProps) {
  const { authUser, user: currentUser, updateUserProfile } = useAuth();
  const { sendFriendRequest } = useFriendRequests();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [bannerURL, setBannerURL] = useState(user?.bannerURL || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const { toast } = useToast();

  const isCurrentUser = authUser?.uid === user.uid;

  useEffect(() => {
    // When the popover opens or user changes, sync state
    if (isPopoverOpen && user) {
        setDisplayName(user.displayName || '');
        setPhotoURL(user.photoURL || '');
        setBannerURL(user.bannerURL || '');
        setBio(user.bio || '');
    }
  }, [isPopoverOpen, user]);
  
  if (!user) return null;

  const handleProfileUpdate = async () => {
    if (!isCurrentUser || !authUser) return;
    try {
        await updateUserProfile({ displayName, photoURL, bannerURL, bio });
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

  const handleStatusChange = async (status: UserStatus) => {
    if (!isCurrentUser || !authUser) return;
     try {
        await updateUserProfile({ status });
    } catch(error: any) {
        toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: error.message,
        });
    }
  }
  
  const handleAddFriend = async () => {
    if (!currentUser || !user.displayName) return;
    try {
      const result = await sendFriendRequest(user.displayName, {
        id: currentUser.uid,
        displayName: currentUser.displayName || 'Anonymous'
      });
      toast({ title: 'Success', description: result });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
  };

  const handleCancel = () => {
    // Reset fields to current user state
    if (user) {
        setDisplayName(user.displayName || '');
        setPhotoURL(user.photoURL || '');
        setBannerURL(user.bannerURL || '');
        setBio(user.bio || '');
    }
    setIsEditing(false);
  }

  const userStatus = user.status || 'offline';
  const { label: statusLabel, icon: StatusIcon, color: statusColor } = statusConfig[userStatus];

  const TriggerComponent = as === 'button' ? (
     <button className="flex items-center gap-2 p-1 hover:bg-sidebar-accent rounded-md cursor-pointer transition-colors w-full text-left">
        <div className="relative">
            <Avatar className="size-8">
                <AvatarImage src={user.photoURL || undefined} />
                <AvatarFallback>{user.displayName?.[0].toUpperCase() || user.email?.[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className={cn("absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-sidebar-accent", statusConfig[userStatus].color === 'text-gray-500' ? 'bg-gray-500' : `bg-${statusConfig[userStatus].color.split('-')[1]}-500`)} />
        </div>
        <div className="flex flex-col -space-y-1 group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold truncate">{user.displayName || user.email}</span>
            <span className="text-xs text-muted-foreground">{statusLabel}</span>
        </div>
    </button>
  ) : (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div onClick={(e) => {
        // This prevents the click from propagating to parent elements if it's a trigger
        if (as === 'trigger') {
            e.stopPropagation();
        }
    }}>{children}</div>
  )

  return (
    <Popover open={isPopoverOpen} onOpenChange={(open) => {
      setIsPopoverOpen(open);
      if (!open) {
        setIsEditing(false); // Reset edit mode on close
      }
    }}>
      <PopoverTrigger asChild>
        {TriggerComponent}
      </PopoverTrigger>
      <PopoverContent className="w-80 mb-2 h-auto" side="top" align="start">
      <TooltipProvider>
        <div className="relative h-24 bg-accent rounded-t-lg -mx-4 -mt-4">
            {user.bannerURL && (
                <Image src={user.bannerURL} alt="User banner" fill style={{ objectFit: 'cover' }} className="rounded-t-lg" />
            )}
             <div className="absolute top-16 left-4">
                 <div className="relative">
                    <Avatar className="size-20 border-4 border-popover rounded-full">
                      <AvatarImage src={user.photoURL || undefined} />
                      <AvatarFallback className="text-2xl">{user.displayName?.[0].toUpperCase() || user.email?.[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className={cn("absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 border-popover flex items-center justify-center", statusConfig[userStatus].color === 'text-gray-500' ? 'bg-gray-500' : `bg-${statusConfig[userStatus].color.split('-')[1]}-500`)}>
                        <StatusIcon className="size-3 text-white"/>
                    </div>
                </div>
            </div>
            <div className="absolute top-4 right-4 flex justify-end gap-1">
                {isCurrentUser ? (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                        <Pencil className="mr-2 h-3.5 w-3.5"/> Edit Profile
                    </Button>
                ) : (
                     <Button variant="outline" size="sm" onClick={handleAddFriend}>
                        <UserPlus className="mr-2 h-3.5 w-3.5"/> Add Friend
                    </Button>
                )}
            </div>
        </div>
        <div className="pt-14">
           {!isEditing ? (
             <>
                <div className="absolute top-28 right-4 flex justify-end gap-1">
                 {user.badges?.includes('developer') && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                             <Badge variant="secondary" className="flex items-center justify-center h-6 p-0 px-2 bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                                <Code className="size-3 mr-1" /> Developer
                            </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Developer</p>
                        </TooltipContent>
                    </Tooltip>
                )}
                 {user.isBot && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                             <Badge variant="secondary" className="flex items-center justify-center h-6 p-0 px-2 bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                                <Bot className="size-3 mr-1" /> Bot
                            </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Bot</p>
                        </TooltipContent>
                    </Tooltip>
                )}
                </div>
                <h3 className="text-xl font-bold">{displayName}</h3>
                <p className={cn("text-sm text-muted-foreground -mt-1", !user.email && 'italic')}>{user.email || 'No email provided'}</p>
                <Separator className="my-2" />
                <p className="text-sm text-muted-foreground whitespace-pre-wrap h-auto max-h-28 overflow-y-auto">{bio || 'No bio yet.'}</p>
                
                {isCurrentUser && (
                    <>
                    <Separator className="my-4" />
                    <div className="flex flex-col gap-1">
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                 <Button variant="outline" className="justify-start">
                                    <StatusIcon className={cn("mr-2 h-4 w-4", statusColor)} />
                                    <span>{statusLabel}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                {Object.entries(statusConfig).map(([key, {label, icon: Icon, color}]) => (
                                    <DropdownMenuItem key={key} onSelect={() => handleStatusChange(key as UserStatus)}>
                                        <Icon className={cn("mr-2 h-4 w-4", color)} />
                                        <span>{label}</span>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button variant="ghost" className="justify-start">
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Settings</span>
                        </Button>
                        <Button variant="ghost" onClick={() => logout && logout()} className="justify-start text-red-500 hover:text-red-500 hover:bg-red-500/10">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </Button>
                    </div>
                    </>
                )}
             </>
           ) : (
             <div className="space-y-4 h-auto max-h-[calc(100vh-20rem)] overflow-y-auto pr-2">
                <div className="space-y-1">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                </div>
                <div className="space-y-1">
                    <Label htmlFor="photoURL">Profile Picture URL</Label>
                    <Input id="photoURL" value={photoURL} onChange={(e) => setPhotoURL(e.target.value)} placeholder="https://example.com/image.png"/>
                </div>
                 <div className="space-y-1">
                    <Label htmlFor="bannerURL">Banner URL</Label>
                    <Input id="bannerURL" value={bannerURL} onChange={(e) => setBannerURL(e.target.value)} placeholder="https://example.com/banner.gif"/>
                </div>
                 <div className="space-y-1">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us about yourself..." rows={4}/>
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
        </div>
        </TooltipProvider>
      </PopoverContent>
    </Popover>
  );
}
