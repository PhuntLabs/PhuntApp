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
        where('from.id', 'in', [fromUser.id, toUserId]),
        where('to', 'in', [fromUser.id, toUserId])
    );
    const existingRequestSnapshot = await getDocs(existingRequestQuery);
    if (!existingRequestSnapshot.empty) {
        const existingRequest = existingRequestSnapshot.docs[0].data();
        if (existingRequest.status === 'pending') {
            throw new Error("A friend request between you and this user already exists.");
        }
        if (existingRequest.status === 'accepted') {
            throw new Error("You are already friends with this user.");
        }
    }


    // 3. Create the friend request
    await addDoc(collection(db, 'friendRequests'), {
      from: fromUser,
      to: toUserId,
      status: 'pending',
      createdAt: serverTimestamp(),
    });
    
    return `Friend request sent to ${toUsername}!`;

  }, [user]);

  const acceptFriendRequest = useCallback(async (requestId: string, fromUser: { id: string, displayName: string }) => {
    if (!user) throw new Error("You must be logged in.");
    
    const requestRef = doc(db, 'friendRequests', requestId);
    
    await updateDoc(requestRef, { status: 'accepted' });

    // The chat creation is now handled by the client that accepted the request
    // This simplifies the logic and avoids potential race conditions with flows.

  }, [user]);

  const declineFriendRequest = useCallback(async (requestId: string) => {
    if (!user) throw new Error("You must be logged in.");
    await updateDoc(doc(db, 'friendRequests', requestId), { status: 'declined' });
  }, [user]);

  return { incomingRequests, sendFriendRequest, acceptFriendRequest, declineFriendRequest };
}
