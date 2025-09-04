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
  DocumentReference,
} from 'firebase/firestore';
import type { Message } from '@/lib/types';

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
      
      const messageDocRef = await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text,
        sender,
        timestamp: serverTimestamp(),
        edited: false,
      });

      await updateDoc(doc(db, 'chats', chatId), {
        lastMessageTimestamp: serverTimestamp(),
      });
      
      return {
        id: messageDocRef.id,
        text,
        sender,
        timestamp: serverTimestamp(),
        edited: false,
      };
    },
    [chatId]
  );
  
  const editMessage = useCallback(
    async (messageId: string, newText: string) => {
        if (!chatId) return;
        const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
        await updateDoc(messageRef, {
            text: newText,
            edited: true,
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
