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
  writeBatch,
  arrayUnion,
} from 'firebase/firestore';
import type { Message, Server, Embed, Mention, Reaction } from '@/lib/types';
import { useAuth } from './use-auth';
import { usePermissions } from './use-permissions';
import { useToast } from './use-toast';

// Function to find mentioned user IDs from message text
async function getMentionedUserIds(text: string, server: Server | null): Promise<string[]> {
  const mentionRegex = /@(\w+)/g;
  const mentions = text.match(mentionRegex);
  if (!mentions) return [];

  const usernames = mentions.map(m => m.substring(1).toLowerCase());
  const mentionedUserIds: string[] = [];

  // Special case for @everyone
  if (usernames.includes('everyone')) {
    // Return all members if @everyone is mentioned
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
  const { authUser, user } = useAuth();
  const { hasPermission } = usePermissions(server, channelId);
  const [messages, setMessages] = useState<Message[]>([]);
  const { toast } = useToast();

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
    async (text: string, file?: File, embedPayload?: Embed | { embed: Embed, reactions?: string[] }, replyTo?: Message['replyTo']) => {
      if (!authUser || !server?.id || !channelId || !user) return;

      if (!hasPermission('sendMessages')) {
        throw new Error("You don't have permission to send messages in this channel.");
      }

      if (text.includes('@everyone') && !hasPermission('mentionEveryone')) {
        throw new Error("You don't have permission to mention @everyone.");
      }
      
      let imageUrl: string | undefined = undefined;
      if (file) {
          const formData = new FormData();
          formData.append('file', file);
          try {
            const response = await fetch('https://file.io', {
              method: 'POST',
              body: formData,
            });
            const result = await response.json();
            if (result.success && result.link) {
              imageUrl = result.link;
            } else {
              throw new Error(result.message || 'File upload failed.');
            }
          } catch (error: any) {
            toast({
              variant: 'destructive',
              title: 'Upload Error',
              description: `Could not upload image: ${error.message}`
            });
            return null;
          }
      }
      
      if (!text && !imageUrl && !embedPayload) {
        toast({
            variant: 'destructive',
            title: 'Empty Message',
            description: 'Cannot send an empty message.'
        });
        return;
      }

      const mentionedUserIds = await getMentionedUserIds(text, server);
      
      const messagePayload: Omit<Message, 'id' | 'timestamp'> = {
        text,
        sender: authUser.uid,
        edited: false,
        mentions: mentionedUserIds,
      };

      if (imageUrl) messagePayload.imageUrl = imageUrl;
      
      let initialReactions: Reaction[] | undefined;
      if (embedPayload) {
        if ('reactions' in embedPayload) {
           messagePayload.embed = { 
                ...embedPayload.embed, 
                footer: embedPayload.embed.footer ? { ...embedPayload.embed.footer, text: embedPayload.embed.footer.text.replace('@user', user.displayName) } : undefined 
            };
            if (embedPayload.reactions) {
                initialReactions = embedPayload.reactions.map(emoji => ({ emoji, users: [] }));
                messagePayload.reactions = initialReactions;
            }
        } else {
             messagePayload.embed = embedPayload;
        }
      }

      if (replyTo) messagePayload.replyTo = replyTo;


      const messagesRef = collection(db, 'servers', server.id, 'channels', channelId, 'messages');
      const messageDocRef = await addDoc(messagesRef, {
        ...messagePayload,
        timestamp: serverTimestamp()
      });
      
      // Create mention documents
      if (mentionedUserIds.length > 0) {
        const batch = writeBatch(db);
        const channel = server.channels?.find(c => c.id === channelId);
        
        mentionedUserIds.forEach(userId => {
            const mentionRef = doc(collection(db, 'mentions'));
            const mentionPayload: Omit<Mention, 'id'> = {
                mentionedUserId: userId,
                sender: authUser.uid,
                text,
                timestamp: serverTimestamp(),
                context: {
                    type: 'channel',
                    serverId: server.id,
                    serverName: server.name,
                    channelId: channelId,
                    channelName: channel?.name || 'unknown-channel'
                }
            };
            batch.set(mentionRef, mentionPayload);
        });
        await batch.commit();
      }

    },
    [authUser, server, channelId, hasPermission, user, toast]
  );
  
  const editMessage = useCallback(
    async (messageId: string, newText: string) => {
        if (!server?.id || !channelId) return;
        const mentionedUserIds = await getMentionedUserIds(newText, server);
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

  return { messages, sendMessage, editMessage, deleteMessage };
}
