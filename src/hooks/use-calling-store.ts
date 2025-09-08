
'use client';

import { create } from 'zustand';
import type { IAgoraRTCClient } from 'agora-rtc-sdk-ng';
import type { UserProfile, Call } from '@/lib/types';
import { useAuth } from './use-auth';
import { db } from '@/lib/firebase';
import { addDoc, collection, doc, serverTimestamp, updateDoc, onSnapshot, Unsubscribe, setDoc, getDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

interface CallingState {
  agoraClient: IAgoraRTCClient | null;
  activeCall: Call | null;
  incomingCall: Call | null;
  callUnsubscribe: Unsubscribe | null;
  micOn: boolean;
  cameraOn: boolean;
  initCall: (callee: UserProfile, chatId: string) => Promise<void>;
  acceptCall: (call: Call) => Promise<void>;
  declineCall: (call: Call) => Promise<void>;
  leaveCall: () => Promise<void>;
  listenForIncomingCalls: (userId: string) => void;
  stopListeningForIncomingCalls: () => void;
  setMicOn: (on: boolean) => void;
  setCameraOn: (on: boolean) => void;
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
  activeCall: null,
  incomingCall: null,
  callUnsubscribe: null,
  micOn: true,
  cameraOn: true,
  
  initCall: async (callee: UserProfile, chatId: string) => {
    if (!APP_ID) {
      alert("Agora App ID is not configured. Calling is disabled.");
      return;
    }
    const { user: caller } = useAuth.getState();
    if (!caller) {
      alert("You must be logged in to make a call.");
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
    };
    
    await setDoc(doc(db, 'calls', callId), newCall);

    set({ agoraClient: client, activeCall: newCall });
    
    try {
      const response = await fetch(`/api/agora/token?channelName=${channelName}&uid=${caller.uid}`);
      const { token } = await response.json();
      
      await client.join(APP_ID, channelName, token, Number(caller.uid));
      
      const tracks = await AgoraRTC.createMicrophoneAndCameraTracks();
      await client.publish(tracks);
      
    } catch (error) {
      console.error('Failed to join call:', error);
      get().leaveCall();
    }
  },
  
  acceptCall: async (call: Call) => {
    if (!APP_ID) {
      alert("Agora App ID is not configured. Calling is disabled.");
      return;
    }
    const { user: callee } = useAuth.getState();
    if (!callee) return;

    set({ incomingCall: null });
    
    const AgoraRTC = await getAgoraRTC();
    const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    const updatedCall = { ...call, status: 'active' as const };
    set({ agoraClient: client, activeCall: updatedCall });
    
    if (call.embedMessageId) {
        await updateCallSystemMessage(call.chatId, call.embedMessageId, {
            title: '✅ Call Started',
            description: `Call with ${call.caller.displayName} is in progress.`,
            color: '#22c55e',
        });
    }

    try {
        await updateDoc(doc(db, 'calls', call.id), { status: 'active' });
        const response = await fetch(`/api/agora/token?channelName=${call.channelName}&uid=${callee.uid}`);
        const { token } = await response.json();

        await client.join(APP_ID, call.channelName, token, Number(callee.uid));
        const tracks = await AgoraRTC.createMicrophoneAndCameraTracks();
        await client.publish(tracks);

    } catch (error) {
        console.error('Failed to accept call:', error);
        get().leaveCall();
    }
  },

  declineCall: async (call: Call) => {
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

  leaveCall: async () => {
    const { agoraClient, activeCall } = get();
    if (agoraClient) {
      agoraClient.leave();
    }
    if (activeCall) {
        const callDoc = await getDoc(doc(db, 'calls', activeCall.id));
        const startTime = (callDoc.data()?.createdAt as any)?.toDate();
        const duration = startTime ? (new Date().getTime() - startTime.getTime()) / 1000 : 0;
        
        await updateDoc(doc(db, 'calls', activeCall.id), { status: 'ended', endedAt: serverTimestamp(), duration });
        if (activeCall.embedMessageId) {
            await updateCallSystemMessage(activeCall.chatId, activeCall.embedMessageId, {
                title: '📞 Call Ended',
                description: `Duration: ${formatDuration(duration)}`,
                color: '#6b7280',
            });
        }
    }
    set({ activeCall: null, agoraClient: null, micOn: true, cameraOn: true });
  },

  listenForIncomingCalls: (userId: string) => {
    const { callUnsubscribe } = get();
    if (callUnsubscribe) return; // Already listening

    const callsRef = collection(db, 'calls');
    const q = onSnapshot(doc(db, 'users', userId), (userDoc) => {
        if (userDoc.exists() && userDoc.data().status === 'online') {
            const unsub = onSnapshot(callsRef, async (snapshot) => {
                const changes = snapshot.docChanges();
                for (const change of changes) {
                    const callData = { id: change.doc.id, ...change.doc.data() } as Call;
                    if (callData.callee.uid === userId) {
                        if (callData.status === 'ringing') {
                            set({ incomingCall: callData });
                        } else {
                            // Call was declined, missed, or ended by the other party
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
  
  setMicOn: (on: boolean) => set({ micOn: on }),
  setCameraOn: (on: boolean) => set({ cameraOn: on }),
}));
