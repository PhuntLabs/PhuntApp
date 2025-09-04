
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
} from 'firebase/firestore';
import type { Message } from '@/lib/types';
import { useAuth } from './use-auth';

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
      
      const messagePayload = {
        text,
        sender: authUser.uid,
        timestamp: serverTimestamp(),
        edited: false,
      };

      const messagesRef = collection(db, 'servers', serverId, 'channels', channelId, 'messages');
      await addDoc(messagesRef, messagePayload);

      // We could update a `lastMessageTimestamp` on the channel here if needed
    },
    [authUser, serverId, channelId]
  );
  
  const editMessage = useCallback(
    async (messageId: string, newText: string) => {
        if (!serverId || !channelId) return;
        const messageRef = doc(db, 'servers', serverId, 'channels', channelId, 'messages', messageId);
        await updateDoc(messageRef, {
            text: newText,
            edited: true,
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
