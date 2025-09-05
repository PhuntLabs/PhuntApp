
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collectionGroup, query, where, orderBy, onSnapshot, doc, getDoc, limit } from 'firebase/firestore';
import { useAuth } from './use-auth';
import type { Message, UserProfile, Server, Channel, ChatDocument } from '@/lib/types';

export type MentionWithContext = Message & {
    context: {
        type: 'dm';
        chatId: string;
        chatName: string;
    } | {
        type: 'channel';
        serverId: string;
        serverName: string;
        channelId: string;
        channelName: string;
    },
    senderProfile?: Partial<UserProfile>
};

// Cache to avoid re-fetching the same documents repeatedly
const contextCache = new Map<string, any>();

async function getMessageContext(msg: Message): Promise<MentionWithContext['context'] | null> {
    const pathSegments = msg.id.split('/'); // This is a hack, relies on internal firestore path format
    
    // Check if it's a DM or channel message based on path length
    if (pathSegments.length > 3 && pathSegments[0] === 'chats') {
        const chatId = pathSegments[1];
        if (contextCache.has(chatId)) return contextCache.get(chatId);

        const chatRef = doc(db, 'chats', chatId);
        const chatSnap = await getDoc(chatRef);
        if (chatSnap.exists()) {
            const chatData = chatSnap.data() as ChatDocument;
            const otherMemberId = chatData.members.find(m => m !== msg.sender);
            if (otherMemberId) {
                const userSnap = await getDoc(doc(db, 'users', otherMemberId));
                const context = { type: 'dm' as const, chatId, chatName: userSnap.data()?.displayName || 'Unknown Chat' };
                contextCache.set(chatId, context);
                return context;
            }
        }
    } else if (pathSegments.length > 5 && pathSegments[0] === 'servers') {
        const serverId = pathSegments[1];
        const channelId = pathSegments[3];
        const cacheKey = `${serverId}/${channelId}`;
        if (contextCache.has(cacheKey)) return contextCache.get(cacheKey);

        const serverRef = doc(db, 'servers', serverId);
        const channelRef = doc(db, 'servers', serverId, 'channels', channelId);
        
        const [serverSnap, channelSnap] = await Promise.all([getDoc(serverRef), getDoc(channelRef)]);

        if (serverSnap.exists() && channelSnap.exists()) {
            const serverData = serverSnap.data() as Server;
            const channelData = channelSnap.data() as Channel;
            const context = { type: 'channel' as const, serverId, serverName: serverData.name, channelId, channelName: channelData.name };
            contextCache.set(cacheKey, context);
            return context;
        }
    }
    
    return null;
}

async function getSenderProfile(senderId: string): Promise<Partial<UserProfile> | undefined> {
    const cacheKey = `user_${senderId}`;
    if (contextCache.has(cacheKey)) return contextCache.get(cacheKey);

    const userRef = doc(db, 'users', senderId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        const profile = { id: userSnap.id, ...userSnap.data() } as UserProfile;
        contextCache.set(cacheKey, profile);
        return profile;
    }
    return undefined;
}


export function useMentions(enabled: boolean = true) {
  const { authUser } = useAuth();
  const [mentions, setMentions] = useState<MentionWithContext[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authUser || !enabled) {
      setMentions([]);
      setLoading(!enabled);
      return;
    }

    setLoading(true);
    // This is a collection group query. It queries all collections named 'messages'
    // regardless of their location in the hierarchy.
    const messagesRef = collectionGroup(db, 'messages');
    const q = query(
      messagesRef,
      where('mentions', 'array-contains', authUser.uid),
      orderBy('timestamp', 'desc'),
      limit(50) // Limit to the 50 most recent mentions
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const mentionsWithContextPromises = snapshot.docs.map(async (docSnap) => {
        // HACK: We need the full path to get context. `doc.ref.path` provides this.
        const msg = { id: docSnap.ref.path, ...docSnap.data() } as Message;
        const context = await getMessageContext(msg);
        const senderProfile = await getSenderProfile(msg.sender);

        if (!context) return null;

        return {
          ...msg,
          context,
          senderProfile,
        } as MentionWithContext;
      });

      const resolvedMentions = (await Promise.all(mentionsWithContextPromises)).filter(Boolean) as MentionWithContext[];
      setMentions(resolvedMentions);
      setLoading(false);
    }, (error) => {
      console.error("Failed to fetch mentions: ", error);
      // This error often indicates missing composite indexes.
      // The console will have a link to create it in the Firebase console.
      setLoading(false);
    });

    return () => unsubscribe();
  }, [authUser, enabled]);

  return { mentions, loading };
}
