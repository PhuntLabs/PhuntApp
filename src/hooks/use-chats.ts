'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
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
            const userData = userDoc.data() as Omit<UserProfile, 'id'>;
            // Add developer badge for specific users
            const developerEmails = ['raidensch0@gmail.com'];
            const developerUsernames = ['testacc', 'aura farmer'];
             if (
                (userData.email && developerEmails.includes(userData.email)) ||
                (userData.displayName && developerUsernames.includes(userData.displayName.toLowerCase()))
            ) {
                if (!userData.badges) userData.badges = [];
                if (!userData.badges.includes('developer')) userData.badges.push('developer');
            }

            return {
                id: userDoc.id,
                ...userData
            };
        }
        // Fallback for missing user profiles
        return { id: memberId, uid: memberId, displayName: 'Unknown User', photoURL: null, isBot: false };
    });

    const members = await Promise.all(memberPromises as Promise<UserProfile>[]);
    
    return {
        ...chatDoc,
        members: members,
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
            // If chat already exists, update it
            return prevChats.map(c => c.id === populated.id ? populated : c);
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

  const removeChat = useCallback((chatId: string) => {
      setChats(prev => prev.filter(c => c.id !== chatId));
  }, []);

  useEffect(() => {
    if (!authUser) {
        setChats([]);
        setLoading(false);
        return;
    };

    setLoading(true);
    const q = query(
      collection(db, 'chats'),
      where('members', 'array-contains', authUser.uid)
    );

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
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
    }, (error) => {
        console.error("Error fetching chats:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [authUser]);

  return { chats, loading, addChat, removeChat };
}
