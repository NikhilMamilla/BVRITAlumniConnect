// useInfiniteScroll.ts
// Placeholder for useInfiniteScroll hook

import { useState, useEffect, useCallback, useRef } from 'react';
import type { FirestoreError, QueryDocumentSnapshot } from 'firebase/firestore';

/**
 * useInfiniteScroll - Generic, advanced, real-time Firestore infinite scroll hook.
 * @template T - The type of the Firestore document.
 * @param fetchPage - Function to fetch a page of data (should return { items, lastDoc, hasMore }).
 * @param options - Optional: pageSize, initialQuery, realTimeSubscribe (for real-time updates).
 * @returns Infinite scroll state and actions.
 */
export function useInfiniteScroll<T>(
  fetchPage: (args: { pageSize: number; startAfter?: QueryDocumentSnapshot | null }) => Promise<{ items: T[]; lastDoc: QueryDocumentSnapshot | null; hasMore: boolean }>,
  options?: {
    pageSize?: number;
    realTimeSubscribe?: (callback: (items: T[]) => void, onError?: (error: FirestoreError) => void) => () => void;
  }
) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<FirestoreError | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const pageSize = options?.pageSize || 20;

  // Initial fetch
  useEffect(() => {
    setLoading(true);
    setError(null);
    setItems([]);
    setLastDoc(null);
    setHasMore(true);
    fetchPage({ pageSize })
      .then(({ items, lastDoc, hasMore }) => {
        setItems(items);
        setLastDoc(lastDoc);
        setHasMore(hasMore);
        setLoading(false);
      })
      .catch((err) => {
        if (err && typeof err === 'object' && 'code' in err && 'message' in err) {
          setError(err as FirestoreError);
        } else {
          setError(null);
        }
        setLoading(false);
      });
    // Real-time subscription (if provided)
    if (options?.realTimeSubscribe) {
      unsubscribeRef.current?.();
      unsubscribeRef.current = options.realTimeSubscribe((newItems) => {
        setItems(newItems);
      }, (err) => {
        if (err && typeof err === 'object' && 'code' in err && 'message' in err) {
          setError(err as FirestoreError);
        } else {
          setError(null);
        }
      });
    }
    return () => {
      unsubscribeRef.current?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchPage, pageSize]);

  // Fetch more (pagination)
  const fetchMore = useCallback(async () => {
    if (!hasMore || loading) return;
    setLoading(true);
    setError(null);
    try {
      const { items: newItems, lastDoc: newLastDoc, hasMore: more } = await fetchPage({ pageSize, startAfter: lastDoc });
      setItems((prev) => [...prev, ...newItems]);
      setLastDoc(newLastDoc);
      setHasMore(more);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err && 'message' in err) {
        setError(err as FirestoreError);
      } else {
        setError(null);
      }
      setLoading(false);
    }
  }, [fetchPage, hasMore, loading, lastDoc, pageSize]);

  return {
    items,
    loading,
    error,
    hasMore,
    fetchMore
  };
} 