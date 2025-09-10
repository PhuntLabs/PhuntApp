'use client';

import { User } from 'firebase/auth';
import { LogOut, Save, Settings, Pencil, UserPlus, Moon, XCircle, CircleDot, MessageCircleMore, Check, Gamepad2, Link as LinkIcon, Github, Youtube, Sword, Zap, Car, Bike, BadgeCheck, MessageSquare, Phone, Video, MoreHorizontal, AtSign, Compass, Mic, Headphones, Music } from 'lucide-react';
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
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger
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
import type { UserProfile, UserStatus, Server, Role, AvatarEffect, ProfileEffect, Game, CustomGame, Connection, Song } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useFriendRequests } from '@/hooks/use-friend-requests';
import { SettingsDialog } from './settings-dialog';
import { usePermissions } from '@/hooks/use-permissions';
import { Checkbox } from '../ui/checkbox';
import Link from 'next/link';
import { useBadges } from '@/hooks/use-badges';
import { format } from 'date-fns';
import { useCallingStore } from '@/hooks/use-calling-store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface UserNavProps {
    user: UserProfile; 
    logout?: () => void;
    as?: 'button' | 'trigger';
    children?: React.ReactNode;
    serverContext?: Server;
}

const statusConfig: Record<UserStatus, { label: string; icon: React.ElementType, color: string }> = {
    online: { label: 'Online', icon: CircleDot, color: 'bg-green-500' },
    idle: { label: 'Idle', icon: Moon, color: 'bg-yellow-500' },
    dnd: { label: 'Do Not Disturb', icon: XCircle, color: 'bg-red-500' },
    offline: { label: 'Offline', icon: CircleDot, color: 'bg-gray-500' },
};

const SpotifyIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
        <title>Spotify</title>
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.78 17.602c-.312.448-.937.588-1.385.275-3.6-2.212-8.038-2.7-13.313-.912-.512.113-.988-.224-1.1-.737-.113-.512.224-.988.737-1.1.581-.125 11.025.563 15.025 3.025.462.287.587.9.275 1.387zm1.187-2.612c-.388.55-1.15.725-1.7.338-4.125-2.525-10.2-3.238-14.963-1.7- debilitating.625.2-1.2-.162-1.4-.787-.2-.625.163-1.2.788-1.4 5.4-1.775 12.25-.975 16.95 1.862.563.35.738 1.113.338 1.7zm.137-2.763c-4.95-2.912-13.05-3.2-17.438-1.762-.712.238-1.437-.188-1.675-.9-.238-.712.188-1.437.9-1.675 5.025-1.65 13.95-1.287 19.6 1.987.663.388.9 1.238.513 1.9s-1.237.9-1.9.5z" fill="currentColor"/>
    </svg>
);

const ConnectionIcon = ({ type }: { type: Connection['type'] }) => {
    switch (type) {
        case 'github': return <Github className="size-5" />;
        case 'spotify': return <SpotifyIcon className="size-5 text-[#1DB954]" />;
        case 'youtube': return <Youtube className="size-5 text-[#FF0000]" />;
        default: return <LinkIcon className="size-5" />;
    }
};

const tagIcons = {
    Sword, Zap, Car, Bike
};


