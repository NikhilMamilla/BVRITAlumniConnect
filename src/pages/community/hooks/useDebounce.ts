// useDebounce.ts
// Placeholder for useDebounce hook

import { useState, useEffect } from 'react';

/**
 * useDebounce - Advanced, production-ready debounce hook for any value.
 * @template T - The type of the value to debounce.
 * @param value - The value to debounce.
 * @param delay - The debounce delay in milliseconds (default: 300ms).
 * @returns The debounced value and a setter for the raw value.
 */
export function useDebounce<T>(value: T, delay = 300): [T, (v: T) => void] {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const [rawValue, setRawValue] = useState<T>(value);

  useEffect(() => {
    setRawValue(value);
  }, [value]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(rawValue);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [rawValue, delay]);

  return [debouncedValue, setRawValue];
} 