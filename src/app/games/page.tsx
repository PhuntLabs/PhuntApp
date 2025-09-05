
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
import { useRouter } from 'next/navigation';
import type { Game } from '@/lib/types';


const mockGames: Game[] = [
    {
        id: 'snow-rider-3d',
        name: 'Snow Rider 3D',
        description: 'Ride your sleigh down a snowy mountain, avoid obstacles, and collect gifts in this fast-paced 3D game.',
        logoUrl: 'https://picsum.photos/seed/snow-rider-logo/200',
        bannerUrl: 'https://picsum.photos/seed/snow-rider-banner/600/400',
        embedUrl: 'https://snow3d.pages.dev/',
    },
    {
        id: 'cool-math-games',
        name: 'Cool Math Games',
        description: 'The official hub for thousands of free online math games, logic puzzles, and strategy games for all ages.',
        logoUrl: 'https://picsum.photos/seed/cool-math-logo/200',
        bannerUrl: 'https://picsum.photos/seed/cool-math-banner/600/400',
        embedUrl: 'https://www.coolmath-games.com/',
    },
    {
        id: '2048',
        name: '2048',
        description: 'Join the numbers and get to the 2048 tile! A classic and addictive puzzle game that will test your logic.',
        logoUrl: 'https://picsum.photos/seed/2048-logo/200',
        bannerUrl: 'https://picsum.photos/seed/2048-banner/600/400',
        embedUrl: 'https://play2048.co/',
    },
    {
        id: 'slope',
        name: 'Slope',
        description: 'Control a ball rolling down a steep slope. Avoid obstacles and keep your ball on the randomly generated course.',
        logoUrl: 'https://picsum.photos/seed/slope-logo/200',
        bannerUrl: 'https://picsum.photos/seed/slope-banner/600/400',
        embedUrl: 'https://slopegame.io/',
    },
    {
        id: 'retro-bowl',
        name: 'Retro Bowl',
        description: 'A retro-style American football game. Manage your team, call the plays, and lead your franchise to glory.',
        logoUrl: 'https://picsum.photos/seed/retro-bowl-logo/200',
        bannerUrl: 'https://picsum.photos/seed/retro-bowl-banner/600/400',
        embedUrl: 'https://retrobowl.me/',
    },
    {
        id: 'cookie-clicker',
        name: 'Cookie Clicker',
        description: 'An incremental game where you click a cookie to get more cookies, then buy upgrades to bake even faster.',
        logoUrl: 'https://picsum.photos/seed/cookie-clicker-logo/200',
        bannerUrl: 'https://picsum.photos/seed/cookie-clicker-banner/600/400',
        embedUrl: 'https://cookieclicker.ee/',
    },
    {
        id: 'flappy-bird',
        name: 'Flappy Bird',
        description: 'Navigate the iconic bird through a series of pipes. A simple yet notoriously difficult classic.',
        logoUrl: 'https://picsum.photos/seed/flappy-bird-logo/200',
        bannerUrl: 'https://picsum.photos/seed/flappy-bird-banner/600/400',
        embedUrl: 'https://flappybird.io/',
    }
];


export default function GamesPage() {
    const { servers, loading: userServersLoading, createServer } = useServers();
    const { user, updateUserProfile } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
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
            router.push(`/games/${game.id}`);
        } catch (error: any) {
             toast({
                variant: 'destructive',
                title: 'Failed to launch game',
                description: error.message,
            });
        } finally {
            // Keep launching state until page navigation completes
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
