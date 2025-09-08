
'use client';

import { useCallingStore } from '@/hooks/use-calling-store';
import { AgoraRTCProvider, useRTCClient, useRemoteUsers, useLocalCameraTrack, LocalVideoTrack, RemoteUser } from 'agora-rtc-react';
import type { IRemoteVideoTrack, IRemoteAudioTrack, IAgoraRTCClient } from 'agora-rtc-sdk-ng';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Maximize, Phone, ScreenShare, Minimize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { UserProfile } from '@/lib/types';


const VideoPlayer = ({ user, isMainView, onSetMainView, talking }: { user: UserProfile, isMainView: boolean, onSetMainView: () => void, talking: boolean }) => {
    const hasVideo = user.video;
    const hasAudio = user.audio;

    return (
        <div
            className={cn(
                "relative bg-secondary rounded-lg overflow-hidden flex items-center justify-center cursor-pointer transition-all duration-300",
                isMainView ? "col-span-2 row-span-2" : "aspect-video",
                talking && !isMainView ? "ring-2 ring-green-500" : ""
            )}
            onClick={onSetMainView}
        >
            {hasVideo ? (
                <RemoteUser user={user} playVideo={true} playAudio={true} className="w-full h-full object-cover" />
            ) : (
                <Avatar className={cn("size-24 transition-all", isMainView ? 'size-32' : 'size-20')}>
                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName} />
                    <AvatarFallback className="text-4xl">{user.displayName[0]}</AvatarFallback>
                </Avatar>
            )}
            <div className="absolute bottom-2 left-2 flex items-center gap-2 bg-black/30 p-1.5 rounded-lg">
                 {!hasAudio && <MicOff className="text-white size-5" />}
                 <span className="text-white text-sm font-semibold">{user.displayName}</span>
            </div>
             {isMainView && talking && <div className="absolute inset-0 border-4 border-green-500 rounded-lg pointer-events-none" />}
        </div>
    )
}

const LocalPlayer = ({ isMainView, onSetMainView, talking }: { isMainView: boolean, onSetMainView: () => void, talking: boolean }) => {
    const { cameraOn, micOn } = useCallingStore();
    const { user } = useAuth();
    const { localCameraTrack } = useLocalCameraTrack();
    
    return (
        <div
            className={cn(
                "relative bg-secondary rounded-lg overflow-hidden flex items-center justify-center cursor-pointer transition-all duration-300",
                isMainView ? "col-span-2 row-span-2" : "aspect-video",
                talking && !isMainView ? "ring-2 ring-green-500" : ""
            )}
            onClick={onSetMainView}
        >
            {cameraOn ? (
                 <LocalVideoTrack track={localCameraTrack} play={true} className="w-full h-full object-cover" />
            ) : (
                <Avatar className={cn("size-24 transition-all", isMainView ? 'size-32' : 'size-20')}>
                    <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName} />
                    <AvatarFallback className="text-4xl">{user?.displayName?.[0] || 'Y'}</AvatarFallback>
                </Avatar>
            )}
            <div className="absolute bottom-2 left-2 flex items-center gap-2 bg-black/30 p-1.5 rounded-lg">
                 {!micOn && <MicOff className="text-white size-5" />}
                 <span className="text-white text-sm font-semibold">{user?.displayName}</span>
            </div>
            {isMainView && talking && <div className="absolute inset-0 border-4 border-green-500 rounded-lg pointer-events-none" />}
        </div>
    )
}


function CallRoomInternal() {
    const {
        activeCall,
        micOn,
        setMicOn,
        cameraOn,
        setCameraOn,
        leaveCall,
        mainViewUserId,
        setMainViewUserId,
    } = useCallingStore();

    const remoteUsers = useRemoteUsers();
    const { user: localUser } = useAuth();
    const [loudestSpeaker, setLoudestSpeaker] = useState<string | number | undefined>(undefined);
    const agoraClient = useRTCClient();

    useEffect(() => {
        if (!agoraClient) return;
        const handleVolume = (volumes: any[]) => {
            const loudest = volumes.find(v => v.level > 10);
            setLoudestSpeaker(loudest ? loudest.uid : undefined);
        }
        agoraClient.on('volume-indicator', handleVolume);
        agoraClient.enableAudioVolumeIndicator();
        return () => { agoraClient.off('volume-indicator', handleVolume) };
    }, [agoraClient]);


    if (!activeCall || !localUser) return null;

    const allParticipants = [localUser, ...remoteUsers.map(u => ({...u, uid: u.uid.toString()}))] as UserProfile[];
    const mainViewUser = allParticipants.find(p => p.uid === mainViewUserId);
    const otherParticipants = allParticipants.filter(p => p.uid !== mainViewUserId);


    return (
        <div className="flex flex-col h-full bg-card/50">
            <div className="flex-1 p-2 grid grid-cols-2 gap-2 grid-rows-[repeat(2,minmax(0,1fr))]">
                {mainViewUser?.uid === localUser.uid ? (
                    <LocalPlayer isMainView={true} onSetMainView={() => {}} talking={loudestSpeaker === agoraClient.uid} />
                ) : mainViewUser ? (
                    <VideoPlayer 
                        key={mainViewUser.uid}
                        user={mainViewUser}
                        isMainView={true}
                        onSetMainView={() => {}}
                        talking={loudestSpeaker === mainViewUser.uid}
                    />
                ) : null}

                {otherParticipants.map(p => (
                    p.uid === localUser.uid ? (
                        <LocalPlayer 
                            key={p.uid} 
                            isMainView={false} 
                            onSetMainView={() => setMainViewUserId(p.uid)}
                            talking={loudestSpeaker === agoraClient.uid}
                        />
                    ) : (
                         <VideoPlayer
                            key={p.uid}
                            user={p}
                            isMainView={false}
                            onSetMainView={() => setMainViewUserId(p.uid.toString())}
                            talking={loudestSpeaker === p.uid}
                        />
                    )
                ))}
            </div>

             <div className="flex-shrink-0 p-2 flex items-center justify-center gap-2">
                <Button variant={micOn ? 'secondary' : 'destructive'} size="icon" className="rounded-full" onClick={() => setMicOn(!micOn)}>
                    {micOn ? <Mic /> : <MicOff />}
                </Button>
                <Button variant={cameraOn ? 'secondary' : 'destructive'} size="icon" className="rounded-full" onClick={() => setCameraOn(!cameraOn)}>
                    {cameraOn ? <Video /> : <VideoOff />}
                </Button>
                <Button variant="secondary" size="icon" className="rounded-full">
                    <ScreenShare />
                </Button>
                <Button variant="destructive" size="icon" className="rounded-full" onClick={() => leaveCall()}>
                    <Phone />
                </Button>
            </div>
        </div>
    )
}

export function CallView() {
    const { agoraClient } = useCallingStore();
    if (!agoraClient) return null;
    return (
        <AgoraRTCProvider client={agoraClient}>
            <CallRoomInternal />
        </AgoraRTCProvider>
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
