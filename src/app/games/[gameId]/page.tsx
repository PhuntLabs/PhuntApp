'use client';

import { useParams, useRouter } from 'next/navigation';
import { Servers } from '@/components/app/servers';
import { useServers } from '@/hooks/use-servers';
import { Button } from '@/components/ui/button';
import { ExternalLink, Fullscreen, X } from 'lucide-react';
import type { Game } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { useState } from 'react';

// This should match the list in /app/games/page.tsx
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

export default function GameViewerPage() {
    const { servers, loading: userServersLoading, createServer } = useServers();
    const params = useParams();
    const router = useRouter();
    const { user, updateUserProfile } = useAuth();
    const [isExiting, setIsExiting] = useState(false);

    const gameId = params.gameId as string;
    const game = mockGames.find(g => g.id === gameId);
    
    const handleFullscreen = () => {
        const iframe = document.getElementById('game-iframe') as HTMLIFrameElement;
        if (iframe && iframe.requestFullscreen) {
            iframe.requestFullscreen();
        }
    };
    
    const handleExitGame = async () => {
        if (!user) return;
        setIsExiting(true);
        try {
            await updateUserProfile({
                customStatus: '',
                currentGame: null,
            });
            router.push('/channels/me');
        } catch (error) {
            console.error('Failed to exit game:', error);
        } finally {
            setIsExiting(false);
        }
    };

    if (!game) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold">Game Not Found</h1>
                    <p className="text-muted-foreground">The game you are looking for does not exist.</p>
                    <Button onClick={() => router.push('/games')} className="mt-4">Back to Game Hub</Button>
                </div>
            </div>
        )
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

            <div className="flex-1 flex flex-col bg-background/50">
                <header className="p-4 border-b flex items-center justify-between bg-secondary/30">
                    <div>
                        <h1 className="text-xl font-bold">{game.name}</h1>
                        <p className="text-sm text-muted-foreground">Now playing: {user?.currentGame?.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                         <Button variant="outline" onClick={handleFullscreen}>
                            <Fullscreen className="mr-2" />
                            Fullscreen
                        </Button>
                         <a href={game.embedUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="secondary">
                                <ExternalLink className="mr-2" />
                                Open in New Tab
                            </Button>
                        </a>
                        <Button variant="destructive" onClick={handleExitGame} disabled={isExiting}>
                            <X className="mr-2" />
                            {isExiting ? 'Exiting...' : 'Exit Game'}
                        </Button>
                    </div>
                </header>
                <main className="flex-1 bg-black">
                   <iframe
                        id="game-iframe"
                        src={game.embedUrl}
                        className="w-full h-full border-none"
                        allow="fullscreen"
                        title={game.name}
                   ></iframe>
                </main>
            </div>
        </div>
    );
}
