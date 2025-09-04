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
} from 'firebase/firestore';
import { useAuth } from './use-auth';
import type { FriendRequest } from '@/lib/types';

export function useFriendRequests() {
  const { user } = useAuth();
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);

  // Listen for incoming friend requests
  useEffect(() => {
    if (!user) {
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
    if (fromUser.displayName === toUsername) throw new Error("You cannot send a friend request to yourself.");

    // 1. Find user with the given username
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('displayName', '==', toUsername));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error(`User with username "${toUsername}" not found.`);
    }
    
    const toUserDoc = querySnapshot.docs[0];
    const toUserId = toUserDoc.id;

    // 2. Check if a request already exists or if they are already friends
    const existingRequestQuery = query(collection(db, 'friendRequests'), 
        where('from.id', '==', fromUser.id),
        where('to', '==', toUserId)
    );
    const existingRequestSnapshot = await getDocs(existingRequestQuery);
    if (!existingRequestSnapshot.empty) throw new Error("You have already sent a request to this user.");

    const reverseRequestQuery = query(collection(db, 'friendRequests'), 
        where('from.id', '==', toUserId),
        where('to', '==', fromUser.id)
    );
    const reverseRequestSnapshot = await getDocs(reverseRequestQuery);
    if (!reverseRequestSnapshot.empty) throw new Error("This user has already sent you a request.");


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
    const userRef = doc(db, 'users', user.uid);
    const fromUserRef = doc(db, 'users', fromUser.id);
    
    const batch = writeBatch(db);
    
    // Update the request status
    batch.update(requestRef, { status: 'accepted' });
    
    // Add each user to the other's friends list (optional, but good for queries)
    batch.update(userRef, { friends: [...(user.friends || []), fromUser.id] });
    batch.update(fromUserRef, { friends: [...((await getDocs(query(collection(db, 'users'), where('uid', '==', fromUser.id)))).docs[0].data().friends || []), user.uid] });

    await batch.commit();

  }, [user]);

  const declineFriendRequest = useCallback(async (requestId: string) => {
    if (!user) throw new Error("You must be logged in.");
    await updateDoc(doc(db, 'friendRequests', requestId), { status: 'declined' });
  }, [user]);

  return { incomingRequests, sendFriendRequest, acceptFriendRequest, declineFriendRequest };
}
