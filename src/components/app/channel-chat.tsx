
'use client';
import type { Channel, Server } from '@/lib/types';
import { Hash } from 'lucide-react';

interface ChannelChatProps {
    channel: Channel;
    server: Server;
}

export function ChannelChat({ channel, server }: ChannelChatProps) {
    // Channel names might be stored as 'channel-name' but displayed as 'channel name'
    const displayName = channel.name.replace(/-/g, ' ');

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b flex items-center gap-2 flex-shrink-0">
                <Hash className="size-6 text-muted-foreground" />
                <h1 className="text-xl font-semibold">{displayName}</h1>
            </div>
            <div className="flex-1 flex flex-col justify-center items-center bg-muted/20">
                 <div className="text-center">
                    <h2 className="text-2xl font-bold">Welcome to #{displayName}!</h2>
                    <p className="text-muted-foreground">This is the beginning of this channel.</p>
                </div>
            </div>
             <div className="p-4 border-t bg-card flex-shrink-0">
                {/* Chat input will go here */}
                <div className="w-full h-10 bg-input rounded-lg flex items-center px-4">
                    <span className="text-muted-foreground">Chat in #{displayName}</span>
                </div>
            </div>
        </div>
    )
}
