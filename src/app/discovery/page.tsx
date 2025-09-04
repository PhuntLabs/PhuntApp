
'use client';

import { usePublicServers } from '@/hooks/use-public-servers';
import { Servers } from '@/components/app/servers';
import { useServers } from '@/hooks/use-servers';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';
import Link from 'next/link';

export default function DiscoveryPage() {
    const { publicServers, loading: publicServersLoading } = usePublicServers();
    const { servers, loading: userServersLoading } = useServers();
    const { user, loading: authLoading } = useAuth();
    
    const loading = publicServersLoading || userServersLoading || authLoading;

    const userServerIds = new Set(servers.map(s => s.id));

    return (
        <div className="flex h-screen bg-background/70">
            {/* The servers component is included for consistent layout, but it won't be interactive on this page */}
            <div className="w-20 flex-shrink-0 h-full flex flex-col items-center py-3 gap-3 bg-background/80 overflow-y-auto" />

            <div className="flex-1 flex flex-col">
                <header className="p-4 border-b bg-secondary/30">
                    <h1 className="text-2xl font-bold">Discover Servers</h1>
                    <p className="text-muted-foreground">Find new communities to join.</p>
                </header>
                <main className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {[...Array(8)].map((_, i) => (
                                <Card key={i} className="flex flex-col">
                                    <CardHeader className="flex flex-row items-center gap-4">
                                        <Skeleton className="h-12 w-12 rounded-lg" />
                                        <div className="space-y-2">
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
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {publicServers.map(server => (
                                <Card key={server.id} className="flex flex-col">
                                    <CardHeader className="flex flex-row items-center gap-4">
                                        <Avatar className="h-12 w-12 rounded-lg">
                                            <AvatarImage src={server.photoURL || undefined} alt={server.name}/>
                                            <AvatarFallback>{server.name[0]}</AvatarFallback>
                                        </Avatar>
                                        <div>
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
                    )}
                     { !loading && publicServers.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                            <h2 className="text-xl font-semibold">No public servers found.</h2>
                            <p>Check back later or make your own server public!</p>
                        </div>
                     )}
                </main>
            </div>
        </div>
    )
}
