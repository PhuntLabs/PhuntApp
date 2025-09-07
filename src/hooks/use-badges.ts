
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import type { Badge } from '@/lib/types';
import * as LucideIcons from 'lucide-react';

const defaultBadges: Badge[] = [
    { id: 'developer', name: 'Developer', icon: 'Code', color: '#8b5cf6' },
    { id: 'bot', name: 'Bot', icon: 'Bot', color: '#6b7280' },
    { id: 'beta tester', name: 'Beta Tester', icon: 'Beaker', color: '#14b8a6' },
    { id: 'youtuber', name: 'Youtuber', icon: 'PlaySquare', color: '#ef4444' },
    { id: 'tiktoker', name: 'Tiktoker', icon: 'Clapperboard', color: '#0891b2' },
    { id: 'goat', name: 'The GOAT', icon: 'Award', color: '#f59e0b' },
    { id: 'early supporter', name: 'Early Supporter', icon: 'HeartHandshake', color: '#ec4899' },
];

export function useBadges() {
  const [badges, setBadges] = useState<Badge[]>(defaultBadges);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const badgesRef = collection(db, 'badges');

    const unsubscribe = onSnapshot(badgesRef, (querySnapshot) => {
      const customBadges: Badge[] = [];
      querySnapshot.forEach((doc) => {
        customBadges.push({ id: doc.id, ...doc.data() } as Badge);
      });
      
      // Combine default and custom, letting custom override default if IDs match
      const combinedBadges = [...defaultBadges];
      const defaultIds = new Set(defaultBadges.map(b => b.id));

      customBadges.forEach(custom => {
          const existingIndex = combinedBadges.findIndex(b => b.id === custom.id);
          if (existingIndex > -1) {
              combinedBadges[existingIndex] = custom; // Override
          } else {
              combinedBadges.push(custom); // Add new
          }
      });

      setBadges(combinedBadges);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching badges:", error);
      // Fallback to default badges on error
      setBadges(defaultBadges);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getBadgeDetails = (badgeId: string): Badge | undefined => {
      return badges.find(b => b.id === badgeId);
  }
  
  const getBadgeIcon = (iconName: string): React.ElementType => {
      return (LucideIcons as any)[iconName] || LucideIcons.HelpCircle;
  }

  return { badges, loading, getBadgeDetails, getBadgeIcon };
}
