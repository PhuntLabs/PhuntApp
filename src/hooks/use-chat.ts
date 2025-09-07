
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
  increment,
  writeBatch,
} from 'firebase/firestore';
import type { Message, PopulatedChat, Mention } from '@/lib/types';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';
import { uploadFile } from '@/ai/flows/upload-file-flow';

// Function to convert a File to a base64 string
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });
};

// Function to find mentioned user IDs from message text
async function getMentionedUserIds(text: string): Promise<string[]> {
  const mentionRegex = /@(\w+)/g;
  const mentions = text.match(mentionRegex);
  if (!mentions) return [];

  const usernames = mentions.map(m => m.substring(1).toLowerCase());
  const mentionedUserIds: string[] = [];

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

export function useChat(chat: PopulatedChat | null) {
  const { authUser, user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const { toast } = useToast();
  const chatId = chat?.id;

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
    }, (error) => {
        console.error("Error fetching messages:", error)
    });

    // Clear unread count for the current user when they view the chat
    if (authUser) {
      const chatRef = doc(db, 'chats', chatId);
      const unreadPath = `unreadCount.${authUser.uid}`;
      updateDoc(chatRef, { [unreadPath]: 0 }).catch(console.error);
    }


    return () => unsubscribe();
  }, [chatId, authUser]);

  const sendMessage = useCallback(
    async (text: string, file?: File, replyTo?: Message['replyTo']): Promise<Message | null> => {
      if (!chatId || !authUser || !chat || !user) return null;
      
      let fileInfo: Message['fileInfo'] | undefined = undefined;

      if (file) {
        try {
            const base64Content = await fileToBase64(file);
            const result = await uploadFile({
                fileName: file.name,
                fileType: file.type,
                fileContent: base64Content,
            });
            
            fileInfo = {
                name: result.name,
                size: result.size,
                type: result.type,
                url: result.url,
            };

        } catch (error: any) {
          toast({
            variant: 'destructive',
            title: 'Upload Error',
            description: `Could not upload file: ${error.message}`
          });
          return null;
        }
      }
      
      if (!text && !fileInfo) {
        toast({
            variant: 'destructive',
            title: 'Empty Message',
            description: 'Cannot send an empty message.'
        });
        return null;
      }
      
      const mentionedUserIds = await getMentionedUserIds(text);

      const messagePayload: Omit<Message, 'id' | 'timestamp'> = {
        text,
        sender: authUser.uid,
        edited: false,
        mentions: mentionedUserIds,
      };

      if (fileInfo) messagePayload.fileInfo = fileInfo;
      if (replyTo) messagePayload.replyTo = replyTo;


      const messageDocRef = await addDoc(collection(db, 'chats', chatId, 'messages'), {
          ...messagePayload,
          timestamp: serverTimestamp()
      });
      
      // Update last message and increment unread count for other members
      const chatRef = doc(db, 'chats', chatId);
      const otherMembers = chat.members.filter(m => m.id !== authUser.uid);
      const unreadUpdates: { [key: string]: any } = {};
      otherMembers.forEach(member => {
        if (member.id) {
          unreadUpdates[`unreadCount.${member.id}`] = increment(1);
        }
      });
      
      let lastMessageText = text;
      if (!text && fileInfo) lastMessageText = `Sent a file: ${fileInfo.name}`;

      await updateDoc(chatRef, {
        lastMessageTimestamp: serverTimestamp(),
        lastMessage: {
          text: lastMessageText,
          senderId: authUser.uid
        },
        ...unreadUpdates
      });
      
       // Create mention documents
      if (mentionedUserIds.length > 0) {
        const batch = writeBatch(db);
        const otherMember = chat.members.find(m => m.id !== authUser.uid);
        
        mentionedUserIds.forEach(userId => {
            const mentionRef = doc(collection(db, 'mentions'));
            const mentionPayload: Omit<Mention, 'id'> = {
                mentionedUserId: userId,
                sender: authUser.uid,
                text,
                timestamp: serverTimestamp(),
                context: {
                    type: 'dm',
                    chatId: chatId,
                    chatName: otherMember?.displayName || 'Unknown Chat'
                }
            };
            batch.set(mentionRef, mentionPayload);
        });
        await batch.commit();
      }

      const messageDoc = await getDoc(messageDocRef);
      return { id: messageDoc.id, ...messageDoc.data() } as Message;
    },
    [chat, authUser, user, toast]
  );
  
  const editMessage = useCallback(
    async (messageId: string, newText: string) => {
        if (!chatId) return;
        const mentionedUserIds = await getMentionedUserIds(newText);
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
