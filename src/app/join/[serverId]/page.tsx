
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useServer } from '@/hooks/use-server';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, CheckCircle, XCircle } from 'lucide-react';
import { useServers } from '@/hooks/use-servers';

export default function JoinServerPage() {
    const { serverId } = useParams() as { serverId: string };
    const { server, loading: serverLoading, joinServer } = useServer(serverId);
    const { authUser, loading: authLoading } = useAuth();
    const { servers: userServers, loading: userServersLoading } = useServers();
    const router = useRouter();
    const { toast } = useToast();
    const [isJoining, setIsJoining] = useState(false);

    const isMember = userServers.some(s => s.id === serverId);

    const handleJoin = async () => {
        if (!authUser) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to join a server.' });
            router.push('/login');
            return;
        }

        if (isMember) {
             toast({ title: "Already a member!", description: `You are already in the ${server?.name} server.` });
             router.push('/channels/@me');
             return;
        }
        
        setIsJoining(true);
        try {
            await joinServer(serverId);
            toast({
                title: 'Welcome!',
                description: `You have successfully joined the ${server?.name} server.`,
                className: 'bg-green-500 text-white'
            });
            router.push('/channels/@me');
        } catch (e: any) {
             toast({ variant: 'destructive', title: 'Error', description: e.message });
        } finally {
            setIsJoining(false);
        }
    }


    if (serverLoading || authLoading || userServersLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <p>Loading server details...</p>
            </div>
        )
    }

    if (!server) {
         return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <Card className="w-full max-w-md text-center">
                     <CardHeader>
                        <CardTitle className="text-destructive">Server Not Found</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>This invite link is invalid or has expired.</p>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={() => router.push('/')} className="w-full">Go Home</Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
             <Card className="w-full max-w-md">
                <CardHeader className="items-center text-center">
                    <Avatar className="h-24 w-24 rounded-2xl mb-4">
                        <AvatarImage src={server.photoURL || undefined} alt={server.name}/>
                        <AvatarFallback className="text-4xl">{server.name[0]}</AvatarFallback>
                    </Avatar>
                    <CardDescription>You have been invited to join</CardDescription>
                    <CardTitle className="text-3xl">{server.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center gap-6 text-muted-foreground">
                     <div className="flex items-center gap-2">
                        <CheckCircle className="size-4 text-green-500"/>
                        <span>{server.members.length} Members</span>
                    </div>
                     <div className="flex items-center gap-2">
                        <XCircle className="size-4 text-red-500"/>
                        <span>? Online</span>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleJoin} className="w-full" size="lg" disabled={isJoining || isMember}>
                       {isMember ? "Already Joined" : isJoining ? "Joining..." : "Accept Invite"}
                    </Button>
                </CardFooter>
             </Card>
        </div>
    )
}
