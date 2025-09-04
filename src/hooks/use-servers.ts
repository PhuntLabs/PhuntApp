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
} from 'firebase/firestore';
import type { Server } from '@/lib/types';
import { useAuth } from './use-auth';

export function useServers() {
  const { authUser } = useAuth();
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authUser) {
      setServers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, 'servers'),
      where('members', 'array-contains', authUser.uid)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const serverDocs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Server));
      
      serverDocs.sort((a, b) => {
        const timeA = (a.createdAt as any)?.toMillis() || 0;
        const timeB = (b.createdAt as any)?.toMillis() || 0;
        return timeA - timeB; // Oldest first
      });

      setServers(serverDocs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching servers:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [authUser]);

  const createServer = useCallback(async (name: string) => {
    if (!authUser) throw new Error("You must be logged in to create a server.");

    // 1. Create the server document first to get a valid ID.
    const serverRef = await addDoc(collection(db, 'servers'), {
      name,
      ownerId: authUser.uid,
      members: [authUser.uid],
      createdAt: serverTimestamp(),
      photoURL: null, // Set photoURL later
    });

    // 2. Now that we have the ID, create a batch for channels and updating the photoURL.
    const batch = writeBatch(db);
    
    // Update the server with the correct photoURL
    const photoURL = `https://picsum.photos/seed/${serverRef.id}/200`;
    batch.update(serverRef, { photoURL });

    // Create the default channels
    const channelsRef = collection(db, 'servers', serverRef.id, 'channels');
    
    const generalChannelRef = doc(channelsRef);
    batch.set(generalChannelRef, {
      name: '!general',
      serverId: serverRef.id,
      createdAt: serverTimestamp(),
    });

    const rulesChannelRef = doc(channelsRef);
    batch.set(rulesChannelRef, {
      name: '!rules',
      serverId: serverRef.id,
      createdAt: serverTimestamp(),
    });

    // 3. Commit the batch with the remaining operations.
    await batch.commit();

  }, [authUser]);

  return { servers, loading, createServer };
}
