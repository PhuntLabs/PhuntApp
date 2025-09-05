
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
  runTransaction,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import type { Message, Reaction } from '@/lib/types';
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
    const q = query(collection(db, 'users'), where('displayName', 'in', chunk));
    const snapshot = await getDocs(q);
    snapshot.forEach(doc => mentionedUserIds.push(doc.id));
  }

  return mentionedUserIds;
}

export function useChat(chatId: string | undefined) {
  const { authUser } = useAuth();
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
    async (text: string, imageUrl?: string, replyTo?: Message['replyTo']): Promise<Message | null> => {
      if (!chatId || !authUser) return null;
      
      const mentionedUserIds = await getMentions(text);

      const messagePayload: Omit<Message, 'id' | 'timestamp'> = {
        text,
        sender: authUser.uid,
        edited: false,
        mentions: mentionedUserIds,
      };

      if (imageUrl) messagePayload.imageUrl = imageUrl;
      if (replyTo) messagePayload.replyTo = replyTo;


      const messageDocRef = await addDoc(collection(db, 'chats', chatId, 'messages'), {
          ...messagePayload,
          timestamp: serverTimestamp()
      });

      await updateDoc(doc(db, 'chats', chatId), {
        lastMessageTimestamp: serverTimestamp(),
      });
      
      const messageDoc = await getDoc(messageDocRef);
      return { id: messageDoc.id, ...messageDoc.data() } as Message;
    },
    [chatId, authUser]
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

  const toggleReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!authUser || !chatId) return;
  
    const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
  
    try {
      // We need to fetch the document first to know the current state of reactions
      const messageDoc = await getDoc(messageRef);
      if (!messageDoc.exists()) {
        throw new Error("Message does not exist!");
      }
  
      const reactions = (messageDoc.data().reactions || []) as Reaction[];
      const reactionIndex = reactions.findIndex(r => r.emoji === emoji);
      let userHasReacted = false;
  
      if (reactionIndex > -1) {
        userHasReacted = reactions[reactionIndex].users.includes(authUser.uid);
      }
  
      if (userHasReacted) {
        // User is removing their reaction
        const currentReaction = reactions[reactionIndex];
        if (currentReaction.users.length === 1) {
          // If user is the last one, remove the whole reaction object
          await updateDoc(messageRef, {
            reactions: arrayRemove(currentReaction)
          });
        } else {
          // Otherwise, just remove the user's ID
          // This requires removing the old object and adding back the new one
           await updateDoc(messageRef, {
             reactions: arrayRemove(currentReaction)
           });
           await updateDoc(messageRef, {
             reactions: arrayUnion({ ...currentReaction, users: arrayRemove(authUser.uid) })
           });
        }
      } else {
        // User is adding a reaction
        if (reactionIndex > -1) {
          // Reaction object exists, add user to it
          const currentReaction = reactions[reactionIndex];
           await updateDoc(messageRef, {
             reactions: arrayRemove(currentReaction)
           });
           await updateDoc(messageRef, {
            reactions: arrayUnion({ ...currentReaction, users: arrayUnion(authUser.uid) })
           });
        } else {
          // Reaction object doesn't exist, create it
          await updateDoc(messageRef, {
            reactions: arrayUnion({ emoji, users: [authUser.uid] })
          });
        }
      }
    } catch (error) {
      console.error("Failed to toggle reaction:", error);
      // Potentially show a toast to the user
    }
  }, [authUser, chatId]);

  return { messages, sendMessage, editMessage, deleteMessage, toggleReaction };
}
