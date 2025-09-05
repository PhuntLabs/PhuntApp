
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
} from 'firebase/firestore';
import type { Server, Category } from '@/lib/types';
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
    const serverPayload: Omit<Server, 'id' | 'categories'> = {
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

    // 2. Create Default Category
    const categoryRef = doc(collection(db, 'servers', serverRef.id, 'categories'));
    const defaultCategory: Omit<Category, 'id' | 'channels'> = {
      name: 'Text Channels',
      position: 0,
    };
    batch.set(categoryRef, defaultCategory);
    
    // 3. Create Default Channels within that Category
    const generalChannelRef = doc(collection(db, 'servers', serverRef.id, 'channels'));
    batch.set(generalChannelRef, {
      name: 'general',
      serverId: serverRef.id,
      categoryId: categoryRef.id,
      createdAt: serverTimestamp(),
      position: 0,
      type: 'text'
    });
    
    const rulesChannelRef = doc(collection(db, 'servers', serverRef.id, 'channels'));
    batch.set(rulesChannelRef, {
      name: 'rules',
      serverId: serverRef.id,
      categoryId: categoryRef.id,
      createdAt: serverTimestamp(),
      position: 1,
      type: 'rules'
    });

    await batch.commit();
    
    // 4. Return the newly created server document by fetching it again
    const newServerDoc = await getDoc(serverRef);
    if (newServerDoc.exists()) {
        const finalServerData = { id: newServerDoc.id, ...newServerDoc.data() } as Server;
        // Manually fetch and attach categories/channels for the immediate return
        const categoriesSnapshot = await getDocs(collection(db, 'servers', serverRef.id, 'categories'));
        const channelsSnapshot = await getDocs(collection(db, 'servers', serverRef.id, 'channels'));

        const categories = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), channels: [] } as Category));
        const channels = channelsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

        channels.forEach(channel => {
            const category = categories.find(c => c.id === channel.categoryId);
            if (category) {
                category.channels.push(channel);
            }
        });
        
        return { ...finalServerData, categories };
    }

    return null;

  }, [authUser]);

  return { servers, setServers, loading, createServer };
}
