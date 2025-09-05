
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';

export function usePublicBots() {
  const [publicBots, setPublicBots] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, 'users'),
      where('isBot', '==', true),
      where('isDiscoverable', '==', true)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const botDocs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
      setPublicBots(botDocs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching public bots:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { publicBots, loading };
}
