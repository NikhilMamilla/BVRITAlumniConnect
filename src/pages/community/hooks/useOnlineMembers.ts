import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase';
import { CommunityMember } from '../types/community.types';
import { fiveMinutesAgo } from '../utils/dateHelpers';

export const useOnlineMembers = (communityId: string, count: number = 5) => {
  const [onlineMembers, setOnlineMembers] = useState<CommunityMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!communityId) {
      setLoading(false);
      return;
    }

    const membersRef = collection(db, 'communityMembers');
    const q = query(
      membersRef,
      where('communityId', '==', communityId),
      where('status', '==', 'active'),
      where('lastActiveAt', '>=', fiveMinutesAgo()) // Assumes 'lastActiveAt' is updated on user activity
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const members = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CommunityMember));
        
        // Sort by last active time in JavaScript
        members.sort((a, b) => {
          const dateA = a.lastActiveAt?.toDate?.() || new Date(a.lastActiveAt || 0);
          const dateB = b.lastActiveAt?.toDate?.() || new Date(b.lastActiveAt || 0);
          return dateB.getTime() - dateA.getTime();
        });
        
        setOnlineMembers(members.slice(0, count));
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching online members:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [communityId, count]);

  return { onlineMembers, loading };
}; 