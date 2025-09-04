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
  updateDoc,
} from 'firebase/firestore';
import { useAuth } from './use-auth';
import type { FriendRequest } from '@/lib/types';
import { BOT_ID } from '@/ai/bots/config';
import { processBotFriendRequest } from '@/ai/flows/echo-bot-flow';

export function useFriendRequests() {
  const { user, authUser } = useAuth();
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);

  // Listen for incoming friend requests
  useEffect(() => {
    if (!user?.uid) { 
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
    if (!authUser || !fromUser.id || !fromUser.displayName) {
        throw new Error("Authentication details are not loaded yet. Please try again in a moment.");
    }
    if (fromUser.displayName.toLowerCase() === toUsername.toLowerCase()) {
        throw new Error("You cannot send a friend request to yourself.");
    }

    // 1. Find user with the given username
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('displayName_lowercase', '==', toUsername.toLowerCase()));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error(`User with username "${toUsername}" not found.`);
    }
    
    const toUserDoc = querySnapshot.docs[0];
    const toUserId = toUserDoc.id;

    if (fromUser.id === toUserId) {
        throw new Error("You cannot send a friend request to yourself.");
    }

    // 2. Create the friend request. The security rules will handle prevention of duplicates.
    const newRequestRef = await addDoc(collection(db, 'friendRequests'), {
      from: fromUser,
      to: toUserId,
      status: 'pending',
      createdAt: serverTimestamp(),
      // Add a compound members field for easier querying of existing requests
      members: [fromUser.id, toUserId].sort()
    });

    // 3. If the request is to the bot, trigger the auto-accept flow
    if (toUserId === BOT_ID) {
      // Don't await, let it run in the background
      processBotFriendRequest({
        requestId: newRequestRef.id,
        fromId: fromUser.id,
        toId: toUserId,
      });
    }
    
    return `Friend request sent to ${toUsername}!`;

  }, [authUser]);

  const acceptFriendRequest = useCallback(async (requestId: string, fromUser: { id: string, displayName: string }) => {
    if (!authUser) throw new Error("You must be logged in.");
    
    const batch = writeBatch(db);

    // 1. Update request status
    const requestRef = doc(db, 'friendRequests', requestId);
    batch.update(requestRef, { status: 'accepted' });

    // 2. Create a new chat. Security rules should prevent creation if one exists.
    const sortedMembers = [authUser.uid, fromUser.id].sort();
    const newChatRef = doc(collection(db, 'chats'));
    batch.set(newChatRef, {
        members: sortedMembers,
        createdAt: serverTimestamp(),
        lastMessageTimestamp: serverTimestamp()
    });
    
    // 3. Commit all database changes
    try {
        await batch.commit();
    } catch(e: any) {
        console.error("Error committing friend request acceptance batch:", e);
        throw new Error(`Permission denied when updating friend request and creating chat. Original error: ${e.message}`);
    }

  }, [authUser]);

  const declineFriendRequest = useCallback(async (requestId: string) => {
    if (!user) throw new Error("You must be logged in.");
    await updateDoc(doc(db, 'friendRequests', requestId), { status: 'declined' });
  }, [user]);

  return { incomingRequests, sendFriendRequest, acceptFriendRequest, declineFriendRequest };
}
