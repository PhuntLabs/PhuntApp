
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
import type { Channel } from '@/lib/types';
import { useAuth } from './use-auth';

export function useChannels(serverId: string | undefined) {
  const { authUser } = useAuth();

  const createChannel = useCallback(async (name: string): Promise<Channel | null> => {
    if (!authUser || !serverId) throw new Error("Authentication or server context is missing.");
    
    const sanitizedName = name.trim().toLowerCase().replace(/\s+/g, '-');
    if (!sanitizedName) throw new Error("Channel name cannot be empty.");

    // Check if channel with same name already exists
    const channelsRef = collection(db, 'servers', serverId, 'channels');
    const q = query(channelsRef, where('name', '==', sanitizedName));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      throw new Error(`A channel named #${sanitizedName} already exists.`);
    }
    
    const channelPayload: Omit<Channel, 'id'> = {
      name: sanitizedName,
      serverId: serverId,
      createdAt: serverTimestamp(),
    };
    
    const channelRef = await addDoc(channelsRef, channelPayload);
    
    return {
      id: channelRef.id,
      ...channelPayload
    }

  }, [authUser, serverId]);

  const updateChannel = useCallback(async (channelId: string, newName: string) => {
    if (!authUser || !serverId) throw new Error("Authentication or server context is missing.");

    const sanitizedName = newName.trim().toLowerCase().replace(/\s+/g, '-');
    if (!sanitizedName) throw new Error("Channel name cannot be empty.");

    const channelRef = doc(db, 'servers', serverId, 'channels', channelId);
    await updateDoc(channelRef, { name: sanitizedName });
  }, [authUser, serverId]);

  const deleteChannel = useCallback(async (channelId: string) => {
    if (!authUser || !serverId) throw new Error("Authentication or server context is missing.");
    
    const channelRef = doc(db, 'servers', serverId, 'channels', channelId);
    await deleteDoc(channelRef);

  }, [authUser, serverId]);

  return { createChannel, updateChannel, deleteChannel };
}
