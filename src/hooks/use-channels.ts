'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import type { Channel } from '@/lib/types';

export function useChannels(serverId: string | undefined) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!serverId) {
      setChannels([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, 'servers', serverId, 'channels'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const channelDocs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Channel));
      setChannels(channelDocs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching channels:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [serverId]);

  return { channels, loading };
}
