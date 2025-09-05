
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
  runTransaction,
  arrayUnion,
  arrayRemove,
  getDoc,
} from 'firebase/firestore';
import type { Message, Server, Reaction } from '@/lib/types';
import { useAuth } from './use-auth';
import { usePermissions } from './use-permissions';

// Function to find mentioned user IDs from message text
async function getMentions(text: string, server: Server | null): Promise<string[]> {
  const mentionRegex = /@(\w+)/g;
  const mentions = text.match(mentionRegex);
  if (!mentions) return [];

  const usernames = mentions.map(m => m.substring(1).toLowerCase());
  const mentionedUserIds: string[] = [];

  // Special case for @everyone
  if (usernames.includes('everyone')) {
    return server?.members || [];
  }
  
  // Batch queries for usernames to be efficient
  // Firestore `in` query is limited to 10 items per query
  for (let i = 0; i < usernames.length; i += 10) {
    const chunk = usernames.slice(i, i + 10);
    const q = query(collection(db, 'users'), where('displayName_lowercase', 'in', chunk));
    const snapshot = await getDocs(q);
    snapshot.forEach(doc => mentionedUserIds.push(doc.id));
  }

  return mentionedUserIds;
}

export function useChannelMessages(server: Server | null, channelId: string | undefined) {
  const { authUser } = useAuth();
  const { hasPermission } = usePermissions(server, channelId);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (!server?.id || !channelId) {
        setMessages([]);
        return;
    };

    const messagesRef = collection(db, 'servers', server.id, 'channels', channelId, 'messages');
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
  }, [server?.id, channelId]);

  const sendMessage = useCallback(
    async (text: string, imageUrl?: string, replyTo?: Message['replyTo']) => {
      if (!authUser || !server?.id || !channelId) return;

      if (text.includes('@everyone') && !hasPermission('mentionEveryone')) {
        throw new Error("You don't have permission to mention @everyone.");
      }

      const mentionedUserIds = await getMentions(text, server);
      
      const messagePayload: Omit<Message, 'id' | 'timestamp'> = {
        text,
        sender: authUser.uid,
        edited: false,
        mentions: mentionedUserIds,
      };

      if (imageUrl) messagePayload.imageUrl = imageUrl;
      if (replyTo) messagePayload.replyTo = replyTo;


      const messagesRef = collection(db, 'servers', server.id, 'channels', channelId, 'messages');
      await addDoc(messagesRef, {
        ...messagePayload,
        timestamp: serverTimestamp()
      });
    },
    [authUser, server, channelId, hasPermission]
  );
  
  const editMessage = useCallback(
    async (messageId: string, newText: string) => {
        if (!server?.id || !channelId) return;
        const mentionedUserIds = await getMentions(newText, server);
        const messageRef = doc(db, 'servers', server.id, 'channels', channelId, 'messages', messageId);
        await updateDoc(messageRef, {
            text: newText,
            edited: true,
            mentions: mentionedUserIds,
        });
    },
    [server]
  );
  
  const deleteMessage = useCallback(
    async (messageId: string) => {
        if (!server?.id || !channelId) return;
        const messageRef = doc(db, 'servers', server.id, 'channels', channelId, 'messages', messageId);
        await deleteDoc(messageRef);
    },
    [server?.id, channelId]
  );

  const toggleReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!authUser || !server?.id || !channelId) return;
  
    const messageRef = doc(db, 'servers', server.id, 'channels', channelId, 'messages', messageId);
  
    try {
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
          await updateDoc(messageRef, {
            reactions: arrayRemove(currentReaction),
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
  }, [authUser, server?.id, channelId]);

  return { messages, sendMessage, editMessage, deleteMessage, toggleReaction };
}
