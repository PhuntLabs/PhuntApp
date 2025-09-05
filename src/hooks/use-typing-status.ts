
'use client';

import { useCallback } from 'react';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp, deleteField } from 'firebase/firestore';
import { useAuth } from './use-auth';

export function useTypingStatus(chatOrServerId: string, channelId?: string) {
  const { authUser } = useAuth();

  const handleTyping = useCallback((isTyping: boolean) => {
    if (!authUser) return;

    let docRef;
    if (channelId) {
        // It's a server channel
        docRef = doc(db, 'servers', chatOrServerId, 'channels', channelId);
    } else {
        // It's a DM
        docRef = doc(db, 'chats', chatOrServerId);
    }

    const typingPath = `typing.${authUser.uid}`;

    if (isTyping) {
        updateDoc(docRef, { [typingPath]: true }).catch(console.error);
    } else {
        updateDoc(docRef, { [typingPath]: deleteField() }).catch(console.error);
    }

  }, [authUser, chatOrServerId, channelId]);

  return { handleTyping };
}
