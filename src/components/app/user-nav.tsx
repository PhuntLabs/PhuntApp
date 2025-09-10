
'use client';

import { User } from 'firebase/auth';
import { LogOut, Save, Settings, Pencil, UserPlus, Moon, XCircle, CircleDot, MessageCircleMore, Check, Gamepad2, Link as LinkIcon, Github, Youtube, Sword, Zap, Car, Bike, BadgeCheck, MessageSquare, Phone, Video, MoreHorizontal, AtSign, Compass } from 'lucide-react';
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

const tagIcons = {
    Sword, Zap, Car, Bike
};

const connectionIcons: Record<Connection['type'], React.FC<any>> = {
    github: (props) => <Github {...props} />,
    spotify: (props) => <Image src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Spotify_logo_without_text.svg/2048px-Spotify_logo_without_text.svg.png" alt="Spotify" width={24} height={24}/>,
    youtube: (props) => <Youtube {...props} />,
    steam: (props) => <Image src="https://upload.wikimedia.org/wikipedia/commons/8/83/Steam_icon_logo.svg" alt="Steam" width={24} height={24}/>,
}


// Profile Effects Components
const RainEffect = () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden h-full">
        {[...Array(50)].map((_, i) => (
            <div key={i} className="raindrop" style={{ left: `${Math.random() * 100}%`, animationDuration: `${0.5 + Math.random() * 0.5}s`, animationDelay: `${Math.random() * 5}s` }} />
        ))}
    </div>
);

const SnowEffect = () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(30)].map((_, i) => (
            <div key={i} className="snowflake" style={{ left: `${Math.random() * 100}%`, fontSize: `${Math.random() * 10 + 8}px`, animationDuration: `${2 + Math.random() * 3}s`, animationDelay: `${Math.random() * 5}s` }}>●</div>
        ))}
    </div>
);

const AuroraEffect = () => <div className="aurora"></div>;

const StarfieldEffect = () => (
     <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(50)].map((_, i) => (
            <div key={i} className="star" style={{ top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`, width: `${Math.random() * 2 + 1}px`, height: `${Math.random() * 2 + 1}px`, animationDelay: `${Math.random() * 2}s`, animationDuration: `${1.5 + Math.random() * 1}s` }} />
        ))}
    </div>
);

const ConfettiEffect = () => {
    const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800'];
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(25)].map((_, i) => (
                 <div key={i} className="confetti" style={{ left: `${Math.random() * 100}%`, backgroundColor: colors[Math.floor(Math.random() * colors.length)], animationDelay: `${Math.random() * 3}s` }} />
            ))}
        </div>
    );
};

const profileEffects: Record<ProfileEffect, React.FC | undefined> = {
    none: undefined,
    rain: RainEffect,
    snow: SnowEffect,
    aurora: AuroraEffect,
    starfield: StarfieldEffect,
    confetti: ConfettiEffect,
};


// Avatar Effects Components
const RageEffect = () => (
    <>
        <div className="avatar-effect-rage-pulse"></div>
        <div className="avatar-effect-rage-pulse" style={{ animationDelay: '0.5s' }}></div>
        <div className="avatar-effect-rage-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="avatar-effect-rage-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 9C18.5523 9 19 8.55228 19 8C19 7.44772 18.5523 7 18 7C17.4477 7 17 7.44772 17 8C17 8.55228 17.4477 9 18 9Z" fill="currentColor"/><path d="M18 13C18.5523 13 19 12.5523 19 12C19 11.4477 18.5523 11 18 11C17.4477 11 17 11.4477 17 12C17 12.5523 17.4477 13 18 13Z" fill="currentColor"/><path d="M15 15C15.5523 15 16 14.5523 16 14C16 13.4477 15.5523 13 15 13C14.4477 13 14 13.4477 14 14C14 14.5523 14.4477 15 15 15Z" fill="currentColor"/><path d="M11 15C11.5523 15 12 14.5523 12 14C12 13.4477 11.5523 13 11 13C10.4477 13 10 13.4477 10 14C10 14.5523 10.4477 15 11 15Z" fill="currentColor"/><path d="M7 13C7.55228 13 8 12.5523 8 12C8 11.4477 7.55228 11 7 11C6.44772 11 6 11.4477 6 12C6 12.5523 6.44772 13 7 13Z" fill="currentColor"/><path d="M7 9C7.55228 9 8 8.55228 8 8C8 7.44772 7.55228 7 7 7C6.44772 7 6 7.44772 6 8C6 8.55228 6.44772 9 7 9Z" fill="currentColor"/></svg>
        </div>
    </>
);
const GlowEffect = () => <div className="avatar-effect-glow"></div>;
const OrbitEffect = () => <div className="avatar-effect-orbit"></div>;
const SparkleEffect = () => (
    <div className="avatar-effect-sparkle">
        {[...Array(5)].map((_, i) => ( <div key={i} className="sparkle" style={{ top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`, width: `${Math.random() * 3 + 1}px`, height: `${Math.random() * 3 + 1}px`, animationDelay: `${Math.random() * 1.5}s` }}/> ))}
    </div>
);
const BounceEffectWrapper = ({ children }: { children: React.ReactNode }) => <div className="avatar-effect-bounce">{children}</div>;

