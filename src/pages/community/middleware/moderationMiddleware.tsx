// moderationMiddleware.tsx
// Advanced, real-time, Firestore-compliant moderation middleware for community platform

import { db } from '../../../firebase';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import type { Request, Response, NextFunction } from 'express';
import type { ModerationAction, CommunityModerationSettings, ModerationCriteria, UserModerationRecord } from '../types/moderation.types';

interface ModerationMiddlewareOptions {
  actionType: ModerationAction;
  communityId: string;
  userId?: string;
  content?: string;
}

/**
 * Middleware to enforce moderation policies and automate moderation actions.
 * - Checks user restrictions (ban, mute, etc.)
 * - Checks content against moderation rules (banned keywords, spam, etc.)
 * - Logs violations and applies auto-moderation actions if needed
 */
export function moderationMiddleware({ actionType, communityId, userId: optUserId, content }: ModerationMiddlewareOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 1. Get userId (try req.user, req.auth, header, or optUserId)
      let userId: string | undefined = optUserId;
      const rreq = req as Request & { user?: { uid: string }, auth?: { firebaseUser?: { uid: string } } };
      if (!userId && rreq.user && typeof rreq.user.uid === 'string') userId = rreq.user.uid;
      if (!userId && rreq.auth && rreq.auth.firebaseUser && typeof rreq.auth.firebaseUser.uid === 'string') userId = rreq.auth.firebaseUser.uid;
      if (!userId && typeof req.headers['x-user-id'] === 'string') userId = req.headers['x-user-id'];
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated: userId not found on request' });
      }
      // 2. Fetch user moderation record
      const userModRef = doc(db, 'communities', communityId, 'userModerationRecords', userId);
      const userModSnap = await getDoc(userModRef);
      const userMod: UserModerationRecord | null = userModSnap.exists() ? (userModSnap.data() as UserModerationRecord) : null;
      // 3. Fetch community moderation settings
      const settingsRef = doc(db, 'communities', communityId, 'moderationSettings', 'default');
      const settingsSnap = await getDoc(settingsRef);
      const settings: CommunityModerationSettings | null = settingsSnap.exists() ? (settingsSnap.data() as CommunityModerationSettings) : null;
      // 4. Check user restrictions
      if (userMod) {
        if (userMod.isBanned && (!userMod.banExpiry || userMod.banExpiry.toDate() > new Date())) {
          return res.status(403).json({ error: 'User is banned from this community.' });
        }
        if (userMod.isMuted && (!userMod.muteExpiry || userMod.muteExpiry.toDate() > new Date())) {
          return res.status(403).json({ error: 'User is muted in this community.' });
        }
        if (userMod.isRestricted && (!userMod.restrictionExpiry || userMod.restrictionExpiry.toDate() > new Date())) {
          return res.status(403).json({ error: 'User is restricted in this community.' });
        }
      }
      // 5. Content moderation (if content provided)
      if (content && settings) {
        // Check for banned keywords
        const bannedKeywords = settings.contentRules?.bannedKeywords || [];
        for (const keyword of bannedKeywords) {
          if (content.toLowerCase().includes(keyword.toLowerCase())) {
            // Log violation and optionally auto-moderate
            await addDoc(collection(db, 'communities', communityId, 'moderationLogs'), {
              userId,
              action: 'auto_flagged',
              targetType: 'content',
              details: { reason: 'Banned keyword', keyword, content },
              timestamp: serverTimestamp(),
              performedBy: 'auto-moderation',
            });
            // Optionally, auto-mute or restrict user
            // ... (extend as needed)
            return res.status(403).json({ error: `Content contains banned keyword: ${keyword}` });
          }
        }
        // TODO: Add more content moderation checks (spam, length, etc.)
      }
      // 6. All checks passed
      return next();
    } catch (err) {
      return res.status(500).json({ error: 'Moderation check failed', details: (err as Error).message });
    }
  };
} 