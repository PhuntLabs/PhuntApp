

'use client';

import { create } from 'zustand';
import type { IAgoraRTCClient, ILocalVideoTrack, ILocalAudioTrack } from 'agora-rtc-sdk-ng';
import type { UserProfile, Call } from '@/lib/types';
import { db } from '@/lib/firebase';
import { addDoc, collection, doc, serverTimestamp, updateDoc, onSnapshot, Unsubscribe, setDoc, getDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { toast } from './use-toast';

interface CallingState {
  agoraClient: IAgoraRTCClient | null;
  localTracks: [ILocalAudioTrack, ILocalVideoTrack] | null;
  activeCall: Call | null;
  incomingCall: Call | null;
  callUnsubscribe: Unsubscribe | null;
  micOn: boolean;
  cameraOn: boolean;
  isScreensharing: boolean;
  inactivityTimer: NodeJS.Timeout | null;
  initCall: (caller: UserProfile, callee: UserProfile, chatId: string) => Promise<void>;
  acceptCall: (call: Call, currentUser: UserProfile) => Promise<void>;
  declineCall: (call: Call) => Promise<void>;
  leaveCall: (reason?: 'user' | 'inactivity') => Promise<void>;
  listenForIncomingCalls: (userId: string) => void;
  stopListeningForIncomingCalls: () => void;
  setMicOn: (on: boolean) => void;
  setCameraOn: (on: boolean) => void;
  setIsScreensharing: (sharing: boolean) => void;
  setShowFullScreen: (show: boolean) => void;
  startInactivityCheck: () => void;
  resetInactivityTimer: () => void;
}

const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID;

// Helper function to dynamically import AgoraRTC to avoid SSR issues
const getAgoraRTC = async () => {
    const { default: AgoraRTC } = await import('agora-rtc-sdk-ng');
    return AgoraRTC;
};

// Helper to format duration in MM:SS
function formatDuration(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

async function sendCallSystemMessage(chatId: string, embed: any): Promise<string> {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const docRef = await addDoc(messagesRef, {
        sender: 'system',
        embed,
        timestamp: serverTimestamp(),
    });
    return docRef.id;
}

async function updateCallSystemMessage(chatId: string, messageId: string, embed: any) {
    const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
    await updateDoc(messageRef, { embed });
}

export const useCallingStore = create<CallingState>((set, get) => ({
  agoraClient: null,
  localTracks: null,
  activeCall: null,
  incomingCall: null,
  callUnsubscribe: null,
  micOn: true,
  cameraOn: false, // Default camera to off
  isScreensharing: false,
  inactivityTimer: null,
  
  initCall: async (caller, callee, chatId) => {
    if (!APP_ID) {
      toast({ variant: 'destructive', title: 'Calling is not configured on this server.' });
      return;
    }
     if (!caller) {
      toast({variant: 'destructive', title: "You must be logged in to make a call."});
      return;
    }
    
    const AgoraRTC = await getAgoraRTC();
    const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    const callId = uuidv4();
    const channelName = callId;
    
    const embedMessageId = await sendCallSystemMessage(chatId, {
      title: '🤙 Calling...',
      description: `Calling ${callee.displayName}...`,
      color: '#3b82f6',
    });

    const newCall: Call = {
        id: callId,
        channelName,
        caller,
        callee,
        status: 'ringing',
        createdAt: serverTimestamp(),
        chatId,
        embedMessageId,
        showFullScreen: false,
    };
    
    await setDoc(doc(db, 'calls', callId), newCall);

    set({ agoraClient: client, activeCall: newCall, micOn: true, cameraOn: false, isScreensharing: false });
    
    try {
      const tracks = await AgoraRTC.createMicrophoneAndCameraTracks();
      set({ localTracks: tracks });

      // Keep camera off by default
      await tracks[1].setEnabled(false);

      const response = await fetch(`/api/agora/token?channelName=${channelName}&userAccount=${caller.uid}`);
      const { token } = await response.json();
      
      await client.join(APP_ID, channelName, token, caller.uid);
      await client.publish(tracks);

      get().startInactivityCheck();
      
    } catch (error: any) {
      console.error('Failed to join call:', error);
      toast({ variant: 'destructive', title: "Permission Error", description: "Failed to access microphone or camera."})
      get().leaveCall();
    }
  },
  
  acceptCall: async (call, callee) => {
    if (!APP_ID) {
      toast({ variant: 'destructive', title: 'Calling is not configured on this server.' });
      return;
    }

    set({ incomingCall: null });
    
    const AgoraRTC = await getAgoraRTC();
    const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    const updatedCall = { ...call, status: 'active' as const, showFullScreen: false };
    set({ agoraClient: client, activeCall: updatedCall, micOn: true, cameraOn: false, isScreensharing: false });
    
    if (call.embedMessageId) {
        await updateCallSystemMessage(call.chatId, call.embedMessageId, {
            title: '✅ Call Started',
            description: `Call with ${call.caller.displayName} is in progress.`,
            color: '#22c55e',
        });
    }

    try {
        await updateDoc(doc(db, 'calls', call.id), { status: 'active' });
        const response = await fetch(`/api/agora/token?channelName=${call.channelName}&userAccount=${callee.uid}`);
        const { token } = await response.json();

        await client.join(APP_ID, call.channelName, token, callee.uid);
        const tracks = await AgoraRTC.createMicrophoneAndCameraTracks();
        set({ localTracks: tracks });

        await tracks[1].setEnabled(false); // Keep camera off by default
        await client.publish(tracks);

        get().startInactivityCheck();

    } catch (error: any) {
        console.error('Failed to accept call:', error);
        toast({ variant: 'destructive', title: "Permission Error", description: "Failed to access microphone or camera."})
        get().leaveCall();
    }
  },

  declineCall: async (call) => {
     if (call.embedMessageId) {
        await updateCallSystemMessage(call.chatId, call.embedMessageId, {
            title: '❌ Call Declined',
            description: `The call was declined.`,
            color: '#ef4444',
        });
    }
    await updateDoc(doc(db, 'calls', call.id), { status: 'declined' });
    set({ incomingCall: null });
  },

  leaveCall: async (reason = 'user') => {
    const { agoraClient, activeCall, inactivityTimer, localTracks } = get();
    if (inactivityTimer) clearTimeout(inactivityTimer);
    
    localTracks?.forEach(track => {
        track.stop();
        track.close();
    });

    if (agoraClient) {
      await agoraClient.leave();
    }
    if (activeCall) {
        const callDoc = await getDoc(doc(db, 'calls', activeCall.id));
        const startTime = (callDoc.data()?.createdAt as any)?.toDate();
        const duration = startTime ? (new Date().getTime() - startTime.getTime()) / 1000 : 0;
        
        await updateDoc(doc(db, 'calls', activeCall.id), { status: 'ended', endedAt: serverTimestamp(), duration });
        
        if (activeCall.embedMessageId) {
            let embed;
            if (reason === 'inactivity') {
                embed = {
                    title: '📞 Call Ended',
                    description: 'We detected inactivity and we\'ve hung up the call for you.',
                    color: '#6b7280',
                };
            } else {
                 embed = {
                    title: '📞 Call Ended',
                    description: `Duration: ${formatDuration(duration)}`,
                    color: '#6b7280',
                };
            }
            await updateCallSystemMessage(activeCall.chatId, activeCall.embedMessageId, embed);
        }
    }
    set({ activeCall: null, agoraClient: null, localTracks: null, micOn: true, cameraOn: false, isScreensharing: false, inactivityTimer: null });
  },

  listenForIncomingCalls: (userId) => {
    const { callUnsubscribe } = get();
    if (callUnsubscribe) return; 

    const callsRef = collection(db, 'calls');
    const q = onSnapshot(doc(db, 'users', userId), (userDoc) => {
        if (userDoc.exists() && userDoc.data().status === 'online') {
            const unsub = onSnapshot(callsRef, async (snapshot) => {
                const changes = snapshot.docChanges();
                for (const change of changes) {
                    const callData = { id: change.doc.id, ...change.doc.data() } as Call;
                    if (callData.callee.uid === userId) {
                        if (change.type === "added" && callData.status === 'ringing') {
                            set({ incomingCall: callData });
                        } else if (change.type === "modified" && (callData.status === 'declined' || callData.status === 'ended')) {
                            set({ incomingCall: null });
                        }
                    }
                }
            });
            set({ callUnsubscribe: unsub });
        }
    });
  },

  stopListeningForIncomingCalls: () => {
    const { callUnsubscribe } = get();
    if (callUnsubscribe) {
      callUnsubscribe();
      set({ callUnsubscribe: null });
    }
  },
  
  setMicOn: async (on: boolean) => {
      const { localTracks } = get();
      if (localTracks && localTracks[0]) {
          await localTracks[0].setEnabled(on);
          set({ micOn: on });
      }
  },
  setCameraOn: async (on: boolean) => {
      const { localTracks } = get();
      if (localTracks && localTracks[1]) {
          await localTracks[1].setEnabled(on);
          set({ cameraOn: on });
      }
  },
  setIsScreensharing: (sharing: boolean) => set({ isScreensharing: sharing }),
  setShowFullScreen: (show: boolean) => {
    const { activeCall } = get();
    if (activeCall) {
        set({ activeCall: { ...activeCall, showFullScreen: show }});
    }
  },

  startInactivityCheck: () => {
    const { agoraClient, resetInactivityTimer } = get();
    if (!agoraClient) return;

    agoraClient.on("volume-indicator", volumes => {
        const isSomeoneTalking = volumes.some(v => v.level > 10);
        if (isSomeoneTalking) {
            resetInactivityTimer();
        }
    });
    
    // Initial setup of timer
    resetInactivityTimer();
  },
  
  resetInactivityTimer: () => {
    const { inactivityTimer, leaveCall } = get();
    if (inactivityTimer) clearTimeout(inactivityTimer);
    
    const newTimer = setTimeout(() => {
        leaveCall('inactivity');
    }, 120000); // 2 minutes
    
    set({ inactivityTimer: newTimer });
  }

}));
