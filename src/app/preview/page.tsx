
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Eye, CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { joinPreview } from '@/ai/flows/join-preview-flow';

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

export default function PreviewPage() {
    const { user, authUser, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [isJoining, setIsJoining] = useState(false);

    const hasBetaBadge = user?.badges?.includes('beta tester');

    const handleJoin = async () => {
        if (!authUser) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to join the preview program.' });
            router.push('/login');
            return;
        }

        if (hasBetaBadge) {
             toast({ title: "You're already in!", description: `You are already a member of the Preview Program.` });
             router.push('/channels/me');
             return;
        }
        
        setIsJoining(true);
        try {
            await joinPreview({ userId: authUser.uid });
            toast({
                title: 'Welcome to the Preview!',
                description: `You now have the Beta Tester badge and will see new features early.`,
                className: 'bg-green-500 text-white'
            });
            router.push('/channels/me');
        } catch (e: any) {
             toast({ variant: 'destructive', title: 'Error', description: e.message });
        } finally {
            setIsJoining(false);
        }
    }


    if (authLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <Loader2 className="size-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="relative flex min-h-screen items-center justify-center bg-background p-4 overflow-hidden">
            <Starfield />
             <Card className="w-full max-w-md bg-card/30 backdrop-blur-sm z-10">
                <CardHeader className="items-center text-center">
                    <div className="p-4 rounded-full bg-primary/20 mb-4">
                        <Eye className="size-12 text-primary" />
                    </div>
                    <CardTitle className="text-3xl">Phunt Preview Program</CardTitle>
                    <CardDescription>Get early access to new features and help shape the future of Phunt.</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground text-center space-y-2">
                    <p>By joining, you'll be among the first to test new updates, from small tweaks to major new features like Voice & Video calling.</p>
                    <p>You'll receive a special "Beta Tester" badge on your profile!</p>
                </CardContent>
                <CardFooter className="flex-col gap-2">
                    <Button onClick={handleJoin} className="w-full" size="lg" disabled={isJoining || hasBetaBadge}>
                       {isJoining ? <Loader2 className="mr-2 animate-spin"/> : hasBetaBadge ? <CheckCircle className="mr-2"/> : null}
                       {hasBetaBadge ? "You're a Beta Tester" : isJoining ? "Joining..." : "Join the Preview"}
                    </Button>
                    <Button asChild variant="link" size="sm">
                        <Link href="/">Back to Home</Link>
                    </Button>
                </CardFooter>
             </Card>
        </div>
    )
}
