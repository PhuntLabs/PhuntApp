
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useServers } from '@/hooks/use-servers';
import { useServer } from '@/hooks/use-server';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ensureQolforuBotUser } from '@/ai/flows/qolforu-bot-flow';
import { QOLFORU_BOT_PHOTO_URL } from '@/ai/bots/qolforu-config';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

const Starfield = () => {
    const [stars, setStars] = useState<React.ReactNode[]>([]);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (isClient) {
            const generateStars = () => {
                const newStars = [...Array(100)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute bg-white rounded-full star"
                        style={{
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                            width: `${Math.random() * 2 + 1}px`,
                            height: `${Math.random() * 2 + 1}px`,
                            animationDelay: `${Math.random() * 5}s`,
                            animationDuration: `${2 + Math.random() * 3}s`,
                        }}
                    />
                ));
                setStars(newStars);
            };
            generateStars();
        }
    }, [isClient]);

    if (!isClient) return null;

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {stars}
        </div>
    );
};


export default function AddQolforuPage() {
    const { user, authUser, loading: authLoading } = useAuth();
    const { servers, loading: serversLoading } = useServers(!!authUser);
    const { addBotToServer } = useServer(undefined);
    const { toast } = useToast();
    const router = useRouter();

    const [selectedServerId, setSelectedServerId] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    
    const ownedServers = servers.filter(s => s.ownerId === user?.uid);

    const handleAddBot = async () => {
        if (!selectedServerId) {
            toast({ variant: 'destructive', title: 'Please select a server.' });
            return;
        }
        setIsAdding(true);
        try {
            const bot = await ensureQolforuBotUser();
            await addBotToServer(bot.uid, selectedServerId);
            toast({ title: 'Success!', description: `${bot.displayName} has been added to your server.` });
            router.push('/channels/me');
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        } finally {
            setIsAdding(false);
        }
    };

    if (authLoading || serversLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="size-8 animate-spin" />
            </div>
        );
    }
    
    if (!authUser) {
        return (
             <div className="relative flex min-h-screen items-center justify-center bg-background p-4 overflow-hidden">
                <Starfield />
                 <Card className="w-full max-w-md text-center bg-card/60 backdrop-blur-sm z-10">
                    <CardHeader>
                        <CardTitle>Authentication Required</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>You must be logged in to add a bot to a server.</p>
                    </CardContent>
                    <CardContent>
                         <Link href="/login">
                            <Button className="w-full">Login</Button>
                        </Link>
                    </CardContent>
                </Card>
             </div>
        )
    }

    return (
        <div className="relative flex min-h-screen items-center justify-center bg-background p-4 overflow-hidden">
            <Starfield />
            <Card className="w-full max-w-md bg-card/60 backdrop-blur-sm z-10">
                <CardHeader className="items-center text-center">
                    <Avatar className="size-24 mb-4">
                        <AvatarImage src={QOLFORU_BOT_PHOTO_URL} />
                        <AvatarFallback>Q</AvatarFallback>
                    </Avatar>
                    <CardTitle>Add @qolforu Bot</CardTitle>
                    <CardDescription>
                        This bot provides quality-of-life commands like /poll and /embed to your server.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Add to Server</label>
                        {ownedServers.length > 0 ? (
                             <Select value={selectedServerId} onValueChange={setSelectedServerId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select one of your servers..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {ownedServers.map(server => (
                                        <SelectItem key={server.id} value={server.id}>{server.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md text-center">
                                You don't own any servers. Create one first!
                            </p>
                        )}
                    </div>
                </CardContent>
                <CardFooter className="flex-col gap-2">
                    <Button onClick={handleAddBot} className="w-full" disabled={isAdding || !selectedServerId}>
                        {isAdding && <Loader2 className="mr-2 size-4 animate-spin"/>}
                        Authorize & Add
                    </Button>
                     <Button variant="link" size="sm" asChild>
                        <Link href="/discovery">Back to Discovery</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
