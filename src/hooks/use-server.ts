
'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, deleteDoc, getDoc, collection, query, orderBy, getDocs, arrayUnion, serverTimestamp, addDoc, writeBatch } from 'firebase/firestore';
import type { Server, UserProfile, Channel, ServerProfile, Message, Role } from '@/lib/types';
import { useAuth } from './use-auth';

const welcomeMessages = [
    "Welcome, {user}! We're glad to have you here.",
    "Hey {user}, welcome to the server! Say hi!",
    "{user} just joined. Everyone, look busy!",
    "A wild {user} appeared!",
    "Glad you're here, {user}. Hope you enjoy your stay.",
];

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
        if (serverData.members && serverData.members.length > 0) {
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
        } else {
             setMembers([]);
        }

        const channelsQuery = query(collection(db, 'servers', serverId, 'channels'), orderBy('name', 'asc'));
        const channelsSnapshot = await getDocs(channelsQuery);
        serverData.channels = channelsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Channel));
        
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

  const updateServer = useCallback(async (serverIdToUpdate: string, data: Partial<Omit<Server, 'id'>>) => {
    if (!authUser) throw new Error('Not authenticated');
    const serverRef = doc(db, 'servers', serverIdToUpdate);
    await updateDoc(serverRef, data as any);
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

      const serverDoc = await getDoc(serverRef);
      const serverData = serverDoc.data() as Server;
      const everyoneRole = serverData.roles?.find(r => r.name === '@everyone');

      await updateDoc(serverRef, {
        members: arrayUnion(authUser.uid),
        [memberDetailPath]: {
            joinedAt: serverTimestamp(),
            roles: everyoneRole ? [everyoneRole.id] : [],
        }
      });
      
      if (serverData.systemChannelId && serverData.systemChannelId !== 'none') {
        const welcomeMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)]
            .replace('{user}', `@${currentUser.displayName}`);

        const messagePayload: Omit<Message, 'id' | 'timestamp'> = {
            text: welcomeMessage,
            sender: 'system',
            edited: false,
            mentions: [authUser.uid],
        };

        const messagesRef = collection(db, 'servers', serverIdToJoin, 'channels', serverData.systemChannelId, 'messages');
        await addDoc(messagesRef, {
            ...messagePayload,
            timestamp: serverTimestamp()
        });
      }

  }, [authUser, currentUser]);

  const addBotToServer = useCallback(async (botId: string, serverIdToAdd: string) => {
    if (!authUser) throw new Error('Not authenticated');

    const serverRef = doc(db, 'servers', serverIdToAdd);
    const serverDoc = await getDoc(serverRef);
    if (!serverDoc.exists()) throw new Error("Server not found");
    
    const serverData = serverDoc.data() as Server;
    if (serverData.ownerId !== authUser.uid) {
        throw new Error("Only the server owner can add bots.");
    }
    
    if (serverData.members.includes(botId)) {
        throw new Error("This bot is already a member of the server.");
    }

    const botRole: Role = {
        id: `bot-role-${botId.slice(0, 5)}`,
        name: 'Bot',
        color: '#808080',
        priority: 99, // Low priority
        permissions: { viewChannels: true, sendMessages: true, mentionEveryone: true }
    }

    const memberDetailPath = `memberDetails.${botId}`;
    const newRoles = serverData.roles ? [...serverData.roles, botRole] : [botRole];

    await updateDoc(serverRef, {
        members: arrayUnion(botId),
        roles: arrayUnion(botRole),
        [memberDetailPath]: {
            joinedAt: serverTimestamp(),
            roles: [botRole.id]
        }
    });

  }, [authUser]);

  return { server, setServer, members, loading, updateServer, deleteServer, joinServer, addBotToServer };
}
