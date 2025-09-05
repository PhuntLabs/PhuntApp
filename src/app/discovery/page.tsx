
'use client';

import { useEffect, useState } from 'react';
import { usePublicServers } from '@/hooks/use-public-servers';
import { Servers } from '@/components/app/servers';
import { useServers } from '@/hooks/use-servers';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Users, Bot } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePublicBots } from '@/hooks/use-public-bots';
import type { UserProfile } from '@/lib/types';
import { AddBotToServerDialog } from '@/components/app/add-bot-to-server-dialog';
import { ensureQolforuBotUser } from '@/ai/flows/qolforu-bot-flow';
import { QOLFORU_BOT_ID, QOLFORU_BOT_PHOTO_URL, QOLFORU_BOT_USERNAME } from '@/ai/bots/qolforu-config';
import { PHUNT_BOT_ID, PHUNT_BOT_PHOTO_URL, PHUNT_BOT_USERNAME } from '@/ai/bots/phunt-config';
import { ensurePhuntBotUser } from '@/ai/flows/phunt-bot-flow';


function ServerList() {
    const { publicServers, loading } = usePublicServers();
    const { servers: userServers } = useServers();
    const { user } = useAuth();
    
    const userServerIds = new Set(userServers.map(s => s.id));

     if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                    <Card key={i} className="flex flex-col overflow-hidden">
                        <Skeleton className="h-24 w-full" />
                        <CardHeader className="flex flex-row items-center gap-4 -mt-6 z-10">
                            <Skeleton className="h-14 w-14 rounded-lg border-4 border-background" />
                            <div className="space-y-2 pt-6">
                                <Skeleton className="h-4 w-[150px]" />
                                <Skeleton className="h-4 w-[100px]" />
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6 mt-2" />
                        </CardContent>
                        <CardFooter>
                            <Skeleton className="h-10 w-full" />
                        </CardFooter>
                    </Card>
                ))}
            </div>
        )
    }

    return (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {publicServers.map(server => (
                <Card key={server.id} className="flex flex-col overflow-hidden group">
                     <div className="h-24 w-full relative">
                        {server.bannerURL ? (
                            <Image src={server.bannerURL} alt={`${server.name} banner`} fill style={{ objectFit: 'cover' }} className="group-hover:scale-105 transition-transform duration-300" sizes="300px"/>
                        ) : (
                            <div className="h-full w-full bg-accent" />
                        )}
                     </div>
                    <CardHeader className="flex flex-row items-center gap-4 -mt-6 z-10">
                        <Avatar className="h-14 w-14 rounded-lg border-4 border-background shrink-0">
                            <AvatarImage src={server.photoURL || undefined} alt={server.name}/>
                            <AvatarFallback>{server.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="pt-6 overflow-hidden">
                            <CardTitle className="text-lg truncate">{server.name}</CardTitle>
                            <div className="flex items-center text-sm text-muted-foreground">
                                <Users className="size-4 mr-1"/> {server.members.length} Members
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                         <CardDescription className="line-clamp-3 h-[60px]">
                            {server.description || "No description provided."}
                        </CardDescription>
                    </CardContent>
                    <CardFooter>
                        {user && userServerIds.has(server.id) ? (
                            <Button disabled className="w-full">Joined</Button>
                        ) : (
                            <Link href={`/join/${server.id}`} className="w-full">
                                <Button className="w-full">Join Server</Button>
                            </Link>
                        )}
                    </CardFooter>
                </Card>
            ))}
        </div>
        { !loading && publicServers.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <h2 className="text-xl font-semibold">No public servers found.</h2>
                <p>Check back later or make your own server public!</p>
            </div>
         )}
         </>
    )
}

