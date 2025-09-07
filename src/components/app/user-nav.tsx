
'use client';

import { User } from 'firebase/auth';
import { LogOut, Save, Settings, Pencil, UserPlus, Moon, XCircle, CircleDot, MessageCircleMore, Check, Gamepad2, Link as LinkIcon, Github, Youtube } from 'lucide-react';
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
import type { UserProfile, UserStatus, Server, Role, AvatarEffect, ProfileEffect, Game, CustomGame, Connection } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useFriendRequests } from '@/hooks/use-friend-requests';
import { SettingsDialog } from './settings-dialog';
import { usePermissions } from '@/hooks/use-permissions';
import { Checkbox } from '../ui/checkbox';
import Link from 'next/link';
import { useBadges } from '@/hooks/use-badges';

interface UserNavProps {
    user: UserProfile; 
    logout?: () => void;
    as?: 'button' | 'trigger';
    children?: React.ReactNode;
    serverContext?: Server;
}

const statusConfig: Record<UserStatus, { label: string; icon: React.ElementType, color: string }> = {
    online: { label: 'Online', icon: CircleDot, color: 'text-green-500' },
    idle: { label: 'Idle', icon: Moon, color: 'text-yellow-500' },
    dnd: { label: 'Do Not Disturb', icon: XCircle, color: 'text-red-500' },
    offline: { label: 'Offline', icon: CircleDot, color: 'text-gray-500' },
};

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

const SpotifyIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
        <title>Spotify</title>
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.78 17.602c-.312.448-.937.588-1.385.275-3.6-2.212-8.038-2.7-13.313-.912-.512.113-.988-.224-1.1-.737-.113-.512.224-.988.737-1.1.581-.125 11.025.563 15.025 3.025.462.287.587.9.275 1.387zm1.187-2.612c-.388.55-1.15.725-1.7.338-4.125-2.525-10.2-3.238-14.963-1.7- debilitating.625.2-1.2-.162-1.4-.787-.2-.625.163-1.2.788-1.4 5.4-1.775 12.25-.975 16.95 1.862.563.35.738 1.113.338 1.7zm.137-2.763c-4.95-2.912-13.05-3.2-17.438-1.762-.712.238-1.437-.188-1.675-.9-.238-.712.188-1.437.9-1.675 5.025-1.65 13.95-1.287 19.6 1.987.663.388.9 1.238.513 1.9s-1.237.9-1.9.5z" fill="#1DB954"/>
    </svg>
);

