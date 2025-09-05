
'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
  where,
  getDocs,
} from 'firebase/firestore';
import type { Message } from '@/lib/types';
import { useAuth } from './use-auth';

// Function to find mentioned user IDs from message text
async function getMentions(text: string): Promise<string[]> {
  const mentionRegex = /@(\w+)/g;
  const mentions = text.match(mentionRegex);
  if (!mentions) return [];

  const usernames = mentions.map(m => m.substring(1));
  const mentionedUserIds: string[] = [];
  
  // Batch queries for usernames to be efficient
  // Firestore `in` query is limited to 10 items per query
  for (let i = 0; i < usernames.length; i += 10) {
    const chunk = usernames.slice(i, i + 10);
    const q = query(collection(db, 'users'), where('displayName_lowercase', 'in', chunk.map(u => u.toLowerCase())));
    const snapshot = await getDocs(q);
    snapshot.forEach(doc => mentionedUserIds.push(doc.id));
  }

  return mentionedUserIds;
}

export function useChannelMessages(serverId: string | undefined, channelId: string | undefined) {
  const { authUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (!serverId || !channelId) {
        setMessages([]);
        return;
    };

    const messagesRef = collection(db, 'servers', serverId, 'channels', channelId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Message));
      setMessages(msgs);
    }, (error) => {
      console.error("Error fetching channel messages: ", error);
      setMessages([]);
    });

    return () => unsubscribe();
  }, [serverId, channelId]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!authUser || !serverId || !channelId) return;

      const mentionedUserIds = await getMentions(text);
      
      const messagePayload = {
        text,
        sender: authUser.uid,
        timestamp: serverTimestamp(),
        edited: false,
        mentions: mentionedUserIds,
      };

      const messagesRef = collection(db, 'servers', serverId, 'channels', channelId, 'messages');
      await addDoc(messagesRef, messagePayload);
    },
    [authUser, serverId, channelId]
  );
  
  const editMessage = useCallback(
    async (messageId: string, newText: string) => {
        if (!serverId || !channelId) return;
        const mentionedUserIds = await getMentions(newText);
        const messageRef = doc(db, 'servers', serverId, 'channels', channelId, 'messages', messageId);
        await updateDoc(messageRef, {
            text: newText,
            edited: true,
            mentions: mentionedUserIds,
        });
    },
    [serverId, channelId]
  );
  
  const deleteMessage = useCallback(
    async (messageId: string) => {
        if (!serverId || !channelId) return;
        const messageRef = doc(db, 'servers', serverId, 'channels', channelId, 'messages', messageId);
        await deleteDoc(messageRef);
    },
    [serverId, channelId]
  );

  return { messages, sendMessage, editMessage, deleteMessage };
}
