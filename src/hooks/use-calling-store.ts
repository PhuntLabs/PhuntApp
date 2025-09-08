'use client';

import { create } from 'zustand';
import AgoraRTC, { IAgoraRTCClient } from 'agora-rtc-sdk-ng';
import type { UserProfile } from '@/lib/types';
import { useAuth } from './use-auth';

interface Call {
  channelName: string;
  callee: UserProfile;
}

interface CallingState {
  agoraClient: IAgoraRTCClient | null;
  activeCall: Call | null;
  micOn: boolean;
  cameraOn: boolean;
  initCall: (callee: UserProfile) => Promise<void>;
  leaveCall: () => Promise<void>;
  setMicOn: (on: boolean) => void;
  setCameraOn: (on: boolean) => void;
}

const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID;

export const useCallingStore = create<CallingState>((set, get) => ({
  agoraClient: null,
  activeCall: null,
  micOn: true,
  cameraOn: true,
  
  initCall: async (callee: UserProfile) => {
    if (!APP_ID) {
      alert("Agora App ID is not configured. Calling is disabled.");
      console.error("Agora App ID is missing.");
      return;
    }
    
    // For simplicity, channel name is a sorted concatenation of UIDs
    const { uid: callerUid } = useAuth.getState().user || {};
    if (!callerUid) {
      alert("You must be logged in to make a call.");
      return;
    }

    const channelName = [callerUid, callee.uid].sort().join('-');
    const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

    set({ agoraClient: client, activeCall: { channelName, callee } });
    
    try {
      const response = await fetch(`/api/agora/token?channelName=${channelName}&uid=${callerUid}`);
      const { token } = await response.json();
      
      await client.join(APP_ID, channelName, token, Number(callerUid));
      
      const tracks = await AgoraRTC.createMicrophoneAndCameraTracks();
      await client.publish(tracks);

    } catch (error) {
      console.error('Failed to join call:', error);
      get().leaveCall(); // Cleanup on failure
    }
  },

  leaveCall: async () => {
    const { agoraClient } = get();
    if (agoraClient) {
      agoraClient.leave();
    }
    set({ activeCall: null, agoraClient: null });
  },
  
  setMicOn: (on: boolean) => set({ micOn: on }),
  setCameraOn: (on: boolean) => set({ cameraOn: on }),
}));
