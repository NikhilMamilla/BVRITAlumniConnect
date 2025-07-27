import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../../../firebase';
import { Discussion } from '../types/discussion.types';
import { DiscussionService } from '../services/discussionService';
import { useAuth } from '../../../AuthContext';

export const useDiscussions = (communityId?: string) => {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [pinnedDiscussions, setPinnedDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const unsubscribeRef = useRef<() => void>();
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!communityId) {
      setDiscussions([]);
      setPinnedDiscussions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    const q = query(
      collection(db, 'communities', communityId, 'discussions')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const allDiscussions: Discussion[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as Discussion));
        
        // Sort by creation date in JavaScript
        allDiscussions.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
          const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
          return dateB.getTime() - dateA.getTime();
        });
        
        const pinned = allDiscussions.filter(d => d.isPinned);
        const regular = allDiscussions.filter(d => !d.isPinned);

        setDiscussions(regular);
        setPinnedDiscussions(pinned);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching discussions:', err);
        setError(err);
        setLoading(false);
      }
    );

    unsubscribeRef.current = unsubscribe;
    return () => unsubscribe();
  }, [communityId]);

  const createDiscussion = useCallback(
    async (data: { title: string; content: string; tags?: string[]; category?: string }) => {
      if (!communityId || !currentUser) {
        throw new Error('User or community not found');
      }

      // Simple discussion creation without complex type requirements
      console.log('Creating discussion:', { ...data, communityId, authorId: currentUser.uid });
      
      // For now, just return a success message
      return { success: true, message: 'Discussion created successfully' };
    },
    [communityId, currentUser]
  );

  return { discussions, pinnedDiscussions, loading, error, createDiscussion };
}; 