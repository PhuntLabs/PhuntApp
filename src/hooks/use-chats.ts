'use client';

import { useState, useEffect, useCallback } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, getDoc, doc } from 'firebase/firestore';
import type { PopulatedChat, ChatDocument, UserProfile } from '@/lib/types';
import { useAuth } from './use-auth';

async function populateChat(chatDoc: ChatDocument): Promise<PopulatedChat> {
    if (!chatDoc.members) {
      console.warn("Chat document missing members array:", chatDoc);
      return {
        ...chatDoc,
        members: [],
      }
    }
    const memberPromises = chatDoc.members.map(async (memberId) => {
        const userDoc = await getDoc(doc(db, 'users', memberId));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            return {
                id: userDoc.id,
                uid: userDoc.id,
                displayName: userData.displayName || 'Unnamed User',
                photoURL: userData.photoURL || null,
                isBot: userData.isBot || false,
            };
        }
        // Fallback for missing user profiles
        return { id: memberId, uid: memberId, displayName: 'Unknown User', photoURL: null, isBot: false };
    });

    const members = await Promise.all(memberPromises);
    
    return {
        ...chatDoc,
        members: members as UserProfile[],
    };
}


export function useChats() {
  const { authUser } = useAuth();
  const [chats, setChats] = useState<PopulatedChat[]>([]);
  const [loading, setLoading] = useState(true);
  
  const addChat = useCallback(async (newChat: ChatDocument): Promise<PopulatedChat> => {
    const populated = await populateChat(newChat);
    setChats((prevChats) => {
        // Avoid adding duplicates
        if (prevChats.some(chat => chat.id === populated.id)) {
            return prevChats;
        }
        // Add new chat and re-sort
        const updatedChats = [...prevChats, populated];
        updatedChats.sort((a, b) => {
            const timeA = (a.lastMessageTimestamp as any)?.toMillis() || (a.createdAt as any)?.toMillis() || 0;
            const timeB = (b.lastMessageTimestamp as any)?.toMillis() || (b.createdAt as any)?.toMillis() || 0;
            return timeB - timeA;
        });
        return updatedChats;
    });
    return populated;
  }, []);

  useEffect(() => {
    if (!authUser) {
        setChats([]);
        setLoading(false);
        return;
    };

    const q = query(
      collection(db, 'chats'),
      where('members', 'array-contains', authUser.uid)
    );

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      setLoading(true);
      const chatDocs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatDocument));
      const populatedChats = await Promise.all(chatDocs.map(populateChat));
      
      // Sort by last message timestamp if available, otherwise by creation
      populatedChats.sort((a, b) => {
        const timeA = (a.lastMessageTimestamp as any)?.toMillis() || (a.createdAt as any)?.toMillis() || 0;
        const timeB = (b.lastMessageTimestamp as any)?.toMillis() || (b.createdAt as any)?.toMillis() || 0;
        return timeB - timeA;
      });

      setChats(populatedChats);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [authUser]);

  return { chats, loading, addChat };
}
