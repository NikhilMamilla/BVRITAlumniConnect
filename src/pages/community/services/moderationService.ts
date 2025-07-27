import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  FirestoreError,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '../../../firebase';
import type {
  Report,
  BulkReport,
  Moderator,
  ModeratorAction,
  ModerationLog,
  ModerationAnalytics,
  CommunityModerationSettings,
  RealTimeModerationEvent,
  ReportStatus,
  ModerationAction as ModerationActionType,
  ViolationSeverity,
  ModeratorRole,
  ModeratorPermission
} from '../types/moderation.types';

// Define a type-safe Ban interface for community bans
export interface CommunityBan {
  id: string;
  userId: string;
  communityId: string;
  moderatorId: string;
  reason: string;
  createdAt: Date;
  expiresAt?: Date;
}

export class ModerationService {
  private static instance: ModerationService;
  private readonly REPORTS_COLLECTION = 'moderationReports';
  private readonly ACTIONS_COLLECTION = 'moderationActions';
  private readonly BANS_COLLECTION = 'communityBans';
  private readonly MODERATORS_COLLECTION = 'communityModerators';
  private readonly LOGS_COLLECTION = 'moderationLogs';
  private readonly ANALYTICS_COLLECTION = 'moderationAnalytics';
  private readonly SETTINGS_COLLECTION = 'communityModerationSettings';
  private readonly EVENTS_COLLECTION = 'moderationEvents';

  private constructor() {}
  public static getInstance(): ModerationService {
    if (!ModerationService.instance) {
      ModerationService.instance = new ModerationService();
    }
    return ModerationService.instance;
  }

  // =========================
  // Reports
  // =========================

  async getReports(
    communityId: string,
    status?: ReportStatus,
    limitCount = 20
  ): Promise<Report[]> {
    let q = query(collection(db, this.REPORTS_COLLECTION), where('communityId', '==', communityId));
    if (status) q = query(q, where('status', '==', status));
    q = query(q, orderBy('createdAt', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
  }

  /**
   * Real-time subscription to reports for a community
   */
  subscribeToReports(
    communityId: string,
    callback: (reports: Report[]) => void,
    onError?: (error: FirestoreError) => void,
    status?: ReportStatus
  ): Unsubscribe {
    let q = query(collection(db, this.REPORTS_COLLECTION), where('communityId', '==', communityId));
    if (status) q = query(q, where('status', '==', status));
    q = query(q, orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const reports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
      callback(reports);
    }, onError);
  }

  /**
   * Get a single report by ID
   */
  async getReportById(reportId: string): Promise<Report | null> {
    const ref = doc(db, this.REPORTS_COLLECTION, reportId);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as Report;
  }

  /**
   * Create a new report (must comply with Firestore rules)
   */
  async createReport(data: Omit<Report, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, this.REPORTS_COLLECTION), {
      ...data,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return docRef.id;
  }

  /**
   * Update a report (must comply with Firestore rules)
   */
  async updateReport(reportId: string, updates: Partial<Report>): Promise<void> {
    const ref = doc(db, this.REPORTS_COLLECTION, reportId);
    await updateDoc(ref, { ...updates, updatedAt: new Date() });
  }

  // =========================
  // Moderator Actions (read-only, created by backend/Cloud Functions)
  // =========================

  async getModeratorActions(communityId: string, limitCount = 20): Promise<ModeratorAction[]> {
    let q = query(collection(db, this.ACTIONS_COLLECTION), where('communityId', '==', communityId));
    q = query(q, orderBy('timestamp', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ModeratorAction));
  }

  subscribeToModeratorActions(
    communityId: string,
    callback: (actions: ModeratorAction[]) => void,
    onError?: (error: FirestoreError) => void
  ): Unsubscribe {
    const q = query(collection(db, this.ACTIONS_COLLECTION), where('communityId', '==', communityId), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const actions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ModeratorAction));
      callback(actions);
    }, onError);
  }

  async getModeratorActionById(actionId: string): Promise<ModeratorAction | null> {
    const ref = doc(db, this.ACTIONS_COLLECTION, actionId);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as ModeratorAction;
  }

  // =========================
  // Community Bans
  // =========================

  async getCommunityBans(communityId: string): Promise<CommunityBan[]> {
    const q = query(collection(db, this.BANS_COLLECTION), where('communityId', '==', communityId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CommunityBan));
  }

  async getBanById(banId: string): Promise<CommunityBan | null> {
    const ref = doc(db, this.BANS_COLLECTION, banId);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as CommunityBan;
  }

  async createBan(data: Omit<CommunityBan, 'id' | 'createdAt'> & { durationHours?: number }): Promise<string> {
    // Only allowed for moderators (see Firestore rules)
    const banId = `${data.userId}_${data.communityId}`;
    const ref = doc(db, this.BANS_COLLECTION, banId);
    const createdAt = new Date();
    const expiresAt = data.durationHours ? new Date(Date.now() + data.durationHours * 60 * 60 * 1000) : undefined;
    await updateDoc(ref, {
      ...data,
      createdAt,
      expiresAt
    });
    return banId;
  }

  async removeBan(banId: string): Promise<void> {
    const ref = doc(db, this.BANS_COLLECTION, banId);
    await getDoc(ref); // Ensure the ban exists
    await updateDoc(ref, { expiresAt: new Date() }); // Mark as expired (soft delete)
    // To hard delete, use: await deleteDoc(ref);
  }

  // =========================
  // Moderator Management
  // =========================

  async getModerators(communityId: string): Promise<Moderator[]> {
    const q = query(collection(db, this.MODERATORS_COLLECTION), where('communityId', '==', communityId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Moderator));
  }

  async addModerator(data: Omit<Moderator, 'id' | 'assignedAt'>): Promise<string> {
    // Only allowed for community admins/moderators (see Firestore rules)
    const docRef = await addDoc(collection(db, this.MODERATORS_COLLECTION), {
      ...data,
      assignedAt: new Date(),
      isActive: true
    });
    return docRef.id;
  }

  async removeModerator(moderatorId: string): Promise<void> {
    const ref = doc(db, this.MODERATORS_COLLECTION, moderatorId);
    await getDoc(ref); // Ensure the moderator exists
    await updateDoc(ref, { isActive: false }); // Soft delete (deactivate)
    // To hard delete, use: await deleteDoc(ref);
  }

  // =========================
  // Moderation Logs
  // =========================

  async getModerationLogs(communityId: string, limitCount = 50): Promise<ModerationLog[]> {
    const q = query(collection(db, this.LOGS_COLLECTION), where('communityId', '==', communityId), orderBy('timestamp', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ModerationLog));
  }

  subscribeToModerationLogs(
    communityId: string,
    callback: (logs: ModerationLog[]) => void,
    onError?: (error: FirestoreError) => void
  ): Unsubscribe {
    const q = query(collection(db, this.LOGS_COLLECTION), where('communityId', '==', communityId), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ModerationLog));
      callback(logs);
    }, onError);
  }
}

export const moderationService = ModerationService.getInstance();
