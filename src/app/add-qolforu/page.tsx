'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useServers } from '@/hooks/use-servers';
import { useServer } from '@/hooks/use-server';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { QOLFORU_BOT_ID, QOLFORU_BOT_USERNAME, QOLFORU_BOT_PHOTO_URL } from '@/ai/bots/qolforu-config';
import { Loader2 } from 'lucide-react';
import type { UserProfile } from '@/lib/types';
import Link from 'next/link';

async function ensureBotUser(): Promise<UserProfile> {
    const botUserRef = doc(db, 'users', QOLFORU_BOT_ID);
    const botUserDoc = await getDoc(botUserRef);
    if (!botUserDoc.exists()) {
        console.log(`Bot user not found. Creating '${QOLFORU_BOT_USERNAME}'...`);
        const botData: Omit<UserProfile, 'id'> = {
            uid: QOLFORU_BOT_ID,
            displayName: QOLFORU_BOT_USERNAME,
            displayName_lowercase: QOLFORU_BOT_USERNAME.toLowerCase(),
            email: 'qolforu@whisper.chat',
            isBot: true,
            isDiscoverable: true,
            isVerified: true,
            photoURL: QOLFORU_BOT_PHOTO_URL,
            bio: "I'm qolforu, a bot designed to bring quality-of-life features to your server. Use my commands like /poll and /embed to spice up your conversations!",
            createdAt: serverTimestamp(),
            badges: ['bot']
        };
        await setDoc(botUserRef, botData);
        console.log("qolforu-bot user created in Firestore.");
        return { id: QOLFORU_BOT_ID, ...botData };
    }
    return { id: botUserDoc.id, ...botUserDoc.data() } as UserProfile;
}


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
            const bot = await ensureBotUser();
            await addBotToServer(bot.uid, selectedServerId);
            toast({ title: 'Success!', description: `${bot.displayName} has been added to your server.` });
            router.push('/');
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
             <div className="flex min-h-screen items-center justify-center">
                 <Card className="w-full max-w-md text-center">
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
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
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
