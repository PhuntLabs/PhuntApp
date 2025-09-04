'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import type { Server, UserProfile } from '@/lib/types';
import { useAuth } from './use-auth';

export function useServer(serverId: string | undefined) {
  const { authUser } = useAuth();
  const [server, setServer] = useState<Server | null>(null);
  const [members, setMembers] = useState<Partial<UserProfile>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!serverId) {
      setServer(null);
      setMembers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const serverRef = doc(db, 'servers', serverId);

    const unsubscribe = onSnapshot(serverRef, async (doc) => {
      if (doc.exists()) {
        const serverData = { id: doc.id, ...doc.data() } as Server;
        setServer(serverData);
        
        // Fetch members
        if (serverData.members) {
            const memberPromises = serverData.members.map(async (memberId) => {
                const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', memberId)));
                if (!userDoc.empty) {
                     const userDocData = userDoc.docs[0].data();
                     return {
                        id: userDoc.docs[0].id,
                        ...userDocData
                     } as UserProfile
                }
                return { id: memberId, uid: memberId, displayName: 'Unknown User' };
            });
            const memberProfiles = await Promise.all(memberPromises);
            setMembers(memberProfiles);
        }

      } else {
        setServer(null);
        setMembers([]);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching server:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [serverId]);

  const updateServer = useCallback(async (serverIdToUpdate: string, data: Partial<Server>) => {
    if (!authUser) throw new Error('Not authenticated');
    const serverRef = doc(db, 'servers', serverIdToUpdate);
    // You might want to add additional permission checks here
    await updateDoc(serverRef, data);
  }, [authUser]);

  const deleteServer = useCallback(async (serverIdToDelete: string) => {
    if (!authUser) throw new Error('Not authenticated');
    const serverRef = doc(db, 'servers', serverIdToDelete);
    // You might want to add additional permission checks here (e.g., check if user is owner)
    await deleteDoc(serverRef);
  }, [authUser]);

  return { server, members, loading, updateServer, deleteServer };
}
