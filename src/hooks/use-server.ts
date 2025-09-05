
'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, deleteDoc, getDoc, collection, query, orderBy, getDocs, arrayUnion, serverTimestamp } from 'firebase/firestore';
import type { Server, UserProfile, Channel, ServerProfile } from '@/lib/types';
import { useAuth } from './use-auth';

export function useServer(serverId: string | undefined) {
  const { authUser, user: currentUser } = useAuth();
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

    const unsubscribe = onSnapshot(serverRef, async (docSnapshot) => {
      if (docSnapshot.exists()) {
        const serverData = { id: docSnapshot.id, ...docSnapshot.data() } as Server;
        
        // Fetch members
        if (serverData.members) {
            const memberPromises = serverData.members.map(async (memberId) => {
                const userRef = doc(db, 'users', memberId);
                const userDoc = await getDoc(userRef);
                if (userDoc.exists()) {
                     const userDocData = userDoc.data();
                     const serverProfile = serverData.memberDetails?.[memberId]?.profile;

                     return {
                        id: userDoc.id,
                        uid: userDoc.id,
                        ...userDocData,
                        displayName: serverProfile?.nickname || userDocData.displayName,
                        photoURL: serverProfile?.avatar || userDocData.photoURL,
                     } as UserProfile
                }
                return { id: memberId, uid: memberId, displayName: 'Unknown User' };
            });
            const memberProfiles = await Promise.all(memberPromises);
            setMembers(memberProfiles as UserProfile[]);
        }
        
        // Fetch channels
        const channelsQuery = query(collection(db, 'servers', serverId, 'channels'), orderBy('position', 'asc'));
        const channelsSnapshot = await getDocs(channelsQuery);
        const channelDocs = channelsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Channel));
        serverData.channels = channelDocs;


        setServer(serverData);

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
    await updateDoc(serverRef, data);
  }, [authUser]);
  
  const deleteServer = useCallback(async (serverIdToDelete: string) => {
    if (!authUser) throw new Error('Not authenticated');
    const serverRef = doc(db, 'servers', serverIdToDelete);
    await deleteDoc(serverRef);
  }, [authUser]);
  
  const joinServer = useCallback(async (serverIdToJoin: string) => {
      if (!authUser || !currentUser) throw new Error('Not authenticated');
      const serverRef = doc(db, 'servers', serverIdToJoin);
      
      const memberDetailPath = `memberDetails.${authUser.uid}`;

      await updateDoc(serverRef, {
        members: arrayUnion(authUser.uid),
        [memberDetailPath]: {
            joinedAt: serverTimestamp(),
            roles: [], // Start with no roles
        }
      });
  }, [authUser, currentUser]);

  return { server, setServer, members, loading, updateServer, deleteServer, joinServer };
}

    