const avatarEffects: Record<AvatarEffect, React.FC | React.FC<{ children: React.ReactNode }> | null> = {
    none: null,
    rage: RageEffect,
    glow: GlowEffect,
    orbit: OrbitEffect,
    sparkle: SparkleEffect,
    bounce: BounceEffectWrapper,
};

export function UserNav({ user, logout, as = 'button', children, serverContext }: UserNavProps) {
  const { authUser, user: currentUser, updateUserProfile, updateUserRolesInServer, updateServerProfile } = useAuth();
  const { sendFriendRequest } = useFriendRequests();
  const { hasPermission } = usePermissions(serverContext, null);
  const { initCall } = useCallingStore();
  const { toast } = useToast();
  const { getBadgeDetails, getBadgeIcon } = useBadges();

  const [isEditing, setIsEditing] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [customStatus, setCustomStatus] = useState(user?.customStatus || '');
  const [managedRoles, setManagedRoles] = useState<string[]>([]);

  // Server-specific profile state
  const [nickname, setNickname] = useState('');
  const [serverAvatar, setServerAvatar] = useState('');
  
  const isCurrentUser = authUser?.uid === user.uid;
  const canManageRoles = hasPermission('manageRoles');

  const serverProfile = serverContext?.memberDetails?.[user.uid]?.profile;
  const displayUser = {
      ...user,
      displayName: serverProfile?.nickname || user.displayName,
      photoURL: serverProfile?.avatar || user.photoURL,
  };

  const memberSince = user.createdAt ? format((user.createdAt as any).toDate(), 'PP') : 'A while ago';

  useEffect(() => {
    if (isPopoverOpen) {
      if (serverContext && user) {
        const profile = serverContext?.memberDetails?.[user.uid]?.profile;
        setNickname(profile?.nickname || '');
        setServerAvatar(profile?.avatar || '');

        const userRoles = serverContext.memberDetails[user.uid]?.roles || [];
        setManagedRoles(userRoles);
      }
      setCustomStatus(currentUser?.customStatus || '');
    }
  }, [isPopoverOpen, user, serverContext, currentUser?.customStatus]);
  
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

  const handleCustomStatusSave = async () => {
     if (!isCurrentUser || !authUser) return;
     try {
        await updateUserProfile({ customStatus: customStatus.trim(), currentGame: null, currentSong: null });
         toast({ title: 'Status Updated'});
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
        displayName: currentUser.displayName || 'Anonymous',
      });
      toast({ title: 'Success', description: result });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
  };

  const handleServerProfileUpdate = async () => {
    if (!isCurrentUser || !serverContext) return;
    try {
        await updateServerProfile(serverContext.id, {
            nickname: nickname.trim(),
            avatar: serverAvatar.trim()
        });
        toast({ title: 'Server Profile Updated' });
        setIsEditing(false);
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: error.message
        });
    }
  }

  const handleRoleChange = async (roleId: string, checked: boolean) => {
    if (!serverContext || !canManageRoles) return;
    const newRoles = checked
      ? [...managedRoles, roleId]
      : managedRoles.filter(id => id !== roleId);
    
    setManagedRoles(newRoles);
    
    try {
        await updateUserRolesInServer(serverContext.id, user.uid, newRoles);
        toast({ title: "Roles Updated", description: `Successfully updated roles for ${user.displayName}.`});
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
        setManagedRoles(managedRoles);
    }
  };
  
  const handleInitiateCall = () => {
    if (!currentUser) {
        toast({variant: 'destructive', title: "You must be logged in to make a call."});
        return;
    };
    initCall(currentUser, user, 'placeholder_chat_id');
  };

  const handleCancel = () => {
    if (serverContext && user) {
        const profile = serverContext?.memberDetails?.[user.uid]?.profile;
        setNickname(profile?.nickname || '');
        setServerAvatar(profile?.avatar || '');
    }
    setIsEditing(false);
  }


  const userStatus = user.status || 'offline';
  const { label: statusLabel, icon: StatusIcon, color: statusColor } = statusConfig[userStatus];

  const TriggerComponent = as === 'button' ? (
     <button className="flex items-center gap-2 p-1 hover:bg-accent rounded-md cursor-pointer transition-colors w-full text-left">
        <div className="relative">
            <Avatar className="size-8">
                <AvatarImage src={user.photoURL || undefined} />
                <AvatarFallback>{user.displayName?.[0].toUpperCase() || user.email?.[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className={cn("absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background/50 flex items-center justify-center", statusConfig[userStatus].color)}>
                 {user.customStatus && <MessageCircleMore className="size-2 text-white/70" />}
            </div>
        </div>
        <div className="flex flex-col -space-y-1 group-data-[collapsible=icon]:hidden overflow-hidden">
            <span className="text-sm font-semibold truncate">{user.displayName || user.email}</span>
            <span className="text-xs text-muted-foreground truncate">{user.customStatus || user.currentSong?.title || user.currentGame?.name || statusLabel}</span>
        </div>
    </button>
  ) : (
    <div onClick={(e) => { if (as === 'trigger') e.stopPropagation(); }}>{children}</div>
  )

  const allBadges = user.isBot ? ['bot', ...(user.badges || [])] : user.badges || [];

  const memberRoles = serverContext?.memberDetails?.[user.uid!]?.roles || [];
  const serverRoles = serverContext?.roles
      ?.filter(role => memberRoles.includes(role.id))
      .sort((a, b) => a.priority - b.priority);
  
  const allServerRoles = serverContext?.roles?.sort((a,b) => a.priority - b.priority) || [];
  
  const isHeina = user.displayName?.toLowerCase() === 'heina';
  const shouldShowServerTag = !isHeina && serverContext?.tag?.name && user.serverTags?.[serverContext?.id] !== false;
  const TagIcon = shouldShowServerTag ? (tagIcons as any)[serverContext!.tag!.icon] : null;

  const AvatarEffectComponent = user.avatarEffect ? avatarEffects[user.avatarEffect] : null;
  const ProfileEffectComponent = user.profileEffect ? profileEffects[user.profileEffect] : null;

  return (
    <Popover open={isPopoverOpen} onOpenChange={(open) => {
      setIsPopoverOpen(open);
      if (!open) setIsEditing(false);
    }}>
      <PopoverTrigger asChild>
        {TriggerComponent}
      </PopoverTrigger>
      <PopoverContent className="w-96 mb-2 p-0 border-none rounded-lg overflow-hidden shadow-2xl" side="top" align="start">
        <TooltipProvider>
            <div className="flex flex-col relative rounded-lg" style={{ backgroundColor: user.profileColor || 'hsl(var(--background))' }}>
                 <div className="relative">
                    <div className="h-24 bg-accent relative rounded-t-lg">
                        {user.bannerURL && (
                            <Image src={user.bannerURL} alt="User banner" fill style={{ objectFit: 'cover' }} className="rounded-t-lg" />
                        )}
                        {ProfileEffectComponent && <ProfileEffectComponent />}
                    </div>
                </div>

                <div className="p-4 pt-0">
                    <div className="flex items-end -mt-12 justify-between">
                        <div className="relative">
                            {AvatarEffectComponent && 'prototype' in AvatarEffectComponent ? (
                                <AvatarEffectComponent>
                                    <Avatar className="size-24 border-4 rounded-full" style={{ borderColor: user.profileColor || 'hsl(var(--background))'}}>
                                        <AvatarImage src={displayUser.photoURL || undefined} />
                                        <AvatarFallback className="text-3xl">{displayUser.displayName?.[0].toUpperCase() || displayUser.email?.[0].toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                </AvatarEffectComponent>
                            ) : (
                                <>
                                    <Avatar className="size-24 border-4 rounded-full" style={{ borderColor: user.profileColor || 'hsl(var(--background))'}}>
                                        <AvatarImage src={displayUser.photoURL || undefined} />
                                        <AvatarFallback className="text-3xl">{displayUser.displayName?.[0].toUpperCase() || displayUser.email?.[0].toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    {AvatarEffectComponent && <AvatarEffectComponent />}
                                </>
                            )}
                            
                            <div className={cn("absolute bottom-1 right-1 w-6 h-6 rounded-full border-4 flex items-center justify-center", statusColor)} style={{ borderColor: user.profileColor || 'hsl(var(--background))'}}>
                                <Tooltip>
                                <TooltipTrigger>
                                    {user.customStatus ? <MessageCircleMore className="size-3 text-white"/> : <StatusIcon className="size-3 text-white"/>}
                                </TooltipTrigger>
                                <TooltipContent side="bottom">
                                        {statusLabel}
                                </TooltipContent>
                                </Tooltip>
                            </div>
                        </div>
                         {!isCurrentUser && (
                            <div className="flex items-center gap-2 ml-auto">
                                <Button size="sm" onClick={handleAddFriend}><UserPlus /> Add Friend</Button>
                                <Button size="sm"><MessageSquare /> Message</Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild><Button size="icon" variant="ghost"><MoreHorizontal/></Button></DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onClick={handleInitiateCall}>Call</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        )}
                    </div>
                
                    <div className="pt-3 bg-card mt-[-1rem] mx-[-1rem] px-4 pb-3 rounded-b-lg">
                        <div className="p-3 bg-secondary rounded-lg">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-xl font-bold">{displayUser.displayName}</h3>
                                {allBadges.map((badgeId) => {
                                    const badgeInfo = getBadgeDetails(badgeId);
                                    if (!badgeInfo) return null;
                                    const Icon = getBadgeIcon(badgeInfo.icon);
                                    return (
                                        <Tooltip key={badgeId}>
                                            <TooltipTrigger>
                                                <div className={cn("flex items-center justify-center size-5 rounded-full")}
                                                     style={{ color: badgeInfo.color, backgroundColor: `${badgeInfo.color}20` }}>
                                                    <Icon className="size-3" />
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent><p>{badgeInfo.name}</p></TooltipContent>
                                        </Tooltip>
                                    )
                                })}
                            </div>

                            <p className={cn("text-sm text-muted-foreground", !user.displayName_lowercase && 'italic')}>{user.displayName_lowercase || 'no username'}</p>
                            
                            <Separator className="my-3" />

                             <Tabs defaultValue="info" className="w-full">
                              <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="info">User Info</TabsTrigger>
                                <TabsTrigger value="mutual" disabled>Mutual</TabsTrigger>
                                <TabsTrigger value="activity">Activity</TabsTrigger>
                              </TabsList>
                              <TabsContent value="info">
                                 <div className="space-y-4 py-4">
                                     <div>
                                        <h4 className="text-xs font-bold uppercase text-muted-foreground mb-1">About Me</h4>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap h-auto max-h-28 overflow-y-auto">{user.bio || 'No bio yet.'}</p>
                                    </div>
                                     <div>
                                        <h4 className="text-xs font-bold uppercase text-muted-foreground mb-1">Member Since</h4>
                                        <p className="text-sm text-muted-foreground">{memberSince}</p>
                                    </div>
                                </div>
                              </TabsContent>
                              <TabsContent value="activity">
                                 {user.currentGame ? (
                                    <div className="p-2 bg-secondary/50 rounded-md text-sm mt-2 flex items-center gap-2">
                                        <Gamepad2 className="size-4" />
                                        <div>
                                            <p className="font-semibold">Playing a game</p>
                                            <p className="text-xs text-muted-foreground">{user.currentGame.name}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center text-muted-foreground py-4">
                                        <p className="text-sm">Not currently in an activity.</p>
                                    </div>
                                )}
                              </TabsContent>
                            </Tabs>

                            {user.connections && user.connections.length > 0 && (
                                <>
                                    <Separator className="my-2" />
                                     <div>
                                        <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2">Connections</h4>
                                        <div className="flex items-center gap-2">
                                            {user.connections.map(conn => {
                                                const Icon = connectionIcons[conn.type];
                                                return (
                                                    <a href={`https://www.${conn.type}.com/${conn.username}`} target="_blank" rel="noopener noreferrer" key={conn.type} className="flex items-center p-2 bg-muted rounded-md hover:bg-muted/80">
                                                        <Icon className="size-6 text-foreground" />
                                                    </a>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </TooltipProvider>
      </PopoverContent>
    </Popover>
  );
}
