// dateHelpers.ts
// Advanced, Firestore-compliant date helpers for the community platform

import { Timestamp } from 'firebase/firestore';

// Convert Firestore Timestamp, string, number, or Date to JS Date
export function toDate(date: Timestamp | Date | string | number | undefined): Date | null {
  if (!date) return null;
  if (typeof date === 'string' || typeof date === 'number') return new Date(date);
  if ((date as Timestamp).toDate) return (date as Timestamp).toDate();
  return date as Date;
}

// Add days to a date
export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// Add months to a date
export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

// Add years to a date
export function addYears(date: Date, years: number): Date {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

// Difference in days between two dates
export function differenceInDays(a: Date, b: Date): number {
  const diff = Math.abs(a.getTime() - b.getTime());
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// Difference in minutes between two dates
export function differenceInMinutes(a: Date, b: Date): number {
  const diff = Math.abs(a.getTime() - b.getTime());
  return Math.floor(diff / (1000 * 60));
}

// Check if a date is today
export function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

// Check if a date is a weekend
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

// Check if a is before b
export function isBefore(a: Date, b: Date): boolean {
  return a.getTime() < b.getTime();
}

// Check if a is after b
export function isAfter(a: Date, b: Date): boolean {
  return a.getTime() > b.getTime();
}

// Format relative time (e.g., '2 hours ago', 'in 3 days')
export function formatRelativeTime(date: Date | Timestamp | string | number): string {
  const d = toDate(date);
  if (!d) return '';
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const absDiff = Math.abs(diff);
  const isPast = diff >= 0;
  const minutes = Math.floor(absDiff / (1000 * 60));
  const hours = Math.floor(absDiff / (1000 * 60 * 60));
  const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return isPast ? `${minutes} min ago` : `in ${minutes} min`;
  if (hours < 24) return isPast ? `${hours} hour${hours !== 1 ? 's' : ''} ago` : `in ${hours} hour${hours !== 1 ? 's' : ''}`;
  return isPast ? `${days} day${days !== 1 ? 's' : ''} ago` : `in ${days} day${days !== 1 ? 's' : ''}`;
}

// Parse ISO string to JS Date
export function parseISODate(iso: string): Date {
  return new Date(iso);
}

export const fiveMinutesAgo = (): Timestamp => {
  return Timestamp.fromMillis(Date.now() - 5 * 60 * 1000);
}; 