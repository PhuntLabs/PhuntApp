
'use client';

import { useCallingStore } from '@/hooks/use-calling-store';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Mic, MicOff, Phone, ScreenShare, Video, VideoOff, Maximize } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useRemoteUsers } from 'agora-rtc-react';

export function ActiveCallView() {
    const { 
        activeCall, 
        micOn, 
        cameraOn,
        setMicOn, 
        setCameraOn, 
        leaveCall, 
        setShowFullScreen 
    } = useCallingStore();
    const { user } = useAuth();
    const remoteUsers = useRemoteUsers();
    
    if (!activeCall || !user) return null;
    
    const otherParticipant = activeCall.caller.uid === user.uid ? activeCall.callee : activeCall.caller;

    return (
        <div className="bg-background/50 p-2 border-t border-border flex flex-col gap-2">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Avatar className="size-8">
                        <AvatarImage src={otherParticipant.photoURL || undefined} />
                        <AvatarFallback>{otherParticipant.displayName[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="text-sm font-semibold">{otherParticipant.displayName}</p>
                        <p className="text-xs text-muted-foreground">{remoteUsers.length + 1} participants</p>
                    </div>
                </div>
                 <Button variant="ghost" size="icon" className="size-8" onClick={() => setShowFullScreen(true)}>
                    <Maximize className="size-4" />
                </Button>
            </div>
            <div className="flex items-center justify-center gap-2">
                <Button variant={micOn ? 'secondary' : 'destructive'} size="icon" className="size-8" onClick={() => setMicOn(!micOn)}>
                    {micOn ? <Mic className="size-4"/> : <MicOff className="size-4"/>}
                </Button>
                <Button variant="secondary" size="icon" className="size-8" onClick={() => setCameraOn(!cameraOn)}>
                    {cameraOn ? <Video className="size-4"/> : <VideoOff className="size-4"/>}
                </Button>
                <Button variant="secondary" size="icon" className="size-8">
                    <ScreenShare className="size-4"/>
                </Button>
                <Button variant="destructive" size="icon" className="size-8" onClick={() => leaveCall()}>
                    <Phone className="size-4"/>
                </Button>
            </div>
        </div>
    );
}
