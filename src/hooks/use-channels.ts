
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
    getDocs,
    writeBatch
} from 'firebase/firestore';
import type { Channel, ChannelType } from '@/lib/types';
import { useAuth } from './use-auth';

export function useChannels(serverId: string | undefined) {
  const { authUser } = useAuth();

  const createChannel = useCallback(async (name: string, categoryId: string): Promise<Channel | null> => {
    if (!authUser || !serverId) throw new Error("Authentication or server context is missing.");
    
    const sanitizedName = name.trim().toLowerCase().replace(/\s+/g, '-');
    if (!sanitizedName) throw new Error("Channel name cannot be empty.");

    const channelsRef = collection(db, 'servers', serverId, 'channels');
    
    const q = query(channelsRef, where('name', '==', sanitizedName));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      throw new Error(`A channel named #${sanitizedName} already exists.`);
    }

    const categoryChannelsQuery = query(channelsRef, where('categoryId', '==', categoryId));
    const categoryChannelsSnapshot = await getDocs(categoryChannelsQuery);
    const nextPosition = categoryChannelsSnapshot.size;
    
    const channelPayload: Omit<Channel, 'id'> = {
      name: sanitizedName,
      serverId: serverId,
      categoryId: categoryId,
      createdAt: serverTimestamp(),
      position: nextPosition,
      type: 'text' // Default type
    };
    
    const channelRef = await addDoc(channelsRef, channelPayload);
    
    return {
      id: channelRef.id,
      ...channelPayload,
      position: nextPosition
    } as Channel;

  }, [authUser, serverId]);
  
  const updateChannelOrder = useCallback(async (channelIds: string[], categoryId: string) => {
    if (!authUser || !serverId) throw new Error("Authentication or server context is missing.");

    const batch = writeBatch(db);
    channelIds.forEach((id, index) => {
      const channelRef = doc(db, 'servers', serverId, 'channels', id);
      batch.update(channelRef, { position: index, categoryId: categoryId });
    });
    await batch.commit();
  }, [authUser, serverId]);

  const updateCategoryOrder = useCallback(async (categoryIds: string[]) => {
    if (!authUser || !serverId) throw new Error("Authentication or server context is missing.");
    
    const batch = writeBatch(db);
    categoryIds.forEach((id, index) => {
        const categoryRef = doc(db, 'servers', serverId, 'categories', id);
        batch.update(categoryRef, { position: index });
    });
    await batch.commit();
  }, [authUser, serverId]);


  const updateChannel = useCallback(async (channelId: string, data: Partial<Channel>) => {
    if (!authUser || !serverId) throw new Error("Authentication or server context is missing.");

    const updateData: Partial<Channel> = {};

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
     if (data.permissionOverwrites !== undefined) {
        updateData.permissionOverwrites = data.permissionOverwrites;
    }


    if(Object.keys(updateData).length === 0) return;

    const channelRef = doc(db, 'servers', serverId, 'channels', channelId);
    await updateDoc(channelRef, updateData as any);
  }, [authUser, serverId]);

  const deleteChannel = useCallback(async (channelId: string) => {
    if (!authUser || !serverId) throw new Error("Authentication or server context is missing.");
    
    const channelRef = doc(db, 'servers', serverId, 'channels', channelId);
    await deleteDoc(channelRef);

  }, [authUser, serverId]);


  return { createChannel, updateChannel, deleteChannel, updateChannelOrder, updateCategoryOrder };
}
