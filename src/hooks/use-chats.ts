'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, getDoc, doc, orderBy } from 'firebase/firestore';
import type { PopulatedChat, ChatDocument, UserProfile, BadgeType } from '@/lib/types';
import { useAuth } from './use-auth';

function applySpecialBadges(profile: UserProfile): UserProfile {
    const badges = new Set<BadgeType>(profile.badges || []);
    const username = profile.displayName_lowercase || '';

    // Developer badges
    const developerEmails = ['raidensch0@gmail.com'];
    const developerUsernames = ['testacc', 'aura farmer', 'thatguy123'];
    if (
        (profile.email && developerEmails.includes(profile.email)) ||
        (username && developerUsernames.includes(username))
    ) {
        badges.add('developer');
    }

    // Heina's badges
    if (username === 'heina') {
        ['developer', 'beta tester', 'youtuber', 'tiktoker', 'goat', 'early supporter'].forEach(b => badges.add(b as BadgeType));
    }

    // RecBacon's badges
    if (username === 'recbacon') {
        ['early supporter', 'youtuber', 'beta tester', 'goat'].forEach(b => badges.add(b as BadgeType));
    }


    return { ...profile, badges: Array.from(badges) };
}


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
            const userWithBadges = applySpecialBadges({ id: userDoc.id, ...userData } as UserProfile);
            return userWithBadges;
        }
        // Fallback for missing user profiles
        return { id: memberId, uid: memberId, displayName: 'Unknown User', photoURL: null, isBot: memberId === 'echo_bot' };
    });

    const members = await Promise.all(memberPromises as Promise<UserProfile>[]);
    
    return {
        ...chatDoc,
        members: members,
    };
}


export function useChats(enabled: boolean = true) {
  const { authUser } = useAuth();
  const [chats, setChats] = useState<PopulatedChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  
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
    if (!authUser || !enabled) {
        setChats([]);
        setLoading(!enabled);
        return;
    };

    setLoading(true);
    const q = query(
      collection(db, 'chats'),
      where('members', 'array-contains', authUser.uid),
      orderBy('lastMessageTimestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const chatDocs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatDocument));
      
      const populatedChats = await Promise.all(chatDocs.map(populateChat));

      setChats(populatedChats);
      
      // Calculate total unread count
      const totalCount = populatedChats.reduce((sum, chat) => {
          return sum + (chat.unreadCount?.[authUser.uid] || 0);
      }, 0);
      setTotalUnreadCount(totalCount);
      
      setLoading(false);
    }, (error) => {
        console.error("Error fetching chats:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [authUser, enabled]);

  return { chats, loading, addChat, removeChat, totalUnreadCount };
}
