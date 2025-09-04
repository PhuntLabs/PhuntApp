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
                displayName: userData.displayName || 'Unnamed User',
                photoURL: userData.photoURL || null,
            };
        }
        // Fallback for missing user profiles
        return { id: memberId, displayName: 'Unknown User', photoURL: null };
    });

    const members = await Promise.all(memberPromises);
    
    return {
        ...chatDoc,
        members,
    };
}


export function useChats() {
  const { user } = useAuth();
  const [chats, setChats] = useState<PopulatedChat[]>([]);
  const [loading, setLoading] = useState(true);
  
  const addChat = useCallback((newChat: PopulatedChat) => {
    setChats((prevChats) => [newChat, ...prevChats]);
  }, []);

  useEffect(() => {
    if (!user) {
        setChats([]);
        setLoading(false);
        return;
    };

    const q = query(
      collection(db, 'chats'),
      where('members', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      setLoading(true);
      const chatDocs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatDocument));
      const populatedChats = await Promise.all(chatDocs.map(populateChat));
      
      // Sort by last message timestamp if available, otherwise by creation
      populatedChats.sort((a, b) => {
        const timeA = (a as any).lastMessageTimestamp?.toMillis() || (a as any).createdAt?.toMillis() || 0;
        const timeB = (b as any).lastMessageTimestamp?.toMillis() || (b as any).createdAt?.toMillis() || 0;
        return timeB - timeA;
      });

      setChats(populatedChats);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return { chats, loading, addChat };
}
