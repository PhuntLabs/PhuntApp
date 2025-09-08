'use client';

import { useCallingStore } from '@/hooks/use-calling-store';
import { AgoraRTCProvider, useRTCClient, useRemoteUsers, useLocalCameraTrack, useLocalMicrophoneTrack, LocalVideoTrack, RemoteUser } from 'agora-rtc-react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

function CallControls() {
    const { micOn, setMicOn, cameraOn, setCameraOn, leaveCall } = useCallingStore();
    const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn);
    const { localCameraTrack } = useLocalCameraTrack(cameraOn);

    const handleMicToggle = async () => {
        await localMicrophoneTrack?.setMuted(!micOn);
        setMicOn(!micOn);
    }

    const handleCameraToggle = async () => {
        await localCameraTrack?.setMuted(!cameraOn);
        setCameraOn(!cameraOn);
    }
    
    return (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-background/50 backdrop-blur-sm p-2 rounded-full">
            <Button variant={micOn ? 'secondary' : 'destructive'} size="icon" className="rounded-full" onClick={handleMicToggle}>
                {micOn ? <Mic /> : <MicOff />}
            </Button>
            <Button variant={cameraOn ? 'secondary' : 'destructive'} size="icon" className="rounded-full" onClick={handleCameraToggle}>
                {cameraOn ? <Video /> : <VideoOff />}
            </Button>
            <Button variant="destructive" size="icon" className="rounded-full" onClick={leaveCall}>
                <PhoneOff />
            </Button>
        </div>
    );
}

function VideoPlayer({ user, hasVideo, hasAudio }: { user: any; hasVideo: boolean; hasAudio: boolean }) {
    const displayName = user.uid ? user.uid.toString() : 'User';
    return (
        <div className="relative aspect-video bg-secondary rounded-lg overflow-hidden flex items-center justify-center">
            {hasVideo ? (
                <RemoteUser user={user} playVideo={true} playAudio={true} />
            ) : (
                <Avatar className="size-24">
                    <AvatarFallback className="text-4xl">{displayName[0]}</AvatarFallback>
                </Avatar>
            )}
             {!hasAudio && <MicOff className="absolute top-2 right-2 text-white bg-black/30 p-1 rounded-full" />}
             <p className="absolute bottom-2 left-2 text-white bg-black/30 px-2 py-1 rounded-full text-sm">{displayName}</p>
        </div>
    );
}


function CallRoom() {
  const agoraClient = useRTCClient();
  const remoteUsers = useRemoteUsers();
  const { micOn } = useLocalMicrophoneTrack();
  const { cameraOn } = useLocalCameraTrack();

  const totalParticipants = remoteUsers.length + 1;
  const gridClasses = {
      1: "grid-cols-1 grid-rows-1",
      2: "grid-cols-2 grid-rows-1",
      3: "grid-cols-2 grid-rows-2",
      4: "grid-cols-2 grid-rows-2",
      5: "grid-cols-3 grid-rows-2",
      6: "grid-cols-3 grid-rows-2",
  };

  return (
    <div className={cn("grid gap-4 p-4 h-full w-full", gridClasses[totalParticipants as keyof typeof gridClasses] || 'grid-cols-3 grid-rows-3')}>
        <div className="relative aspect-video bg-secondary rounded-lg overflow-hidden flex items-center justify-center">
            {cameraOn ? (
                <LocalVideoTrack track={useLocalCameraTrack(cameraOn).localCameraTrack} play={true} />
            ) : (
                 <Avatar className="size-24">
                    <AvatarFallback className="text-4xl">Y</AvatarFallback>
                </Avatar>
            )}
             <p className="absolute bottom-2 left-2 text-white bg-black/30 px-2 py-1 rounded-full text-sm">You</p>
        </div>
        {remoteUsers.map(user => (
            <VideoPlayer key={user.uid} user={user} hasVideo={user.hasVideo} hasAudio={user.hasAudio}/>
        ))}
        <CallControls />
    </div>
  );
}


export function CallView() {
    const { activeCall, agoraClient } = useCallingStore();

    if (!activeCall || !agoraClient) return null;

    return (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center">
            <AgoraRTCProvider client={agoraClient}>
                <CallRoom />
            </AgoraRTCProvider>
        </div>
    );
}