export function UserNav({ user, logout, as = 'button', children, serverContext }: UserNavProps) {
  const { authUser, user: currentUser, updateUserProfile } = useAuth();
  const { sendFriendRequest } = useFriendRequests();
  const { toast } = useToast();
  
  const isCurrentUser = authUser?.uid === user.uid;

  if (!user) return null;

  const handleStatusChange = async (status: UserStatus) => {
    if (!isCurrentUser || !authUser) return;
     try {
        await updateUserProfile({ status, currentGame: null, currentSong: null });
    } catch(error: any) {
        toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: error.message,
        });
    }
  }

  const TriggerComponent = as === 'button' ? (
     <div className="flex items-center gap-2 p-1 hover:bg-accent rounded-md cursor-pointer transition-colors w-full text-left">
        <div className="relative">
            <Avatar className="size-8">
                <AvatarImage src={user.photoURL || undefined} />
                <AvatarFallback>{user.displayName?.[0].toUpperCase() || user.email?.[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className={cn("absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-background", statusConfig[user.status || 'offline'].color)} />
        </div>
        <div className="flex flex-col -space-y-1 overflow-hidden">
            <span className="text-sm font-semibold truncate">{user.displayName || user.email}</span>
            <span className="text-xs text-muted-foreground truncate">{user.customStatus || user.currentSong?.title || user.currentGame?.name || user.status}</span>
        </div>
    </div>
  ) : (
    <div>{children}</div>
  )

  const serverProfile = serverContext?.memberDetails?.[user.uid]?.profile;
  const userRoles = serverContext?.roles?.filter(role => serverContext.memberDetails?.[user.uid]?.roles.includes(role.id))
      .sort((a, b) => a.priority - b.priority);

  const { getBadgeDetails, getBadgeIcon } = useBadges();
  const memberSince = user.createdAt ? format((user.createdAt as any).toDate(), 'PP') : 'A while ago';
  
  const allBadges = user.isBot ? ['bot', ...(user.badges || [])] : user.badges || [];
  
  const serverMemberSince = serverContext?.memberDetails?.[user.uid]?.joinedAt
    ? format((serverContext.memberDetails[user.uid].joinedAt as any).toDate(), 'PP')
    : undefined;
    
  let activity = null;
  if (user.currentGame) {
      activity = { type: 'game', ...user.currentGame };
  } else if (user.currentSong) {
      activity = { type: 'music', ...user.currentSong };
  }

  return (
    <Popover>
      <PopoverTrigger asChild>{TriggerComponent}</PopoverTrigger>
      <PopoverContent className="w-96 p-0 border-none rounded-xl overflow-hidden" side="right" align="start">
          <ScrollArea className="max-h-[80vh]">
              <div className="relative" style={{ backgroundColor: user.profileColor }}>
                <div className="h-24">
                    {user.bannerURL && <Image src={user.bannerURL} alt="User Banner" layout="fill" objectFit="cover" />}
                </div>
                 <div className="absolute top-16 left-4">
                    <Avatar className="size-24 border-4 border-card rounded-full">
                        <AvatarImage src={serverProfile?.avatar || user.photoURL || undefined} />
                        <AvatarFallback className="text-4xl">{user.displayName?.[0]}</AvatarFallback>
                    </Avatar>
                </div>
                 <div className="absolute top-4 right-4">
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-white bg-black/30 hover:bg-black/50 size-7">
                                <MoreHorizontal className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            {isCurrentUser ? (
                                <SettingsDialog>
                                    <DropdownMenuItem onSelect={e => e.preventDefault()}>
                                        <Pencil className="mr-2"/> Edit Profile
                                    </DropdownMenuItem>
                                </SettingsDialog>
                            ) : (
                                <DropdownMenuItem>
                                    <MessageSquare className="mr-2"/> Message
                                </DropdownMenuItem>
                            )}
                             <DropdownMenuItem>
                                <AtSign className="mr-2"/> Copy Username
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
              </div>
              <div className="bg-card p-4 pt-14 rounded-b-xl">
                 <div className="p-4 bg-secondary/30 rounded-lg">
                    <h2 className="text-xl font-bold">{serverProfile?.nickname || user.displayName}</h2>
                    <p className="text-sm text-muted-foreground">{user.displayName}</p>
                    <div className="flex items-center flex-wrap gap-1 mt-2">
                        {allBadges.map(badgeId => {
                            const badge = getBadgeDetails(badgeId);
                            if (!badge) return null;
                            const Icon = getBadgeIcon(badge.icon);
                            return (
                                <TooltipProvider key={badgeId}>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <div className="h-6 px-1.5 flex items-center gap-1 rounded-md" style={{ color: badge.color, backgroundColor: `${badge.color}20` }}>
                                                <Icon className="size-3" />
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent><p>{badge.name}</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            );
                        })}
                    </div>
                     <Separator className="my-4 bg-border/50" />

                    <Tabs defaultValue="info">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="info">User Info</TabsTrigger>
                            <TabsTrigger value="servers" disabled={!serverContext}>Server Profile</TabsTrigger>
                        </TabsList>
                        <TabsContent value="info" className="space-y-4 pt-4">
                            <div>
                                <h3 className="text-xs font-bold uppercase text-muted-foreground mb-1">About Me</h3>
                                <p className="text-sm">{user.bio || "This user is a mystery."}</p>
                            </div>
                            <div>
                                <h3 className="text-xs font-bold uppercase text-muted-foreground mb-1">Member Since</h3>
                                <p className="text-sm">{memberSince}</p>
                            </div>
                            {user.connections && user.connections.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2">Connections</h3>
                                    <div className="space-y-2">
                                        {user.connections.map(conn => (
                                            <div key={conn.type} className="flex items-center gap-3 p-2 bg-muted/50 rounded-md">
                                                <ConnectionIcon type={conn.type} />
                                                <span className="font-semibold text-sm">{conn.username}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                             {activity && (
                                <div>
                                    <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2">Activity</h3>
                                     {activity.type === 'music' && (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <SpotifyIcon className="size-10 text-[#1DB954]" />
                                                <div>
                                                    <p className="font-semibold">Listening to Spotify</p>
                                                </div>
                                            </div>
                                            <div className="relative rounded-lg overflow-hidden p-3 flex items-center gap-3" style={{ background: 'linear-gradient(to right, #6d4b43, #302622)' }}>
                                                 <Image src={activity.albumArtUrl} alt="Album Art" width={56} height={56} className="rounded-md" />
                                                 <div className="flex-1 text-white overflow-hidden">
                                                    <p className="font-semibold truncate">{activity.title}</p>
                                                    <p className="text-sm opacity-80 truncate">by {activity.artist}</p>
                                                 </div>
                                                 <button className="bg-white/90 text-black rounded-full size-8 flex items-center justify-center shrink-0">
                                                    <Play className="size-5 fill-black" />
                                                 </button>
                                            </div>
                                        </div>
                                     )}
                                     {activity.type === 'game' && 'logoUrl' in activity && (
                                          <div className="flex items-center gap-3">
                                            <Image src={activity.logoUrl} alt={activity.name} width={40} height={40} className="rounded-lg"/>
                                            <div>
                                                <p className="font-semibold">{activity.name}</p>
                                                <p className="text-xs text-muted-foreground">{activity.description}</p>
                                            </div>
                                         </div>
                                     )}
                                </div>
                            )}
                        </TabsContent>
                         <TabsContent value="servers" className="space-y-4 pt-4">
                             {serverMemberSince && (
                                <div>
                                    <h3 className="text-xs font-bold uppercase text-muted-foreground mb-1">Server Member Since</h3>
                                    <p className="text-sm">{serverMemberSince}</p>
                                </div>
                             )}
                             {userRoles && userRoles.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2">Roles</h3>
                                    <div className="flex flex-wrap gap-1">
                                        {userRoles.map(role => (
                                            <div key={role.id} className="h-6 px-2 flex items-center gap-1.5 rounded-sm bg-secondary border" style={{ borderColor: `${role.color}40`}}>
                                                <div className="size-2.5 rounded-full" style={{ backgroundColor: role.color}}/>
                                                <span className="text-xs font-medium">{role.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                             )}
                         </TabsContent>
                    </Tabs>
                 </div>
                 
                 {!isCurrentUser && (
                     <div className="p-2">
                        <Button className="w-full">
                            <MessageSquare className="mr-2"/> Send Message
                        </Button>
                    </div>
                 )}
              </div>
          </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
