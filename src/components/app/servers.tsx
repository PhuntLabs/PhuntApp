'use client';

import { Plus, Compass, MessageSquare } from 'lucide-react';
import type { Server } from '@/lib/types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { AddServerDialog } from './add-server-dialog';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Separator } from '../ui/separator';
import { usePathname, useRouter } from 'next/navigation';

interface ServersProps {
    servers: Server[];
    loading: boolean;
    onCreateServer: (name: string) => Promise<void>;
    selectedServer: Server | null;
    onSelectServer: (server: Server | null) => void;
}

export function Servers({ servers, loading, onCreateServer, selectedServer, onSelectServer }: ServersProps) {
    const router = useRouter();
    const pathname = usePathname();
    const isDiscoveryActive = pathname === '/discovery';

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
                         <button onClick={() => handleSelectServer(null)} className="relative group">
                            <div 
                                className={cn(
                                    "absolute -left-3 top-1/2 -translate-y-1/2 h-0 w-1 bg-white rounded-r-full transition-all duration-200",
                                    !selectedServer && !isDiscoveryActive ? "h-9" : "group-hover:h-5"
                                )} 
                            />
                            <Avatar className={cn(
                                "size-12 rounded-3xl transition-all duration-200 bg-secondary",
                                !selectedServer && !isDiscoveryActive ? 'rounded-2xl bg-primary' : 'group-hover:rounded-2xl group-hover:bg-primary'
                            )}>
                                <AvatarFallback className="bg-transparent text-primary-foreground text-2xl font-bold">
                                    <MessageSquare />
                                </AvatarFallback>
                            </Avatar>
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        <p>Direct Messages</p>
                    </TooltipContent>
                </Tooltip>

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
                <Tooltip>
                    <TooltipTrigger asChild>
                         <button onClick={() => router.push('/discovery')} className="relative group">
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
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        <p>Discover Servers</p>
                    </TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
    );
}
