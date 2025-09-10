'use client';

import { Plus, Compass, MessageSquare, Gamepad2, Music } from 'lucide-react';
import type { Server, PopulatedChat } from '@/lib/types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { AddServerDialog } from './add-server-dialog';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Separator } from '../ui/separator';
import { usePathname, useRouter } from 'next/navigation';
import { ScrollArea } from '../ui/scroll-area';

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
    const isDiscoveryActive = pathname === '/discovery';

    const handleSelectDMRoot = () => {
        if (pathname !== '/channels/me') router.push('/channels/me');
        onSelectServer(null);
    }
    
    if (loading) {
        return (
            <div className="w-20 flex flex-col items-center py-3 gap-3 bg-secondary">
                <div className="size-12 rounded-full bg-muted animate-pulse" />
                 <Separator className="w-8 bg-border/50" />
                <div className="size-12 rounded-full bg-muted animate-pulse" />
                <div className="size-12 rounded-full bg-muted animate-pulse" />
            </div>
        );
    }
    
    return (
        <TooltipProvider>
            <div className="w-[72px] flex-shrink-0 h-full flex flex-col items-center py-3 gap-2 bg-secondary overflow-y-auto">
                {/* Direct Messages Button */}
                <Tooltip>
                    <TooltipTrigger asChild>
                         <button onClick={handleSelectDMRoot} className="relative group">
                            <div 
                                className={cn(
                                    "absolute -left-3 top-1/2 -translate-y-1/2 h-2 w-1 bg-white rounded-r-full transition-all duration-300",
                                    !selectedServer ? "h-10" : "group-hover:h-5"
                                )} 
                            />
                            <div className={cn(
                                "size-12 rounded-full transition-all duration-200 bg-card flex items-center justify-center",
                                !selectedServer ? 'rounded-2xl bg-blue-600 text-white' : 'group-hover:rounded-2xl group-hover:bg-blue-600 group-hover:text-white'
                            )}>
                                <MessageSquare className="size-6" />
                            </div>
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        <p>Direct Messages</p>
                    </TooltipContent>
                </Tooltip>

                <Separator className="w-8 bg-border/50" />
                
                <ScrollArea className="flex-1 w-full">
                    <div className="flex flex-col items-center gap-2">
                    {servers.map((server) => (
                        <Tooltip key={server.id}>
                            <TooltipTrigger asChild>
                                <button onClick={() => onSelectServer(server)} className="relative group">
                                    <div 
                                        className={cn(
                                            "absolute -left-3 top-1/2 -translate-y-1/2 h-2 w-1 bg-white rounded-r-full transition-all duration-300",
                                            selectedServer?.id === server.id ? "h-10" : "group-hover:h-5"
                                        )} 
                                    />
                                    <Avatar className={cn(
                                        "size-12 rounded-full transition-all duration-200 bg-card",
                                        selectedServer?.id === server.id ? 'rounded-2xl' : 'group-hover:rounded-2xl'
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
                    </div>
                </ScrollArea>

                 {/* Add Server Button */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <AddServerDialog onCreateServer={onCreateServer}>
                            <button className="group">
                                <Avatar className="size-12 rounded-full bg-card transition-all duration-200 group-hover:rounded-2xl group-hover:bg-green-600">
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
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button className="group" onClick={() => router.push('/discovery')}>
                            <Avatar className="size-12 rounded-full bg-card transition-all duration-200 group-hover:rounded-2xl group-hover:bg-green-600">
                                <AvatarFallback className="text-green-400 group-hover:text-white transition-colors duration-200 bg-transparent">
                                    <Compass size={24} />
                                </AvatarFallback>
                            </Avatar>
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        <p>Explore Public Servers</p>
                    </TooltipContent>
                </Tooltip>
                 {/* Games Button */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button className="group" onClick={() => router.push('/games')}>
                            <Avatar className="size-12 rounded-full bg-card transition-all duration-200 group-hover:rounded-2xl group-hover:bg-blue-600">
                                <AvatarFallback className="text-blue-400 group-hover:text-white transition-colors duration-200 bg-transparent">
                                    <Gamepad2 size={24} />
                                </AvatarFallback>
                            </Avatar>
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        <p>Game Hub</p>
                    </TooltipContent>
                </Tooltip>
                {/* Music Button */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button className="group" onClick={() => router.push('/music')}>
                             <Avatar className="size-12 rounded-full bg-card transition-all duration-200 group-hover:rounded-2xl group-hover:bg-pink-600">
                                <AvatarFallback className="text-pink-400 group-hover:text-white transition-colors duration-200 bg-transparent">
                                    <Music size={24} />
                                </AvatarFallback>
                            </Avatar>
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        <p>Music</p>
                    </TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
    );
}