function BotList() {
    const { publicBots, loading } = usePublicBots();
    const [allBots, setAllBots] = useState<UserProfile[]>([]);

    useEffect(() => {
        // Manually add qolforu and phunt bot to ensure they are always present
        const hardcodedBots: UserProfile[] = [
            {
                uid: QOLFORU_BOT_ID,
                id: QOLFORU_BOT_ID,
                displayName: QOLFORU_BOT_USERNAME,
                displayName_lowercase: QOLFORU_BOT_USERNAME.toLowerCase(),
                photoURL: QOLFORU_BOT_PHOTO_URL,
                bio: "I'm qolforu, a bot designed to bring quality-of-life features to your server. Use my commands like /poll and /embed to spice up your conversations!",
                isBot: true,
                isVerified: true,
                isDiscoverable: true,
                badges: ['bot'],
            },
            {
                uid: PHUNT_BOT_ID,
                id: PHUNT_BOT_ID,
                displayName: PHUNT_BOT_USERNAME,
                displayName_lowercase: PHUNT_BOT_USERNAME.toLowerCase(),
                photoURL: PHUNT_BOT_PHOTO_URL,
                bio: "Official Phunt bot for announcements and special events.",
                isBot: true,
                isVerified: true,
                isDiscoverable: true,
                badges: ['bot'],
            }
        ];

        const combined = [...hardcodedBots];
        const publicBotIds = new Set(hardcodedBots.map(b => b.uid));

        publicBots.forEach(bot => {
            if (!publicBotIds.has(bot.uid)) {
                combined.push(bot);
                publicBotIds.add(bot.uid);
            }
        });
        
        setAllBots(combined);

    }, [publicBots]);
    
    if (loading) {
        return (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i} className="overflow-hidden">
                        <CardHeader className="flex flex-row items-center gap-4">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-[150px]" />
                                <Skeleton className="h-3 w-[100px]" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-4 w-full mb-2" />
                            <Skeleton className="h-4 w-5/6" />
                        </CardContent>
                        <CardFooter>
                            <Skeleton className="h-10 w-full" />
                        </CardFooter>
                    </Card>
                ))}
            </div>
        )
    }

    return (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {allBots.map(bot => (
                 <BotCard key={bot.uid} bot={bot} />
            ))}
        </div>
         { !loading && allBots.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <h2 className="text-xl font-semibold">No bots found.</h2>
                <p>Check back later for new bots to add to your server!</p>
            </div>
         )}
        </>
    );
}


function BotCard({ bot }: { bot: UserProfile }) {
    const { servers } = useServers(true);
    const { user } = useAuth();
    
    const availableServers = servers.filter(s => s.ownerId === user?.uid && !s.members.includes(bot.uid));

    return (
        <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center gap-4">
                <Avatar className="size-12">
                    <AvatarImage src={bot.photoURL || undefined} alt={bot.displayName}/>
                    <AvatarFallback>{bot.displayName[0]}</AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle className="flex items-center gap-2">
                        {bot.displayName}
                        {bot.isVerified && <Image src="/verified-bot.png" alt="Verified Bot" width={20} height={20} />}
                    </CardTitle>
                    <CardDescription>@{bot.displayName_lowercase}</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="flex-1">
                 <p className="text-sm text-muted-foreground line-clamp-3 h-[60px]">
                    {bot.bio || "No description available."}
                 </p>
            </CardContent>
            <CardFooter>
                <AddBotToServerDialog bot={bot} availableServers={availableServers}>
                    <Button className="w-full">
                        <Bot className="mr-2 size-4" />
                        Add Bot
                    </Button>
                </AddBotToServerDialog>
            </CardFooter>
        </Card>
    );
}

export default function DiscoveryPage() {
    const { servers, loading: userServersLoading, createServer } = useServers();
    
    const loading = userServersLoading;

    useEffect(() => {
        // Ensure the bot users exist so they can be added to servers.
        ensureQolforuBotUser();
        ensurePhuntBotUser();
    }, []);

    return (
        <div className="flex h-screen bg-background/70">
            <Servers 
                servers={servers}
                loading={userServersLoading}
                onCreateServer={createServer}
                selectedServer={null}
                onSelectServer={() => {}}
                onSelectChat={() => {}}
            />

            <div className="flex-1 flex flex-col">
                <header className="p-4 border-b bg-secondary/30">
                    <h1 className="text-2xl font-bold">Discover</h1>
                    <p className="text-muted-foreground">Find new communities and bots.</p>
                </header>
                <main className="flex-1 overflow-y-auto p-6">
                    <Tabs defaultValue="servers" className="w-full">
                      <TabsList className="mb-4">
                        <TabsTrigger value="servers">Servers</TabsTrigger>
                        <TabsTrigger value="bots">Bots</TabsTrigger>
                      </TabsList>
                      <TabsContent value="servers">
                        <ServerList />
                      </TabsContent>
                      <TabsContent value="bots">
                        <BotList />
                      </TabsContent>
                    </Tabs>
                </main>
            </div>
        </div>
    )
}
