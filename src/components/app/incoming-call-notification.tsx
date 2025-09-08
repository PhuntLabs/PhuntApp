
'use client';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { useCallingStore } from '@/hooks/use-calling-store';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';

export function IncomingCallNotification() {
    const { user } = useAuth();
    const { incomingCall, acceptCall, declineCall } = useCallingStore();

    if (!incomingCall || !user) return null;

    const handleAccept = () => {
        acceptCall(incomingCall, user);
    }

    const handleDecline = () => {
        declineCall(incomingCall);
    }

    return (
        <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-card w-full max-w-sm rounded-2xl flex flex-col items-center p-8 text-center shadow-2xl relative overflow-hidden">
                {incomingCall.caller.bannerURL && (
                    <Image src={incomingCall.caller.bannerURL} alt="" layout="fill" objectFit="cover" className="opacity-20" />
                )}
                <div className="relative z-10">
                    <Avatar className="size-28 border-4 border-background/50 mb-4">
                        <AvatarImage src={incomingCall.caller.photoURL || undefined} />
                        <AvatarFallback className="text-5xl">{incomingCall.caller.displayName[0]}</AvatarFallback>
                    </Avatar>
                    <h2 className="text-3xl font-bold">{incomingCall.caller.displayName}</h2>
                    <p className="text-muted-foreground mt-1">is calling you...</p>

                    <div className="flex items-center justify-center gap-6 mt-8">
                        <div className="flex flex-col items-center gap-2">
                             <Button
                                size="lg"
                                variant="destructive"
                                className="rounded-full size-16"
                                onClick={handleDecline}
                            >
                                <PhoneOff className="size-7" />
                            </Button>
                            <span className="text-sm text-muted-foreground">Decline</span>
                        </div>
                         <div className="flex flex-col items-center gap-2">
                             <Button
                                size="lg"
                                className="rounded-full size-16 bg-green-500 hover:bg-green-600"
                                onClick={handleAccept}
                            >
                                <Phone className="size-7" />
                            </Button>
                            <span className="text-sm text-muted-foreground">Accept</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
