
'use client';

import { useCallback, useEffect, useState } from 'react';
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
    onSnapshot,
    orderBy,
} from 'firebase/firestore';
import type { Channel, ChannelType } from '@/lib/types';
import { useAuth } from './use-auth';

export function useChannels(serverId: string | undefined) {
  const { authUser } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!serverId) {
        setChannels([]);
        setLoading(false);
        return;
    };
    
    setLoading(true);
    const channelsRef = collection(db, 'servers', serverId, 'channels');
    const q = query(channelsRef, orderBy('name', 'asc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const channelDocs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Channel));
        setChannels(channelDocs);
        setLoading(false);
    }, (error) => {
        console.error("Error fetching channels:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [serverId]);


  const createChannel = useCallback(async (name: string): Promise<Channel | null> => {
    if (!authUser || !serverId) throw new Error("Authentication or server context is missing.");
    
    const sanitizedName = name.trim().toLowerCase().replace(/\s+/g, '-');
    if (!sanitizedName) throw new Error("Channel name cannot be empty.");

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
      type: 'text' // Default type
    };
    
    const channelRef = await addDoc(channelsRef, channelPayload);
    
    return {
      id: channelRef.id,
      ...channelPayload,
    } as Channel;

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


  return { channels, loading, createChannel, updateChannel, deleteChannel };
}
