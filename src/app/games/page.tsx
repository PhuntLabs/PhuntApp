'use client';

import { useState } from 'react';
import { Servers } from '@/components/app/servers';
import { useServers } from '@/hooks/use-servers';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

interface Game {
    id: string;
    name: string;
    description: string;
    logoUrl: string;
    bannerUrl: string;
}

const mockGames: Game[] = [
    {
        id: 'cosmic-rift',
        name: 'Cosmic Rift',
        description: 'Explore a vast, procedurally generated universe, trade resources, and battle pirates in this epic space adventure.',
        logoUrl: 'https://picsum.photos/seed/cosmic-rift-logo/200',
        bannerUrl: 'https://picsum.photos/seed/cosmic-rift-banner/600/400',
    },
    {
        id: 'valor-quest',
        name: 'Valor Quest',
        description: 'A fantasy RPG where you assemble a team of heroes to defeat the encroaching darkness and save the kingdom.',
        logoUrl: 'https://picsum.photos/seed/valor-quest-logo/200',
        bannerUrl: 'https://picsum.photos/seed/valor-quest-banner/600/400',
    },
    {
        id: 'speed-demons',
        name: 'Speed Demons',
        description: 'High-octane arcade racing with customizable cars and thrilling tracks. Race against friends or climb the leaderboards.',
        logoUrl: 'https://picsum.photos/seed/speed-demons-logo/200',
        bannerUrl: 'https://picsum.photos/seed/speed-demons-banner/600/400',
    },
    {
        id: 'cyber-ops',
        name: 'Cyber Ops',
        description: 'A tactical first-person shooter set in a dystopian future. Use advanced gadgets to outsmart your opponents.',
        logoUrl: 'https://picsum.photos/seed/cyber-ops-logo/200',
        bannerUrl: 'https://picsum.photos/seed/cyber-ops-banner/600/400',
    }
];


export default function GamesPage() {
    const { servers, loading: userServersLoading, createServer } = useServers();
    const { user, updateUserProfile } = useAuth();
    const { toast } = useToast();
    const [launchingGame, setLaunchingGame] = useState<string | null>(null);
    
    const handleLaunchGame = async (game: Game) => {
        if (!user) return;
        setLaunchingGame(game.id);

        try {
            await updateUserProfile({
                customStatus: `Playing ${game.name}`,
                currentGame: game,
            });
            toast({
                title: 'Game Launched!',
                description: `Your status is now "Playing ${game.name}".`,
            });
        } catch (error: any) {
             toast({
                variant: 'destructive',
                title: 'Failed to launch game',
                description: error.message,
            });
        } finally {
            setLaunchingGame(null);
        }
    }


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
                    <h1 className="text-2xl font-bold">Game Hub</h1>
                    <p className="text-muted-foreground">Discover and launch games directly from the app.</p>
                </header>
                <main className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {mockGames.map(game => (
                            <Card key={game.id} className="flex flex-col overflow-hidden group">
                                 <div className="h-32 w-full relative">
                                    <Image src={game.bannerUrl} alt={`${game.name} banner`} fill style={{ objectFit: 'cover' }} className="group-hover:scale-105 transition-transform duration-300" data-ai-hint="game banner"/>
                                 </div>
                                <CardHeader className="flex flex-row items-center gap-4 -mt-10 z-10">
                                    <Image src={game.logoUrl} alt={`${game.name} logo`} width={80} height={80} className="rounded-lg border-4 border-background shrink-0" data-ai-hint="game logo"/>
                                    <div className="pt-8 overflow-hidden">
                                        <CardTitle className="text-lg truncate">{game.name}</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <CardDescription className="line-clamp-3 h-[60px]">
                                        {game.description}
                                    </CardDescription>
                                </CardContent>
                                <CardFooter>
                                    <Button className="w-full" onClick={() => handleLaunchGame(game)} disabled={launchingGame === game.id}>
                                        {launchingGame === game.id ? "Launching..." : user?.currentGame?.id === game.id ? "Playing" : "Launch Game"}
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </main>
            </div>
        </div>
    )
}
