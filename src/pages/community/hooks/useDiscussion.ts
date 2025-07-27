import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase';
import { Discussion } from '../types/discussion.types';

export const useDiscussion = (discussionId?: string) => {
  const [discussion, setDiscussion] = useState<Discussion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!discussionId) {
      setDiscussion(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const docRef = doc(db, 'discussions', discussionId);
    const unsubscribe = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          setDiscussion({ id: snap.id, ...snap.data() } as Discussion);
        } else {
          setDiscussion(null);
        }
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [discussionId]);

  return { discussion, loading, error };
}; 