export function UserNav({ user, logout, as = 'button', children, serverContext }: UserNavProps) {
  const { authUser, user: currentUser, updateUserProfile, updateUserRolesInServer, updateServerProfile } = useAuth();
  const { sendFriendRequest } = useFriendRequests();
  const { hasPermission } = usePermissions(serverContext, null);
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
        await updateUserProfile({ status, currentGame: null });
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
        await updateUserProfile({ customStatus: customStatus.trim(), currentGame: null });
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
        displayName: currentUser.displayName || 'Anonymous'
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
  
  const spotifyConnection = user.connections?.find(c => c.type === 'spotify');


  const TriggerComponent = as === 'button' ? (
     <button className="flex items-center gap-2 p-1 hover:bg-accent rounded-md cursor-pointer transition-colors w-full text-left">
        <div className="relative">
            <Avatar className="size-8">
                <AvatarImage src={user.photoURL || undefined} />
                <AvatarFallback>{user.displayName?.[0].toUpperCase() || user.email?.[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className={cn("absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background/50 flex items-center justify-center", statusConfig[userStatus].color === 'text-gray-500' ? 'bg-gray-500' : statusColor.replace('text-', 'bg-'))}>
                 {user.customStatus && <MessageCircleMore className="size-2 text-white/70" />}
            </div>
        </div>
        <div className="flex flex-col -space-y-1 group-data-[collapsible=icon]:hidden overflow-hidden">
            <span className="text-sm font-semibold truncate">{user.displayName || user.email}</span>
            <span className="text-xs text-muted-foreground truncate">{user.customStatus || statusLabel}</span>
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
      <PopoverContent className="w-80 mb-2 p-0 border-none rounded-lg overflow-hidden" side="top" align="start">
        <TooltipProvider>
            <div className="flex flex-col relative rounded-lg bg-popover">
                 <div className="relative">
                    <div className="h-24 bg-accent relative">
                        {user.bannerURL && (
                            <Image src={user.bannerURL} alt="User banner" fill style={{ objectFit: 'cover' }} />
                        )}
                        {ProfileEffectComponent && <ProfileEffectComponent />}
                    </div>

                    <div className="px-4 pb-4 bg-popover rounded-b-lg">
                        <div className="flex items-end -mt-12">
                            <div className="relative">
                                {AvatarEffectComponent && 'prototype' in AvatarEffectComponent ? (
                                    <AvatarEffectComponent>
                                        <Avatar className="size-24 border-4 border-popover rounded-full">
                                            <AvatarImage src={displayUser.photoURL || undefined} />
                                            <AvatarFallback className="text-3xl">{displayUser.displayName?.[0].toUpperCase() || displayUser.email?.[0].toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                    </AvatarEffectComponent>
                                ) : (
                                    <>
                                        <Avatar className="size-24 border-4 border-popover rounded-full">
                                            <AvatarImage src={displayUser.photoURL || undefined} />
                                            <AvatarFallback className="text-3xl">{displayUser.displayName?.[0].toUpperCase() || displayUser.email?.[0].toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        {AvatarEffectComponent && <AvatarEffectComponent />}
                                    </>
                                )}
                                
                                <div className={cn("absolute bottom-1 right-1 w-6 h-6 rounded-full border-4 border-popover flex items-center justify-center", statusColor.replace('text-', 'bg-'))}>
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
                             <div className="ml-auto flex justify-end gap-1">
                                {!isCurrentUser && (
                                    <Button variant="outline" size="sm" onClick={handleAddFriend}>
                                        <UserPlus className="mr-2 h-3.5 w-3.5"/> Add Friend
                                    </Button>
                                )}
                            </div>
                        </div>
                    
                        <div className="pt-4">
                        {!isEditing ? (
                        <>
                            <div className="flex items-center gap-2">
                                <h3 className="text-xl font-bold">{displayUser.displayName}</h3>
                                <div className="flex items-center gap-1">
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
                            </div>

                            <p className={cn("text-sm text-muted-foreground -mt-1", !user.email && 'italic')}>{user.email || 'No email provided'}</p>
                            {user.customStatus && <p className="text-sm text-foreground mt-1">{user.customStatus}</p>}
                            <Separator className="my-2" />
                            
                            {spotifyConnection && !user.currentGame && (
                                <>
                                <div className="mb-2">
                                    <h4 className="text-xs font-bold uppercase text-muted-foreground">Listening to Spotify</h4>
                                     <div className="flex items-center gap-3 mt-1 bg-secondary/50 p-2 rounded-md">
                                        <SpotifyIcon className="size-10" />
                                        <div className="overflow-hidden flex-1">
                                            <p className="font-semibold truncate">Daylight</p>
                                            <p className="text-xs text-muted-foreground truncate">by David Kushner</p>
                                            <p className="text-xs text-muted-foreground truncate">on Daylight</p>
                                        </div>
                                    </div>
                                </div>
                                </>
                            )}
                            
                            {user.currentGame && (
                                <>
                                <div className="mb-2">
                                    <h4 className="text-xs font-bold uppercase text-muted-foreground">Playing a Game</h4>
                                    <div className="flex items-center gap-3 mt-1 bg-secondary/50 p-2 rounded-md">
                                        <Image src={"logoUrl" in user.currentGame ? user.currentGame.logoUrl : user.currentGame.imageUrl} alt={user.currentGame.name} width={40} height={40} className="rounded-md" />
                                        <div className="overflow-hidden flex-1">
                                            <p className="font-semibold truncate">{user.currentGame.name}</p>
                                            {"description" in user.currentGame && <p className="text-xs text-muted-foreground truncate">{user.currentGame.description}</p>}
                                        </div>
                                    </div>
                                    {!isCurrentUser && "embedUrl" in user.currentGame && (
                                        <Link href={`/games/${user.currentGame.id}`} className="mt-2 w-full">
                                            <Button variant="outline" size="sm" className="w-full">
                                                <Gamepad2 className="mr-2 size-4" />
                                                Join Game
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                                </>
                            )}

                             <p className="text-sm text-muted-foreground whitespace-pre-wrap h-auto max-h-28 overflow-y-auto">{user.bio || 'No bio yet.'}</p>
                             

                            {serverContext && (
                            <>
                                <Separator className="my-2" />
                                <div className="mb-2">
                                    <h4 className="text-xs font-bold uppercase text-muted-foreground">Roles</h4>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {serverRoles && serverRoles.length > 0 ? (
                                            serverRoles.map(role => (
                                            <Badge key={role.id} variant="outline" className="font-medium" style={{ borderColor: role.color, color: role.color, backgroundColor: `${role.color}1A`}}>
                                                {role.name}
                                            </Badge>
                                        ))
                                        ) : (
                                            <p className="text-xs text-muted-foreground italic">No roles</p>
                                        )}
                                    </div>
                                </div>
                            </>
                            )}

                             {canManageRoles && allServerRoles.length > 0 && (
                                <>
                                <Separator className="my-2" />
                                <div className="mb-2">
                                    <h4 className="text-xs font-bold uppercase text-muted-foreground">Manage Roles</h4>
                                    <div className="space-y-1 mt-1">
                                    {allServerRoles.map(role => (
                                        <div key={role.id} className="flex items-center gap-2">
                                            <Checkbox
                                                id={`role-${role.id}`}
                                                checked={managedRoles.includes(role.id)}
                                                onCheckedChange={(checked) => handleRoleChange(role.id, !!checked)}
                                            />
                                            <Label htmlFor={`role-${role.id}`} className="flex items-center gap-2 cursor-pointer">
                                                <div className="size-3 rounded-full" style={{ backgroundColor: role.color}} />
                                                {role.name}
                                            </Label>
                                        </div>
                                    ))}
                                    </div>
                                </div>
                                </>
                            )}

                            {isCurrentUser && (
                                <>
                                <Separator className="my-4" />
                                <div className="flex flex-col gap-1">
                                    <SettingsDialog defaultSection="account" onOpenChange={(open) => !open && setIsPopoverOpen(false)}>
                                    <Button variant="outline" className="justify-start">
                                        <Pencil className="mr-2 h-4 w-4" />
                                        <span>Edit User Profile</span>
                                    </Button>
                                    </SettingsDialog>
                                    {serverContext && (
                                        <Button variant="outline" className="justify-start" onClick={() => setIsEditing(true)}>
                                            <Pencil className="mr-2 h-4 w-4" />
                                            <span>Edit Server Profile</span>
                                        </Button>
                                    )}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="justify-start">
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
                                            <DropdownMenuSeparator />
                                            <div className="p-2">
                                                <Label htmlFor="custom-status-dropdown">Custom Status</Label>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Input
                                                        id="custom-status-dropdown"
                                                        placeholder="Set a custom status"
                                                        value={customStatus}
                                                        onChange={(e) => setCustomStatus(e.target.value)}
                                                        onKeyDown={(e) => { if(e.key === 'Enter') handleCustomStatusSave(); }}
                                                    />
                                                    <Button size="icon" className="size-8" onClick={handleCustomStatusSave}><Save/></Button>
                                                </div>
                                            </div>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    <SettingsDialog onOpenChange={(open) => !open && setIsPopoverOpen(false)}>
                                        <Button variant="ghost" className="justify-start">
                                            <Settings className="mr-2 h-4 w-4" />
                                            <span>Settings</span>
                                        </Button>
                                    </SettingsDialog>
                                    {logout && (
                                    <Button variant="ghost" onClick={logout} className="justify-start text-red-500 hover:text-red-500 hover:bg-red-500/10">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Log out</span>
                                    </Button>
                                    )}
                                </div>
                                </>
                            )}
                        </>
                        ) : (
                        <div className="space-y-4 h-auto max-h-[calc(100vh-20rem)] overflow-y-auto pr-2">
                            <h4 className="font-semibold">Editing Profile for <span className="text-primary">{serverContext?.name}</span></h4>
                            <div className="space-y-1">
                                <Label htmlFor="nickname">Server Nickname</Label>
                                <Input id="nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder={user.displayName} />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="server-avatar">Server Avatar URL</Label>
                                <Input id="server-avatar" value={serverAvatar} onChange={(e) => setServerAvatar(e.target.value)} placeholder="https://..." />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="sm" onClick={handleCancel}>Cancel</Button>
                                <Button size="sm" onClick={handleServerProfileUpdate}>Save</Button>
                            </div>
                        </div>
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
