
'use client';

import { Plus, Compass, MessageSquare, Gamepad2, Music } from 'lucide-react';
import type { Server, PopulatedChat } from '@/lib/types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { AddServerDialog } from './add-server-dialog';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Separator } from '../ui/separator';
import { usePathname, useRouter } from 'next/navigation';
import { Badge } from '../ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useChats } from '@/hooks/use-chats';
import Image from 'next/image';
import { useMobileView } from '@/hooks/use-mobile-view';
import Link from 'next/link';

interface ServersProps {
    servers: Server[];
    loading: boolean;
    onCreateServer: (name: string) => Promise<void>;
    selectedServer: Server | null;
    onSelectServer: (server: Server | null) => void;
    onSelectChat: (chat: PopulatedChat) => void;
}

export function Servers({ servers, loading, onCreateServer, selectedServer, onSelectServer, onSelectChat }: ServersProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, authUser } = useAuth();
    const { isMobileView } = useMobileView();
    const isDiscoveryActive = pathname === '/discovery';
    const isGamesActive = pathname.startsWith('/games');
    const isMusicActive = pathname.startsWith('/music');

    const { chats } = useChats(!!authUser);

    const unreadChats = chats.filter(chat => 
        chat.unreadCount && user && (chat.unreadCount[user.uid] || 0) > 0
    );

    const handleSelectDMRoot = () => {
        if (pathname !== '/') router.push('/');
        onSelectServer(null);
    }
    
    const handleSelectUnreadChat = (chat: PopulatedChat) => {
        if (pathname !== '/') router.push('/');
        onSelectServer(null);
        onSelectChat(chat);
    }

    const handleSelectServer = (server: Server | null) => {
        if (pathname !== '/') router.push('/');
        onSelectServer(server);
    }
    
    if (loading) {
        return (
            <div className="w-20 flex flex-col items-center py-3 gap-3 bg-background/50">
                <div className="size-12 rounded-full bg-muted animate-pulse" />
                 <Separator className="w-8 bg-border/50" />
                <div className="size-12 rounded-3xl bg-muted animate-pulse" />
                <div className="size-12 rounded-3xl bg-muted animate-pulse" />
            </div>
        );
    }
    
    return (
        <TooltipProvider>
            <div className="w-20 flex-shrink-0 h-full flex flex-col items-center py-3 gap-3 bg-background/80 overflow-y-auto">
                {/* Direct Messages Button */}
                <Tooltip>
                    <TooltipTrigger asChild>
                         <button onClick={handleSelectDMRoot} className="relative group">
                            <div 
                                className={cn(
                                    "absolute -left-3 top-1/2 -translate-y-1/2 h-0 w-1 bg-white rounded-r-full transition-all duration-200",
                                    !selectedServer && !isDiscoveryActive && !isGamesActive && !isMusicActive ? "h-9" : "group-hover:h-5"
                                )} 
                            />
                            <div className={cn(
                                "size-12 rounded-3xl transition-all duration-200 bg-secondary flex items-center justify-center",
                                !selectedServer && !isDiscoveryActive && !isGamesActive && !isMusicActive ? 'rounded-2xl bg-primary' : 'group-hover:rounded-2xl group-hover:bg-primary'
                            )}>
                                <MessageSquare className="size-7 text-white/80" />
                            </div>
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        <p>Direct Messages</p>
                    </TooltipContent>
                </Tooltip>

                {unreadChats.length > 0 && <Separator className="w-8 bg-border/50" />}

                 {/* Unread DM Notifications */}
                {unreadChats.map((chat) => {
                    const otherMember = chat.members.find(m => m.id !== user?.uid);
                    if (!otherMember) return null;

                    return (
                        <Tooltip key={chat.id}>
                            <TooltipTrigger asChild>
                                <button onClick={() => handleSelectUnreadChat(chat)} className="relative group">
                                     <div 
                                        className={cn(
                                            "absolute -left-3 top-1/2 -translate-y-1/2 h-2 w-1 bg-white rounded-r-full transition-all duration-200 group-hover:h-5"
                                        )} 
                                    />
                                    <Avatar className={cn(
                                        "size-12 rounded-full transition-all duration-200 bg-secondary group-hover:rounded-2xl"
                                    )}>
                                        <AvatarImage src={otherMember.photoURL || undefined} alt={otherMember.displayName || ''} />
                                        <AvatarFallback className="font-bold text-lg bg-transparent">
                                            {otherMember.displayName?.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                     <Badge className="absolute -bottom-1 -right-2 bg-red-500 text-white h-5 px-1.5 border-2 border-background/80">
                                        {chat.unreadCount?.[user?.uid || ''] > 9 ? '9+' : chat.unreadCount?.[user?.uid || '']}
                                    </Badge>
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                                <p>Message from {otherMember.displayName}</p>
                            </TooltipContent>
                        </Tooltip>
                    );
                })}


                <Separator className="w-8 bg-border/50" />
                
                {servers.map((server) => (
                    <Tooltip key={server.id}>
                        <TooltipTrigger asChild>
                            <button onClick={() => handleSelectServer(server)} className="relative group">
                                <div 
                                    className={cn(
                                        "absolute -left-3 top-1/2 -translate-y-1/2 h-0 w-1 bg-white rounded-r-full transition-all duration-200",
                                        selectedServer?.id === server.id ? "h-9" : "group-hover:h-5"
                                    )} 
                                />
                                <Avatar className={cn(
                                    "size-12 rounded-3xl transition-all duration-200 bg-secondary",
                                    selectedServer?.id === server.id ? 'rounded-2xl bg-primary' : 'group-hover:rounded-2xl group-hover:bg-primary'
                                )}>
                                    <AvatarImage src={server.photoURL || undefined} alt={server.name} />
                                    <AvatarFallback className="font-bold text-lg bg-transparent">
                                        {server.name.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                            <p>{server.name}</p>
                        </TooltipContent>
                    </Tooltip>
                ))}

                 {/* Add Server Button */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <AddServerDialog onCreateServer={onCreateServer}>
                            <button className="group">
                                <Avatar className="size-12 rounded-3xl bg-secondary transition-all duration-200 group-hover:rounded-2xl group-hover:bg-green-600">
                                    <AvatarFallback className="text-green-400 group-hover:text-white transition-colors duration-200 bg-transparent">
                                        <Plus size={24} />
                                    </AvatarFallback>
                                </Avatar>
                            </button>
                        </AddServerDialog>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        <p>Add a Server</p>
                    </TooltipContent>
                </Tooltip>

                 {/* Discovery Button */}
                <Link href="/discovery" legacyBehavior={false}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                             <div className="relative group">
                                 <div 
                                    className={cn(
                                        "absolute -left-3 top-1/2 -translate-y-1/2 h-0 w-1 bg-white rounded-r-full transition-all duration-200",
                                        isDiscoveryActive ? "h-9" : "group-hover:h-5"
                                    )} 
                                />
                                <Avatar className={cn(
                                    "size-12 rounded-3xl bg-secondary transition-all duration-200 group-hover:rounded-2xl",
                                    isDiscoveryActive ? 'rounded-2xl bg-green-600' : 'group-hover:bg-green-600'
                                )}>
                                    <AvatarFallback className={cn("bg-transparent text-green-400 transition-colors duration-200", isDiscoveryActive ? "text-white" : "group-hover:text-white")}>
                                        <Compass size={24} />
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                            <p>Discover Servers</p>
                        </TooltipContent>
                    </Tooltip>
                </Link>

                 {/* Games Button */}
                <Link href="/games" legacyBehavior={false}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                             <div className="relative group">
                                 <div 
                                    className={cn(
                                        "absolute -left-3 top-1/2 -translate-y-1/2 h-0 w-1 bg-white rounded-r-full transition-all duration-200",
                                        isGamesActive ? "h-9" : "group-hover:h-5"
                                    )} 
                                />
                                <Avatar className={cn(
                                    "size-12 rounded-3xl bg-secondary transition-all duration-200 group-hover:rounded-2xl",
                                    isGamesActive ? 'rounded-2xl bg-green-600' : 'group-hover:bg-green-600'
                                )}>
                                    <AvatarFallback className={cn("bg-transparent text-green-400 transition-colors duration-200", isGamesActive ? "text-white" : "group-hover:text-white")}>
                                        <Gamepad2 size={24} />
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                            <p>Game Hub</p>
                        </TooltipContent>
                    </Tooltip>
                </Link>

                {/* Music Button */}
                <Link href="/music" legacyBehavior={false}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                             <div className="relative group">
                                 <div 
                                    className={cn(
                                        "absolute -left-3 top-1/2 -translate-y-1_2 h-0 w-1 bg-white rounded-r-full transition-all duration-200",
                                        isMusicActive ? "h-9" : "group-hover:h-5"
                                    )} 
                                />
                                <Avatar className={cn(
                                    "size-12 rounded-3xl bg-secondary transition-all duration-200 group-hover:rounded-2xl",
                                    isMusicActive ? 'rounded-2xl bg-green-600' : 'group-hover:bg-green-600'
                                )}>
                                    <AvatarFallback className={cn("bg-transparent text-green-400 transition-colors duration-200", isMusicActive ? "text-white" : "group-hover:text-white")}>
                                        <Music size={24} />
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                            <p>Music Library</p>
                        </TooltipContent>
                    </Tooltip>
                </Link>

            </div>
        </TooltipProvider>
    );
}

    