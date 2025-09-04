'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
  getDocs,
  writeBatch,
  doc,
  deleteDoc,
  updateDoc,
  getDoc,
} from 'firebase/firestore';
import { useAuth } from './use-auth';
import type { FriendRequest } from '@/lib/types';
import { BOT_ID } from '@/ai/bots/config';
import { processBotFriendRequest } from '@/ai/flows/echo-bot-flow';

export function useFriendRequests() {
  const { user } = useAuth();
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);

  // Listen for incoming friend requests
  useEffect(() => {
    if (!user || !user.uid) { // Add a check for user.uid
        setIncomingRequests([]);
        return;
    }

    const q = query(
      collection(db, 'friendRequests'),
      where('to', '==', user.uid),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const requests = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FriendRequest));
      setIncomingRequests(requests);
    });

    return () => unsubscribe();
  }, [user]);

  const sendFriendRequest = useCallback(async (toUsername: string, fromUser: { id: string, displayName: string }) => {
    if (!user) throw new Error("You must be logged in to send a friend request.");
    if (fromUser.displayName.toLowerCase() === toUsername.toLowerCase()) throw new Error("You cannot send a friend request to yourself.");

    // 1. Find user with the given username
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('displayName_lowercase', '==', toUsername.toLowerCase()));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error(`User with username "${toUsername}" not found.`);
    }
    
    const toUserDoc = querySnapshot.docs[0];
    const toUserId = toUserDoc.id;

    // 2. Check if a request already exists or if they are already friends
    const existingRequestQuery = query(collection(db, 'friendRequests'), 
        where('members', 'array-contains-any', [fromUser.id, toUserId])
    );
    const existingRequestSnapshot = await getDocs(existingRequestQuery);
    const alreadyExists = existingRequestSnapshot.docs.some(doc => {
        const data = doc.data();
        return (data.from.id === fromUser.id && data.to === toUserId) || (data.from.id === toUserId && data.to === fromUser.id)
    });
    
    if (alreadyExists) {
        throw new Error("A friend request has already been sent or you are already friends.");
    }


    // 3. Create the friend request
    const newRequestRef = await addDoc(collection(db, 'friendRequests'), {
      from: fromUser,
      to: toUserId,
      status: 'pending',
      createdAt: serverTimestamp(),
      members: [fromUser.id, toUserId] // For easier querying
    });

    // 4. If the request is to the bot, trigger the auto-accept flow
    if (toUserId === BOT_ID) {
      // Don't await, let it run in the background
      processBotFriendRequest({
        requestId: newRequestRef.id,
        fromId: fromUser.id,
        toId: toUserId,
      });
    }
    
    return `Friend request sent to ${toUsername}!`;

  }, [user]);

  const acceptFriendRequest = useCallback(async (requestId: string, fromUser: { id: string, displayName: string }) => {
    if (!user) throw new Error("You must be logged in.");
    
    const batch = writeBatch(db);

    // Update request status
    const requestRef = doc(db, 'friendRequests', requestId);
    batch.update(requestRef, { status: 'accepted' });

    // Check if chat already exists
    const q = query(collection(db, 'chats'), where('members', 'array-contains', user.uid));
    const querySnapshot = await getDocs(q);
    const existingChat = querySnapshot.docs.find(doc => doc.data().members.includes(fromUser.id));

    if (!existingChat) {
        // Create a new chat
        const newChatRef = doc(collection(db, 'chats'));
        batch.set(newChatRef, {
            members: [user.uid, fromUser.id],
            createdAt: serverTimestamp(),
            lastMessageTimestamp: serverTimestamp()
        });
    }
    
    await batch.commit();

  }, [user]);

  const declineFriendRequest = useCallback(async (requestId: string) => {
    if (!user) throw new Error("You must be logged in.");
    await updateDoc(doc(db, 'friendRequests', requestId), { status: 'declined' });
  }, [user]);

  return { incomingRequests, sendFriendRequest, acceptFriendRequest, declineFriendRequest };
}
