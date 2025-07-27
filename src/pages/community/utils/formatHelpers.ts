// formatHelpers.ts
// Advanced, Firestore-compliant format helpers for the community platform

import type { Timestamp } from 'firebase/firestore';

// Format Firestore Timestamp or JS Date to readable string
export function formatDate(
  date: Timestamp | Date | string | number | undefined,
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' },
  locale: string = 'en-US'
): string {
  if (!date) return '';
  let jsDate: Date;
  if (typeof date === 'string' || typeof date === 'number') {
    jsDate = new Date(date);
  } else if ((date as Timestamp).toDate) {
    jsDate = (date as Timestamp).toDate();
  } else {
    jsDate = date as Date;
  }
  return jsDate.toLocaleString(locale, options);
}

// Format file size in human-readable form
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Format number with commas
export function formatNumber(num: number, locale: string = 'en-US'): string {
  return num.toLocaleString(locale);
}

// Format currency
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return amount.toLocaleString(locale, { style: 'currency', currency });
}

// Truncate long strings with ellipsis
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

// Format display name for user/community
export function formatDisplayName(
  name?: string | null,
  fallback: string = 'Unknown'
): string {
  if (!name || name.trim() === '') return fallback;
  return name;
} 