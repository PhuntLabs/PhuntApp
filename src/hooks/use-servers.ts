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
  updateDoc,
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
      setServers(serverDocs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching servers:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [authUser]);

  const createServer = useCallback(async (name: string): Promise<Server | null> => {
    if (!authUser) throw new Error("You must be logged in to create a server.");

    // 1. Create the server document first to get an ID
    const serverPayload = {
      name,
      ownerId: authUser.uid,
      members: [authUser.uid],
      createdAt: serverTimestamp(),
      photoURL: null // Will be updated in step 2
    };
    const serverRef = await addDoc(collection(db, 'servers'), serverPayload);
    
    // 2. Now use the new ID to create channels and update the photoURL
    const photoURL = `https://picsum.photos/seed/${serverRef.id}/200`
    const batch = writeBatch(db);

    // Update photoURL on the server
    batch.update(serverRef, { photoURL });
    
    // Create default channels
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

    await batch.commit();
    
    // 3. Return the newly created server document
    const newServerDoc = await getDoc(serverRef);
    if (newServerDoc.exists()) {
        const finalServerData = newServerDoc.data();
        finalServerData.photoURL = photoURL; // Make sure the returned object has the photoURL
        return { id: newServerDoc.id, ...finalServerData } as Server;
    }

    return null;

  }, [authUser]);

  return { servers, setServers, loading, createServer };
}
