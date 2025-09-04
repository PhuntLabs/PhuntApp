'use client';

import { Plus, Compass } from 'lucide-react';
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
                                    "absolute left-0 top-1/2 -translate-y-1/2 h-0 w-1 bg-primary rounded-r-full transition-all duration-200",
                                    !selectedServer && !isDiscoveryActive ? "h-9" : "group-hover:h-5"
                                )} 
                            />
                            <Avatar className={cn(
                                "size-12 rounded-3xl transition-all duration-200 bg-secondary",
                                !selectedServer && !isDiscoveryActive ? 'rounded-2xl bg-primary' : 'group-hover:rounded-2xl group-hover:bg-primary'
                            )}>
                                <AvatarFallback className="bg-transparent text-primary-foreground text-2xl font-bold">
                                    <svg width="32" height="32" viewBox="0 0 24 24"><path fill="currentColor" d="M12 11.1c-1.1 0-2.1.4-2.8 1.2c-.7.7-1.2 1.7-1.2 2.8c0 .4.1.7.2 1.1c.1.4.3.7.5.9c.2.2.5.5.9.7c.4.2.8.3 1.2.3c1.1 0 2.1-.4 2.8-1.2c.7-.7 1.2-1.7 1.2-2.8c0-.4-.1-.8-.2-1.2c-.1-.4-.3-.7-.5-.9c-.2-.2-.5-.5-.9-.7c-.4-.2-.8-.3-1.2-.3m-6 4.1c0-.4.1-.7.2-1.1c.1-.4.3-.7.5-.9c.2-.2.5-.5.9-.7c.4-.2.8-.3 1.2-.3c.4 0 .8.1 1.2.3c.4.2.7.4.9.7c.2.2.5.5.7.9c.2.4.3.7.3 1.1c0 1.1-.4 2.1-1.2 2.8c-.7.7-1.7 1.2-2.8 1.2c-1.1 0-2.1-.4-2.8-1.2C4.4 17.3 4 16.3 4 15.2m16 0c0-1.1-.4-2.1-1.2-2.8c-.7-.7-1.7-1.2-2.8-1.2c-.4 0-.8.1-1.2.3c-.4.2-.7.4-.9.7c-.2.2-.5-.5-.7.9c-.2.4-.3.7-.3 1.1c0 .4.1.7.2 1.1c.1.4.3.7.5.9c.2.2.5.5.9.7c.4.2.8.3 1.2.3c1.1 0 2.1-.4 2.8-1.2c.8-.8 1.2-1.7 1.2-2.8M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10s10-4.5 10-10S17.5 2 12 2m0 2c1.1 0 2.1.4 2.8 1.2c.8.8 1.2 1.7 1.2 2.8c0 .4-.1.8-.2 1.2c-.1.4-.3.7-.5.9c-.2-.2-.5-.5-.9-.7c-.4-.2-.8-.3-1.2-.3c-1.1 0-2.1-.4-2.8-1.2C9.6 8.9 9.2 7.9 9.2 6.8c0-1.1.4-2.1 1.2-2.8C10.9 4.4 11.3 4 12 4Z"/></svg>
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
                                        "absolute left-0 top-1/2 -translate-y-1/2 h-0 w-1 bg-primary rounded-r-full transition-all duration-200",
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
                                    "absolute left-0 top-1/2 -translate-y-1/2 h-0 w-1 bg-primary rounded-r-full transition-all duration-200",
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
