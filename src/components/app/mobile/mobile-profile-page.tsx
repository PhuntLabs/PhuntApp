
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useChats } from '@/hooks/use-chats';
import { Settings, User, UserNav, User as UserIcon, Link2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useBadges } from '@/hooks/use-badges';
import { format } from 'date-fns';
import { SettingsDialog } from '../settings-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MobileSettingsPage } from './mobile-settings-page';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export function MobileProfilePage() {
    const { user, authUser } = useAuth();
    const { chats } = useChats(!!authUser);
    const { getBadgeDetails, getBadgeIcon } = useBadges();

    if (!user) {
        return <div className="flex items-center justify-center h-full">Loading...</div>;
    }
    
    const allBadges = user.isBot ? ['bot', ...(user.badges || [])] : user.badges || [];
    const memberSince = user.createdAt ? format((user.createdAt as any).toDate(), 'PP') : 'A while ago';
    
    const friends = chats.map(chat => chat.members.find(m => m.id !== user?.uid)).filter(Boolean);

    return (
        <div className="h-full flex flex-col bg-card">
            <header className="p-4 flex items-center justify-end gap-2 absolute top-0 right-0 z-10">
                <Button variant="ghost" size="icon" className="text-white bg-black/30 hover:bg-black/50">
                    <Link2 className="size-5" />
                </Button>
                <Sheet>
                    <SheetTrigger asChild>
                         <Button variant="ghost" size="icon" className="text-white bg-black/30 hover:bg-black/50">
                            <Settings className="size-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="p-0 w-full">
                        <MobileSettingsPage />
                    </SheetContent>
                </Sheet>
            </header>
            <ScrollArea className="flex-1">
                <div className="relative">
                     <div className="h-32 bg-accent" />
                     <div className="p-4 bg-card">
                        <div className="flex items-end -mt-16">
                            <Avatar className="size-24 border-4 border-card rounded-full">
                                <AvatarImage src={user.photoURL || undefined} />
                                <AvatarFallback>{user.displayName[0]}</AvatarFallback>
                            </Avatar>
                        </div>
                        <div className="mt-2 space-y-1">
                            <h1 className="text-2xl font-bold">{user.displayName}</h1>
                            <p className="text-muted-foreground">heinaszn • he/him</p>
                        </div>
                        <div className="flex items-center gap-1 mt-2">
                             {allBadges.map((badgeId) => {
                                const badgeInfo = getBadgeDetails(badgeId);
                                if (!badgeInfo) return null;
                                const Icon = getBadgeIcon(badgeInfo.icon);
                                return (
                                    <div key={badgeId} className="h-6 px-1.5 flex items-center gap-1 rounded-full"
                                        style={{ color: badgeInfo.color, backgroundColor: `${badgeInfo.color}20` }}>
                                        <Icon className="size-3" />
                                    </div>
                                )
                            })}
                        </div>
                        <SettingsDialog defaultSection="account">
                             <Button className="w-full mt-4">Edit Profile</Button>
                        </SettingsDialog>
                     </div>
                </div>

                 <div className="p-4 space-y-4">
                    <div className="p-4 bg-secondary/50 rounded-lg space-y-4">
                        <div>
                            <h3 className="text-xs uppercase font-bold text-muted-foreground">About Me</h3>
                            <p className="text-sm mt-1">{user.bio || 'No bio yet.'}</p>
                        </div>
                        <div>
                             <h3 className="text-xs uppercase font-bold text-muted-foreground">Member Since</h3>
                            <p className="text-sm mt-1">{memberSince}</p>
                        </div>
                    </div>
                    
                    <div className="p-4 bg-secondary/50 rounded-lg space-y-2">
                         <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold">Your Friends</h3>
                            <p className="text-sm text-muted-foreground">{'>'}</p>
                         </div>
                         <div className="flex items-center space-x-2">
                            {friends.slice(0, 5).map(friend => (
                                <Avatar key={friend!.id} className="size-8">
                                    <AvatarImage src={friend!.photoURL || undefined}/>
                                    <AvatarFallback>{friend!.displayName[0]}</AvatarFallback>
                                </Avatar>
                            ))}
                         </div>
                    </div>

                    <div className="p-4 bg-secondary/50 rounded-lg space-y-2">
                         <h3 className="text-sm font-semibold">Note</h3>
                         <p className="text-sm text-muted-foreground italic">You can add a private note here.</p>
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
}

