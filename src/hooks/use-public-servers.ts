
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import type { Server } from '@/lib/types';

export function usePublicServers() {
  const [publicServers, setPublicServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, 'servers'),
      where('isPublic', '==', true)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const serverDocs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Server));
      setPublicServers(serverDocs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching public servers:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { publicServers, loading };
}
