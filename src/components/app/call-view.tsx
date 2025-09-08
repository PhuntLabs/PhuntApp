
'use client';

import { useCallingStore } from '@/hooks/use-calling-store';
import { AgoraRTCProvider, useRTCClient, useRemoteUsers, useLocalCameraTrack, useLocalMicrophoneTrack, LocalVideoTrack, RemoteUser } from 'agora-rtc-react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useEffect } from 'react';

function CallControls() {
    const { micOn, setMicOn, cameraOn, setCameraOn, leaveCall, isScreensharing, setIsScreensharing } = useCallingStore();
    const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn);
    const { localCameraTrack } = useLocalCameraTrack(cameraOn);

    const handleMicToggle = async () => {
        await localMicrophoneTrack?.setMuted(micOn);
        setMicOn(!micOn);
    }

    const handleCameraToggle = async () => {
        await localCameraTrack?.setMuted(cameraOn);
        setCameraOn(!cameraOn);
    }
    
    const handleScreenshare = () => {
        // Actual screensharing logic would be more involved with Agora SDK
        setIsScreensharing(!isScreensharing);
        toast({ title: isScreensharing ? 'Screensharing Stopped' : 'Screensharing Started' });
    }
    
    return (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-background/50 backdrop-blur-sm p-3 rounded-full shadow-2xl">
            <Button variant={cameraOn ? 'secondary' : 'destructive'} size="icon" className="rounded-full size-14" onClick={handleCameraToggle}>
                {cameraOn ? <Video /> : <VideoOff />}
            </Button>
             <Button variant={micOn ? 'secondary' : 'destructive'} size="icon" className="rounded-full size-14" onClick={handleMicToggle}>
                {micOn ? <Mic /> : <MicOff />}
            </Button>
             <Button variant={isScreensharing ? 'default' : 'secondary'} size="icon" className="rounded-full size-14" onClick={handleScreenshare}>
                <Monitor />
            </Button>
            <Button variant="destructive" size="icon" className="rounded-full size-14" onClick={() => leaveCall()}>
                <PhoneOff />
            </Button>
        </div>
    );
}

function VideoPlayer({ user }: { user: any }) {
    const displayName = user.displayName || user.uid.toString();
    return (
        <div className="relative aspect-square rounded-full bg-secondary overflow-hidden flex items-center justify-center">
            {user.hasVideo ? (
                <RemoteUser user={user} playVideo={true} playAudio={true} className="w-full h-full object-cover"/>
            ) : (
                <Avatar className="size-full">
                     <AvatarImage src={user.photoURL || undefined} alt={displayName} />
                    <AvatarFallback className="text-4xl">{displayName[0]}</AvatarFallback>
                </Avatar>
            )}
             {!user.hasAudio && <MicOff className="absolute bottom-2 right-2 text-white bg-black/50 p-1.5 rounded-full size-7" />}
        </div>
    );
}

function LocalVideoPlayer() {
    const { cameraOn, activeCall } = useCallingStore();
    const { localCameraTrack } = useLocalCameraTrack(cameraOn);
    const user = activeCall?.caller;

    return (
         <div className="relative aspect-square rounded-full bg-secondary overflow-hidden flex items-center justify-center">
            {cameraOn ? (
                <LocalVideoTrack track={localCameraTrack} play={true} className="w-full h-full object-cover" />
            ) : (
                 <Avatar className="size-full">
                    <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName} />
                    <AvatarFallback className="text-4xl">{user?.displayName?.[0] || 'Y'}</AvatarFallback>
                </Avatar>
            )}
        </div>
    )
}


function CallRoom() {
  const remoteUsers = useRemoteUsers();
  
  return (
    <div className="flex flex-col items-center justify-center h-full w-full gap-8">
        <div className="flex items-center justify-center gap-8">
            <div className="size-48"><LocalVideoPlayer /></div>
            {remoteUsers.map(user => (
                 <div key={user.uid} className="size-48"><VideoPlayer user={user} /></div>
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

        agoraClient.on('user-published', async (user, mediaType) => {
            await agoraClient.subscribe(user, mediaType);
            if (mediaType === 'video') {
                // Video track is available
            }
            if (mediaType === 'audio') {
                user.audioTrack?.play();
            }
        });
        
        agoraClient.on('user-unpublished', (user, mediaType) => {
             if (mediaType === 'audio') {
                user.audioTrack?.stop();
            }
        });

        agoraClient.on('user-left', () => {
             // Handle user leaving if necessary
        });

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

// Add this to your globals.css to ensure video fills the avatar circle
/*
.agora_video_player {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
*/
