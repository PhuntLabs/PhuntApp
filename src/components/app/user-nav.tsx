
'use client';

import { User } from 'firebase/auth';
import { LogOut, Save, Settings, Pencil, UserPlus, Moon, XCircle, CircleDot, MessageCircleMore, Check, Gamepad2, Link as LinkIcon, Github, Youtube, Sword, Zap, Car, Bike, BadgeCheck, MessageSquare, Phone, Video, MoreHorizontal, AtSign, Compass, Mic, Headphones } from 'lucide-react';
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

  return (
    <>
      {TriggerComponent}
    </>
  );
}
