
'use client';

import { useState } from 'react';
import { Servers } from '@/components/app/servers';
import { useServers } from '@/hooks/use-servers';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import type { Song } from '@/lib/types';
import { musicLibrary } from '@/lib/music-data';
import { Play, Pause, Music } from 'lucide-react';

export default function MusicPage() {
    const { servers, loading: userServersLoading, createServer } = useServers();
    const { user, updateUserProfile } = useAuth();
    const { toast } = useToast();
    const [playingSong, setPlayingSong] = useState<Song | null>(null);

    const handlePlayPause = async (song: Song) => {
        if (!user) return;
        
        let newStatus: string;
        let newSong: Song | null;

        if (playingSong?.id === song.id) {
            newStatus = '';
            newSong = null;
        } else {
            newStatus = `Listening to ${song.title}`;
            newSong = song;
        }

        try {
            await updateUserProfile({
                customStatus: newStatus,
                currentSong: newSong,
            });
            setPlayingSong(newSong);
            if(newSong) {
                toast({
                    title: 'Now Playing',
                    description: `${song.title} by ${song.artist}`,
                });
            } else {
                 toast({
                    title: 'Music Stopped',
                });
            }
        } catch (error: any) {
             toast({
                variant: 'destructive',
                title: 'Failed to update status',
                description: error.message,
            });
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
                    <h1 className="text-2xl font-bold">Music Library</h1>
                    <p className="text-muted-foreground">Play music and share what you're listening to.</p>
                </header>
                <main className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {musicLibrary.map(song => (
                            <Card key={song.id} className="flex flex-col overflow-hidden group">
                                 <div className="h-40 w-full relative">
                                    <Image src={song.albumArtUrl} alt={`${song.title} album art`} fill style={{ objectFit: 'cover' }} className="group-hover:scale-105 transition-transform duration-300" data-ai-hint="album art"/>
                                 </div>
                                <CardHeader className="flex-1">
                                    <CardTitle className="text-base truncate">{song.title}</CardTitle>
                                    <CardDescription>{song.artist}</CardDescription>
                                </CardHeader>
                                <CardFooter>
                                    <Button className="w-full" onClick={() => handlePlayPause(song)}>
                                        {playingSong?.id === song.id ? <Pause className="mr-2"/> : <Play className="mr-2"/>}
                                        {playingSong?.id === song.id ? "Pause" : "Play"}
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

    