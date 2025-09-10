
'use client';

import type { UserProfile, FriendRequest } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '../ui/button';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';
import { UserNav } from './user-nav';


interface ActiveNowListProps {
  users: UserProfile[];
  pendingRequests: FriendRequest[];
  onAcceptFriendRequest: (requestId: string, fromUser: {id: string, displayName: string}) => void;
  onDeclineFriendRequest: (requestId: string) => void;
}

export function ActiveNowList({ users, pendingRequests, onAcceptFriendRequest, onDeclineFriendRequest }: ActiveNowListProps) {
    const [activeTab, setActiveTab] = useState('online');

    const onlineFriends = users.filter(f => f.status && f.status !== 'offline');
    const allFriends = users;
    
    const renderList = () => {
        let list: UserProfile[] = [];
        let emptyStateTitle = "";
        let emptyStateDescription = "";

        switch (activeTab) {
            case 'online':
                list = onlineFriends;
                emptyStateTitle = "No one's around to play with Wumpus.";
                emptyStateDescription = "";
                break;
            case 'all':
                list = allFriends;
                emptyStateTitle = "No Friends";
                 emptyStateDescription = "Wumpus is waiting for friends. You don’t have to though!";
                break;
             case 'pending':
                return (
                    <div className="p-4">
                        <h2 className="text-xs font-bold uppercase text-muted-foreground mb-2">Pending — {pendingRequests.length}</h2>
                        {pendingRequests.length > 0 ? pendingRequests.map(req => (
                            <div key={req.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent border-b">
                                <div>
                                    <p className="font-semibold">{req.from.displayName}</p>
                                    <p className="text-xs text-muted-foreground">Incoming Friend Request</p>
                                </div>
                                <div className="flex items-center gap-2">
                                     <Button variant="ghost" size="icon" className="size-8 bg-green-500/20 text-green-500 rounded-full" onClick={() => onAcceptFriendRequest(req.id, req.from)}>
                                        <Check className="size-4"/>
                                    </Button>
                                     <Button variant="ghost" size="icon" className="size-8 bg-red-500/20 text-red-500 rounded-full" onClick={() => onDeclineFriendRequest(req.id)}>
                                        <X className="size-4"/>
                                    </Button>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center text-muted-foreground py-10">
                                <p>There are no pending friend requests. Here's Wumpus for now.</p>
                            </div>
                        )}
                    </div>
                );
             case 'blocked':
                return (
                    <div className="text-center text-muted-foreground py-10 p-4">
                        <p>You can't unblock users yet, but this is where they would show up!</p>
                    </div>
                )
            default:
                return null;
        }

        if (list.length === 0) {
            return (
                <div className="text-center text-muted-foreground py-10 p-4">
                    <h3 className="font-semibold">{emptyStateTitle}</h3>
                    <p>{emptyStateDescription}</p>
                </div>
            )
        }
        
        return (
            <div className="p-4">
                <h2 className="text-xs font-bold uppercase text-muted-foreground mb-2">{activeTab} — {list.length}</h2>
                {list.map(friend => (
                     <UserNav key={friend.id} user={friend}>
                        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-accent border-b">
                            <div>
                                <p className="font-semibold">{friend.displayName}</p>
                                <p className="text-xs text-muted-foreground">{friend.customStatus || friend.status}</p>
                            </div>
                        </div>
                    </UserNav>
                ))}
            </div>
        )

    }

    return (
        <div className="h-full flex flex-col">
            <header className="p-4 border-b flex items-center shrink-0 gap-4">
                <div className="font-semibold">Friends</div>
                <div className="h-6 w-px bg-border"/>
                <div className="flex items-center gap-2 text-sm">
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab('online')} className={cn(activeTab === 'online' && 'bg-accent')}>Online</Button>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab('all')} className={cn(activeTab === 'all' && 'bg-accent')}>All</Button>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab('pending')} className={cn(activeTab === 'pending' && 'bg-accent')}>Pending</Button>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab('blocked')} className={cn(activeTab === 'blocked' && 'bg-accent')}>Blocked</Button>
                </div>
                 <Button size="sm" className="bg-green-600 text-white hover:bg-green-700 ml-auto">Add Friend</Button>
            </header>
            <div className="flex flex-1 min-h-0">
                <ScrollArea className="flex-1">
                    {renderList()}
                </ScrollArea>
                <aside className="w-80 border-l p-4 space-y-4">
                     <h2 className="text-xl font-bold">Active Now</h2>
                     <div className="text-center py-10 text-muted-foreground">
                        <p className="font-semibold">It's quiet for now...</p>
                        <p className="text-sm">When a friend starts an activity—like playing a game or hanging out on voice—we’ll show it here!</p>
                     </div>
                </aside>
            </div>
        </div>
    );
}

// Dummy imports for button icons
import { MessageSquareMore, MoreVertical } from 'lucide-react';
