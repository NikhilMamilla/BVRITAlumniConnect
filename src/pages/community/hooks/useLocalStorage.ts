// useLocalStorage.ts
// Placeholder for useLocalStorage hook

import { useState, useEffect } from 'react';

/**
 * useLocalStorage - Advanced, production-ready hook for syncing state with localStorage.
 * @template T - The type of the value to store.
 * @param key - The localStorage key.
 * @param initialValue - The initial value if nothing is in localStorage.
 * @returns The value and a setter for the value.
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      // Intentionally ignore write errors (e.g., storage full, private mode)
    }
  }, [key, value]);

  return [value, setValue];
} 