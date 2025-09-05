
'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
  writeBatch,
  doc,
  getDoc,
  getDocs,
} from 'firebase/firestore';
import type { Server, Channel } from '@/lib/types';
import { useAuth } from './use-auth';

export function useServers(enabled: boolean = true) {
  const { authUser } = useAuth();
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authUser || !enabled) {
      setServers([]);
      setLoading(!enabled);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, 'servers'),
      where('members', 'array-contains', authUser.uid)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const serverDocs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Server));
      setServers(serverDocs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching servers:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [authUser, enabled]);

  const createServer = useCallback(async (name: string): Promise<Server | null> => {
    if (!authUser) throw new Error("You must be logged in to create a server.");

    const batch = writeBatch(db);

    // 1. Create Server Document
    const serverRef = doc(collection(db, 'servers'));
    const photoURL = `https://picsum.photos/seed/${serverRef.id}/200`
    const serverPayload: Omit<Server, 'id' | 'channels'> = {
      name,
      ownerId: authUser.uid,
      members: [authUser.uid],
      memberDetails: {
        [authUser.uid]: {
          joinedAt: serverTimestamp(),
          roles: ['owner'] // Assuming an owner role might exist or be checked by ownerId
        }
      },
      createdAt: serverTimestamp(),
      photoURL,
      isPublic: false,
      roles: [
        { id: '@everyone', name: '@everyone', color: '#808080', priority: 0, permissions: { viewChannels: true, sendMessages: true } },
      ],
    };
    batch.set(serverRef, serverPayload);

    // 2. Create Default Channels
    const generalChannelRef = doc(collection(db, 'servers', serverRef.id, 'channels'));
    batch.set(generalChannelRef, {
      name: 'general',
      serverId: serverRef.id,
      createdAt: serverTimestamp(),
      type: 'text'
    });
    
    const rulesChannelRef = doc(collection(db, 'servers', serverRef.id, 'channels'));
    batch.set(rulesChannelRef, {
      name: 'rules',
      serverId: serverRef.id,
      createdAt: serverTimestamp(),
      type: 'rules'
    });

    await batch.commit();
    
    // 3. Return the newly created server document by fetching it again
    const newServerDoc = await getDoc(serverRef);
    if (newServerDoc.exists()) {
        const finalServerData = { id: newServerDoc.id, ...newServerDoc.data() } as Server;
        const channelsSnapshot = await getDocs(collection(db, 'servers', serverRef.id, 'channels'));
        finalServerData.channels = channelsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Channel));
        return finalServerData;
    }

    return null;

  }, [authUser]);

  return { servers, setServers, loading, createServer };
}
