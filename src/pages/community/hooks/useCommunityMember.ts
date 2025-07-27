import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuth } from '@/AuthContext';
import { CommunityMember } from '../types/community.types';

export const useCommunityMember = (communityId: string) => {
  const { currentUser } = useAuth();
  const [member, setMember] = useState<CommunityMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!currentUser || !communityId) {
      setLoading(false);
      setMember(null);
      return;
    }

    const memberId = `${currentUser.uid}_${communityId}`;
    const docRef = doc(db, 'communityMembers', memberId);

    const unsubscribe = onSnapshot(
      docRef,
      (doc) => {
        if (doc.exists()) {
          setMember({ id: doc.id, ...doc.data() } as CommunityMember);
        } else {
          setMember(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching community membership:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, communityId]);

  return { member, loading, error };
}; 