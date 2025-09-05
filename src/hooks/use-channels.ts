
'use client';

import { useCallback } from 'react';
import { db } from '@/lib/firebase';
import { 
    collection, 
    addDoc, 
    serverTimestamp,
    doc,
    updateDoc,
    deleteDoc,
    query,
    where,
    getDocs
} from 'firebase/firestore';
import type { Channel, ChannelType } from '@/lib/types';
import { useAuth } from './use-auth';

export function useChannels(serverId: string | undefined) {
  const { authUser } = useAuth();

  const createChannel = useCallback(async (name: string): Promise<Channel | null> => {
    if (!authUser || !serverId) throw new Error("Authentication or server context is missing.");
    
    const sanitizedName = name.trim().toLowerCase().replace(/\s+/g, '-');
    if (!sanitizedName) throw new Error("Channel name cannot be empty.");

    const channelsRef = collection(db, 'servers', serverId, 'channels');
    
    // Check if channel with same name already exists
    const q = query(channelsRef, where('name', '==', sanitizedName));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      throw new Error(`A channel named #${sanitizedName} already exists.`);
    }

    const currentChannelsSnapshot = await getDocs(query(channelsRef));
    const nextPosition = currentChannelsSnapshot.size;
    
    const channelPayload: Omit<Channel, 'id'> = {
      name: sanitizedName,
      serverId: serverId,
      createdAt: serverTimestamp(),
      position: nextPosition,
      type: 'text' // Default type
    };
    
    const channelRef = await addDoc(channelsRef, channelPayload);
    
    return {
      id: channelRef.id,
      ...channelPayload
    }

  }, [authUser, serverId]);

  const updateChannel = useCallback(async (channelId: string, data: { name?: string; type?: ChannelType; topic?: string }) => {
    if (!authUser || !serverId) throw new Error("Authentication or server context is missing.");

    const updateData: { name?: string; type?: ChannelType; topic?: string } = {};

    if (data.name) {
      const sanitizedName = data.name.trim().toLowerCase().replace(/\s+/g, '-');
      if (!sanitizedName) throw new Error("Channel name cannot be empty.");
      updateData.name = sanitizedName;
    }
    if (data.type) {
      updateData.type = data.type;
    }
    if (data.topic !== undefined) {
        updateData.topic = data.topic;
    }


    if(Object.keys(updateData).length === 0) return;

    const channelRef = doc(db, 'servers', serverId, 'channels', channelId);
    await updateDoc(channelRef, updateData);
  }, [authUser, serverId]);

  const deleteChannel = useCallback(async (channelId: string) => {
    if (!authUser || !serverId) throw new Error("Authentication or server context is missing.");
    
    const channelRef = doc(db, 'servers', serverId, 'channels', channelId);
    await deleteDoc(channelRef);

  }, [authUser, serverId]);


  return { createChannel, updateChannel, deleteChannel };
}
