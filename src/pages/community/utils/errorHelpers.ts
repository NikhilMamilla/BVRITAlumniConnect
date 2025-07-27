// errorHelpers.ts
// Advanced, Firestore-compliant error helpers for the community platform

import type { FirestoreError } from 'firebase/firestore';
import { ERROR_CODES, ERROR_MESSAGES } from './constants';
import { db } from '../../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { AppError, APIError } from '../types/common.types';

// ==================== TYPE GUARDS ====================

export function isFirestoreError(err: unknown): err is FirestoreError {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    'message' in err &&
    (err as FirestoreError).name === 'FirebaseError'
  );
}

export function isAppError(err: unknown): err is AppError {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    'message' in err &&
    'timestamp' in err
  );
}

export function isAPIError(err: unknown): err is APIError {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    'message' in err
  );
}

// ==================== ERROR EXTRACTION ====================

export function getErrorCode(err: unknown): string {
  if (isFirestoreError(err)) return err.code;
  if (isAppError(err)) return err.code;
  if (isAPIError(err)) return err.code;
  if (err instanceof Error && 'code' in err) return (err as FirestoreError).code;
  return ERROR_CODES.PROCESSING_ERROR;
}

export function getErrorMessage(err: unknown): string {
  if (isFirestoreError(err)) {
    return ERROR_MESSAGES[err.code as keyof typeof ERROR_MESSAGES] || err.message;
  }
  if (isAppError(err)) {
    return err.message;
  }
  if (isAPIError(err)) {
    return err.message;
  }
  if (err instanceof Error) {
    return err.message || ERROR_MESSAGES.PROCESSING_ERROR;
  }
  return ERROR_MESSAGES.PROCESSING_ERROR;
}

// ==================== ERROR RESPONSE BUILDERS ====================

export function buildAPIError(err: unknown, field?: string): APIError {
  return {
    code: getErrorCode(err),
    message: getErrorMessage(err),
    details: err instanceof Error ? err.stack : undefined,
    field,
  };
}

export function buildAppError(err: unknown, userId?: string, context?: Record<string, unknown>): AppError {
  return {
    code: getErrorCode(err),
    message: getErrorMessage(err),
    details: err instanceof Error ? err.stack : undefined,
    timestamp: new Date(),
    userId,
    context,
  };
}

export function buildErrorResponse(err: unknown, status: number = 500) {
  return {
    success: false,
    error: buildAPIError(err),
    status,
  };
}

// ==================== FIRESTORE ERROR LOGGING ====================

/**
 * Log error to Firestore (for moderation/audit/analytics)
 * @param context - Context string (e.g., 'communityService.create', 'chat.sendMessage')
 * @param err - The error object
 * @param userId - Optional user ID
 * @param extra - Additional metadata (e.g., communityId, resourceId, action, analytics)
 */
export async function logErrorToFirestore(
  context: string,
  err: unknown,
  userId?: string,
  extra?: Record<string, unknown>
) {
  try {
    await addDoc(collection(db, 'errorLogs'), {
      context,
      userId: userId || null,
      code: getErrorCode(err),
      message: getErrorMessage(err),
      stack: err instanceof Error ? err.stack : null,
      extra: extra || null,
      timestamp: serverTimestamp(),
    });
  } catch (logErr) {
    // Fallback: log to console if Firestore logging fails
    // eslint-disable-next-line no-console
    console.error('Failed to log error to Firestore:', logErr);
  }
}

// ==================== ERROR ANALYTICS HELPERS ====================

/**
 * Build an error analytics event for dashboards or alerting
 */
export function buildErrorAnalyticsEvent(
  err: unknown,
  context: string,
  userId?: string,
  extra?: Record<string, unknown>
) {
  return {
    eventType: 'error',
    properties: {
      code: getErrorCode(err),
      message: getErrorMessage(err),
      context,
      userId,
      ...extra,
    },
    userId: userId || 'system',
    timestamp: new Date(),
  };
}

/**
 * Aggregate error types for analytics (e.g., for dashboards)
 */
export function aggregateErrorTypes(errors: Array<{ code: string }>): Record<string, number> {
  return errors.reduce((acc, curr) => {
    acc[curr.code] = (acc[curr.code] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

// ==================== ERROR TOAST/NOTIFICATION HELPERS ====================

/**
 * Build a toast notification for an error
 */
export function buildErrorToast(err: unknown, title = 'Error'): { type: 'error'; title: string; message: string } {
  return {
    type: 'error',
    title,
    message: getErrorMessage(err),
  };
} 