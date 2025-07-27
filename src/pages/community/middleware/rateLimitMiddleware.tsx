// rateLimitMiddleware.ts
// Advanced, real-time, Firestore-compliant rate limiting middleware for community platform

import { db } from '../../../firebase';
import { collection, query, where, orderBy, getDocs, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { Request, Response, NextFunction } from 'express';
import type { RateLimitInfo } from '../types/common.types';
import type { ModerationCriteria } from '../types/moderation.types';

// Extend Express Request type to include possible user/auth properties
interface RateLimitRequest extends Request {
  user?: { uid: string };
  auth?: { firebaseUser?: { uid: string } };
}

/**
 * Middleware to enforce rate limits for a given action, user, and community.
 * @param options - { action, communityId, userId, maxActions, timeWindow (minutes) }
 */
export function rateLimitMiddleware({
  action,
  communityId,
  maxActions,
  timeWindow
}: {
  action: string;
  communityId: string;
  maxActions: number;
  timeWindow: number; // in minutes
}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const rreq = req as RateLimitRequest;
      // 1. Get userId (try multiple locations: rreq.user, rreq.auth, req.headers['x-user-id'])
      let userId: string | undefined = undefined;
      if (rreq.user && typeof rreq.user.uid === 'string') {
        userId = rreq.user.uid;
      } else if (rreq.auth && rreq.auth.firebaseUser && typeof rreq.auth.firebaseUser.uid === 'string') {
        userId = rreq.auth.firebaseUser.uid;
      } else if (typeof req.headers['x-user-id'] === 'string') {
        userId = req.headers['x-user-id'];
      }
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated: userId not found on request' });
      }
      // 2. Calculate time window
      const now = Timestamp.now();
      const windowStart = Timestamp.fromMillis(now.toMillis() - timeWindow * 60 * 1000);
      // 3. Query Firestore for recent actions
      const rateLimitRef = collection(db, 'communities', communityId, 'rateLimits');
      const q = query(
        rateLimitRef,
        where('userId', '==', userId),
        where('action', '==', action),
        where('timestamp', '>=', windowStart),
        orderBy('timestamp', 'desc')
      );
      const snapshot = await getDocs(q);
      const count = snapshot.size;
      // 4. If over limit, return 429
      if (count >= maxActions) {
        // Find reset time (oldest action in window + timeWindow)
        const oldest = snapshot.docs[snapshot.size - 1]?.data();
        const resetTime = oldest
          ? new Date(oldest.timestamp.toDate().getTime() + timeWindow * 60 * 1000).toISOString()
          : new Date(now.toDate().getTime() + timeWindow * 60 * 1000).toISOString();
        const rateLimitInfo: RateLimitInfo = {
          limit: maxActions,
          remaining: 0,
          resetTime
        };
        return res.status(429).json({ error: 'Rate limit exceeded', rateLimit: rateLimitInfo });
      }
      // 5. Record this action
      await addDoc(rateLimitRef, {
        userId,
        action,
        timestamp: serverTimestamp(),
        context: req.body?.context || null
      });
      // 6. Add rate limit info to response metadata (optional)
      res.locals.rateLimit = {
        limit: maxActions,
        remaining: Math.max(0, maxActions - count - 1),
        resetTime: null // can be set by downstream handler if needed
      };
      return next();
    } catch (err) {
      return res.status(500).json({ error: 'Rate limit check failed', details: (err as Error).message });
    }
  };
} 