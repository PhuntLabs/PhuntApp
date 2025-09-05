
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
  getDoc,
  where,
  getDocs,
} from 'firebase/firestore';
import type { Message } from '@/lib/types';

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
    const q = query(collection(db, 'users'), where('displayName', 'in', chunk));
    const snapshot = await getDocs(q);
    snapshot.forEach(doc => mentionedUserIds.push(doc.id));
  }

  return mentionedUserIds;
}

export function useChat(chatId: string | undefined) {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (!chatId) {
        setMessages([]);
        return;
    };

    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Message));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [chatId]);

  const sendMessage = useCallback(
    async (text: string, sender: string): Promise<Message | null> => {
      if (!chatId) return null;
      
      const mentionedUserIds = await getMentions(text);

      const messagePayload = {
        text,
        sender,
        timestamp: serverTimestamp(),
        edited: false,
        mentions: mentionedUserIds,
      };

      const messageDocRef = await addDoc(collection(db, 'chats', chatId, 'messages'), messagePayload);

      await updateDoc(doc(db, 'chats', chatId), {
        lastMessageTimestamp: serverTimestamp(),
      });
      
      const messageDoc = await getDoc(messageDocRef);
      return { id: messageDoc.id, ...messageDoc.data() } as Message;
    },
    [chatId]
  );
  
  const editMessage = useCallback(
    async (messageId: string, newText: string) => {
        if (!chatId) return;
        const mentionedUserIds = await getMentions(newText);
        const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
        await updateDoc(messageRef, {
            text: newText,
            edited: true,
            mentions: mentionedUserIds,
        });
    },
    [chatId]
  );
  
  const deleteMessage = useCallback(
    async (messageId: string) => {
        if (!chatId) return;
        await deleteDoc(doc(db, 'chats', chatId, 'messages', messageId));
    },
    [chatId]
  );

  return { messages, sendMessage, editMessage, deleteMessage };
}
