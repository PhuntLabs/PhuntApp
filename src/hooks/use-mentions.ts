
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc, limit } from 'firebase/firestore';
import { useAuth } from './use-auth';
import type { Mention, UserProfile } from '@/lib/types';

export type MentionWithContext = Mention & {
    senderProfile?: Partial<UserProfile>
};

// Cache to avoid re-fetching the same documents repeatedly
const profileCache = new Map<string, any>();

async function getSenderProfile(senderId: string): Promise<Partial<UserProfile> | undefined> {
    const cacheKey = `user_${senderId}`;
    if (profileCache.has(cacheKey)) return profileCache.get(cacheKey);

    const userRef = doc(db, 'users', senderId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        const profile = { id: userSnap.id, ...userSnap.data() } as UserProfile;
        profileCache.set(cacheKey, profile);
        return profile;
    }
    return undefined;
}


export function useMentions(enabled: boolean = true) {
  const { authUser } = useAuth();
  const [mentions, setMentions] = useState<MentionWithContext[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authUser || !enabled) {
      setMentions([]);
      setLoading(!enabled);
      return;
    }

    setLoading(true);
    // Query the dedicated 'mentions' collection for the current user.
    const mentionsRef = collection(db, 'mentions');
    const q = query(
      mentionsRef,
      where('mentionedUserId', '==', authUser.uid),
      orderBy('timestamp', 'desc'),
      limit(50) // Limit to the 50 most recent mentions
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const mentionsWithProfilesPromises = snapshot.docs.map(async (docSnap) => {
        const mentionData = docSnap.data() as Mention;
        const senderProfile = await getSenderProfile(mentionData.sender);

        return {
          ...mentionData,
          id: docSnap.id,
          senderProfile,
        } as MentionWithContext;
      });

      const resolvedMentions = await Promise.all(mentionsWithProfilesPromises);
      setMentions(resolvedMentions);
      setLoading(false);
    }, (error) => {
      console.error("Failed to fetch mentions: ", error);
      // This error often indicates missing composite indexes.
      // The console will have a link to create it in the Firebase console.
      setLoading(false);
    });

    return () => unsubscribe();
  }, [authUser, enabled]);

  return { mentions, loading };
}
