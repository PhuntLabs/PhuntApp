
'use client';

import { useCallingStore } from '@/hooks/use-calling-store';
import { AgoraRTCProvider, useRTCClient, useRemoteUsers, useLocalCameraTrack, useLocalMicrophoneTrack, LocalVideoTrack, RemoteUser } from 'agora-rtc-react';
import AgoraRTC, { IRemoteVideoTrack, IRemoteAudioTrack } from 'agora-rtc-sdk-ng';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Monitor, Minimize, ScreenShare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

function CallControls() {
    const { micOn, setMicOn, cameraOn, setCameraOn, leaveCall, isScreensharing, setIsScreensharing, setShowFullScreen } = useCallingStore();

    const handleScreenshare = () => {
        // Actual screensharing logic would be more involved with Agora SDK
        setIsScreensharing(!isScreensharing);
        toast({ title: isScreensharing ? 'Screensharing Stopped' : 'Screensharing Started' });
    }
    
    return (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-background/50 backdrop-blur-sm p-3 rounded-full shadow-2xl">
            <Button variant={cameraOn ? 'secondary' : 'destructive'} size="icon" className="rounded-full size-14" onClick={() => setCameraOn(!cameraOn)}>
                {cameraOn ? <Video /> : <VideoOff />}
            </Button>
             <Button variant={micOn ? 'secondary' : 'destructive'} size="icon" className="rounded-full size-14" onClick={() => setMicOn(!micOn)}>
                {micOn ? <Mic /> : <MicOff />}
            </Button>
             <Button variant={isScreensharing ? 'default' : 'secondary'} size="icon" className="rounded-full size-14" onClick={handleScreenshare}>
                <ScreenShare />
            </Button>
            <Button variant="destructive" size="icon" className="rounded-full size-14" onClick={() => leaveCall()}>
                <PhoneOff />
            </Button>
             <Button variant="secondary" size="icon" className="rounded-full size-14" onClick={() => setShowFullScreen(false)}>
                <Minimize />
            </Button>
        </div>
    );
}

function VideoPlayer({ user, talking }: { user: any, talking: boolean }) {
    const displayName = user.displayName || user.uid.toString();
    
    return (
        <div className={cn(
            "relative aspect-video w-full max-w-lg rounded-lg bg-secondary overflow-hidden flex items-center justify-center border-2 transition-all",
             talking ? "border-green-500" : "border-transparent"
        )}>
            {user.hasVideo ? (
                <RemoteUser user={user} playVideo={true} playAudio={true} className="w-full h-full object-cover"/>
            ) : (
                <Avatar className="size-24">
                     <AvatarImage src={user.photoURL || undefined} alt={displayName} />
                    <AvatarFallback className="text-4xl">{displayName[0]}</AvatarFallback>
                </Avatar>
            )}
            <div className="absolute bottom-2 left-2 flex items-center gap-2 bg-black/30 p-1.5 rounded-lg">
                 {!user.hasAudio && <MicOff className="text-white size-5" />}
                 <span className="text-white text-sm font-semibold">{displayName}</span>
            </div>
        </div>
    );
}

function LocalVideoPlayer({ talking }: { talking: boolean }) {
    const { cameraOn, activeCall } = useCallingStore();
    const { localCameraTrack } = useLocalCameraTrack();
    const user = useAuth().user;

    return (
         <div className={cn(
            "relative aspect-video w-full max-w-lg rounded-lg bg-secondary overflow-hidden flex items-center justify-center border-2 transition-all",
             talking ? "border-green-500" : "border-transparent"
         )}>
            {cameraOn ? (
                <LocalVideoTrack track={localCameraTrack} play={true} className="w-full h-full object-cover" />
            ) : (
                 <Avatar className="size-24">
                    <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName} />
                    <AvatarFallback className="text-4xl">{user?.displayName?.[0] || 'Y'}</AvatarFallback>
                </Avatar>
            )}
             <div className="absolute bottom-2 left-2 flex items-center gap-2 bg-black/30 p-1.5 rounded-lg">
                 <span className="text-white text-sm font-semibold">{user?.displayName}</span>
            </div>
        </div>
    )
}


function CallRoom() {
    const remoteUsers = useRemoteUsers();
    const { agoraClient } = useCallingStore();
    const [loudestSpeaker, setLoudestSpeaker] = useState<string | number | undefined>(undefined);

    useEffect(() => {
        if (!agoraClient) return;

        const handleVolumeIndicator = (volumes: any[]) => {
            const loudest = volumes.reduce(
                (acc: any, current: any) => (current.level > acc.level ? current : acc),
                { level: 0, uid: undefined }
            );
            if (loudest.level > 10) {
                 setLoudestSpeaker(loudest.uid);
            } else {
                setLoudestSpeaker(undefined);
            }
        };

        agoraClient.on('volume-indicator', handleVolumeIndicator);
        agoraClient.enableAudioVolumeIndicator();

        return () => {
            agoraClient.off('volume-indicator', handleVolumeIndicator);
        };
    }, [agoraClient]);
  
  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-8 gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full h-full items-center justify-center">
            <LocalVideoPlayer talking={loudestSpeaker === agoraClient?.uid} />
            {remoteUsers.map(user => (
                 <VideoPlayer key={user.uid} user={user} talking={loudestSpeaker === user.uid}/>
            ))}
        </div>
        <CallControls />
    </div>
  );
}


export function CallView() {
    const { activeCall, agoraClient } = useCallingStore();

    useEffect(() => {
        if (!agoraClient) return;

        const handleUserPublished = async (user: any, mediaType: 'audio' | 'video') => {
            await agoraClient.subscribe(user, mediaType);
            if (mediaType === 'audio') {
                user.audioTrack?.play();
            }
        };
        
        agoraClient.on('user-published', handleUserPublished);

        return () => {
            agoraClient.off('user-published', handleUserPublished);
        }
    }, [agoraClient]);


    if (!activeCall || !agoraClient) return null;

    return (
        <div className="fixed inset-0 bg-background/95 z-[100] flex items-center justify-center">
            <AgoraRTCProvider client={agoraClient}>
                <CallRoom />
            </AgoraRTCProvider>
        </div>
    );
}

// Add this to your globals.css to ensure video fills the container
/*
.agora_video_player video {
    width: 100% !important;
    height: 100% !important;
    object-fit: cover !important;
}
*/
