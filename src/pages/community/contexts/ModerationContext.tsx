// ModerationContext.tsx
// Placeholder for ModerationContext

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import type {
  Report,
  ModeratorAction,
  Moderator,
  ModerationLog,
  ModerationAnalytics,
  ReportStatus,
  ModerationQueue,
  CommunityModerationSettings
} from '../types/moderation.types';
import type { FirestoreError } from 'firebase/firestore';
import { moderationService } from '../services/moderationService';
import type { CommunityBan } from '../services/moderationService';

export interface ModerationContextType {
  reports: Report[];
  reportsLoading: boolean;
  reportsError: FirestoreError | null;
  actions: ModeratorAction[];
  actionsLoading: boolean;
  actionsError: FirestoreError | null;
  bans: CommunityBan[];
  bansLoading: boolean;
  bansError: FirestoreError | null;
  moderators: Moderator[];
  moderatorsLoading: boolean;
  moderatorsError: FirestoreError | null;
  logs: ModerationLog[];
  logsLoading: boolean;
  logsError: FirestoreError | null;
  fetchBans: () => Promise<void>;
  fetchModerators: () => Promise<void>;
  createReport: (data: Omit<Report, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateReport: (reportId: string, updates: Partial<Report>) => Promise<void>;
  createBan: (data: Omit<CommunityBan, 'id' | 'createdAt'> & { durationHours?: number }) => Promise<string>;
  removeBan: (banId: string) => Promise<void>;
  addModerator: (data: Omit<Moderator, 'id' | 'assignedAt'>) => Promise<string>;
  removeModerator: (moderatorId: string) => Promise<void>;
}

const ModerationContext = createContext<ModerationContextType | undefined>(undefined);

export const ModerationProvider = ({ communityId, children }: { communityId: string; children: ReactNode }) => {
  // Reports
  const [reports, setReports] = useState<Report[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsError, setReportsError] = useState<FirestoreError | null>(null);
  const reportsUnsubRef = useRef<(() => void) | null>(null);

  // Moderator Actions
  const [actions, setActions] = useState<ModeratorAction[]>([]);
  const [actionsLoading, setActionsLoading] = useState(true);
  const [actionsError, setActionsError] = useState<FirestoreError | null>(null);
  const actionsUnsubRef = useRef<(() => void) | null>(null);

  // Bans
  const [bans, setBans] = useState<CommunityBan[]>([]);
  const [bansLoading, setBansLoading] = useState(true);
  const [bansError, setBansError] = useState<FirestoreError | null>(null);

  // Moderators
  const [moderators, setModerators] = useState<Moderator[]>([]);
  const [moderatorsLoading, setModeratorsLoading] = useState(true);
  const [moderatorsError, setModeratorsError] = useState<FirestoreError | null>(null);

  // Moderation Logs
  const [logs, setLogs] = useState<ModerationLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsError, setLogsError] = useState<FirestoreError | null>(null);
  const logsUnsubRef = useRef<(() => void) | null>(null);

  // Real-time subscription to reports
  useEffect(() => {
    setReportsLoading(true);
    setReportsError(null);
    reportsUnsubRef.current?.();
    reportsUnsubRef.current = moderationService.subscribeToReports(
      communityId,
      (reps) => {
        setReports(reps);
        setReportsLoading(false);
      },
      (err) => {
        setReportsError(err);
        setReportsLoading(false);
      }
    );
    return () => {
      reportsUnsubRef.current?.();
    };
  }, [communityId]);

  // Real-time subscription to moderator actions
  useEffect(() => {
    setActionsLoading(true);
    setActionsError(null);
    actionsUnsubRef.current?.();
    actionsUnsubRef.current = moderationService.subscribeToModeratorActions(
      communityId,
      (acts) => {
        setActions(acts);
        setActionsLoading(false);
      },
      (err) => {
        setActionsError(err);
        setActionsLoading(false);
      }
    );
    return () => {
      actionsUnsubRef.current?.();
    };
  }, [communityId]);

  // Real-time subscription to moderation logs
  useEffect(() => {
    setLogsLoading(true);
    setLogsError(null);
    logsUnsubRef.current?.();
    logsUnsubRef.current = moderationService.subscribeToModerationLogs(
      communityId,
      (lgs) => {
        setLogs(lgs);
        setLogsLoading(false);
      },
      (err) => {
        setLogsError(err);
        setLogsLoading(false);
      }
    );
    return () => {
      logsUnsubRef.current?.();
    };
  }, [communityId]);

  // Fetch bans (not real-time)
  const fetchBans = useCallback(async () => {
    setBansLoading(true);
    setBansError(null);
    try {
      const bans = await moderationService.getCommunityBans(communityId);
      setBans(bans);
    } catch (err: unknown) {
      setBansError(err as FirestoreError);
    } finally {
      setBansLoading(false);
    }
  }, [communityId]);

  // Fetch moderators (not real-time)
  const fetchModerators = useCallback(async () => {
    setModeratorsLoading(true);
    setModeratorsError(null);
    try {
      const mods = await moderationService.getModerators(communityId);
      setModerators(mods);
    } catch (err: unknown) {
      setModeratorsError(err as FirestoreError);
    } finally {
      setModeratorsLoading(false);
    }
  }, [communityId]);

  // Moderation actions
  const createReport = useCallback(async (data: Omit<Report, 'id' | 'createdAt' | 'updatedAt'>) => {
    return moderationService.createReport(data);
  }, []);
  const updateReport = useCallback(async (reportId: string, updates: Partial<Report>) => {
    return moderationService.updateReport(reportId, updates);
  }, []);
  const createBan = useCallback(async (data: Omit<CommunityBan, 'id' | 'createdAt'> & { durationHours?: number }) => {
    return moderationService.createBan(data);
  }, []);
  const removeBan = useCallback(async (banId: string) => {
    return moderationService.removeBan(banId);
  }, []);
  const addModerator = useCallback(async (data: Omit<Moderator, 'id' | 'assignedAt'>) => {
    return moderationService.addModerator(data);
  }, []);
  const removeModerator = useCallback(async (moderatorId: string) => {
    return moderationService.removeModerator(moderatorId);
  }, []);

  const value: ModerationContextType = {
    reports,
    reportsLoading,
    reportsError,
    actions,
    actionsLoading,
    actionsError,
    bans,
    bansLoading,
    bansError,
    moderators,
    moderatorsLoading,
    moderatorsError,
    logs,
    logsLoading,
    logsError,
    fetchBans,
    fetchModerators,
    createReport,
    updateReport,
    createBan,
    removeBan,
    addModerator,
    removeModerator
  };

  return (
    <ModerationContext.Provider value={value}>
      {children}
    </ModerationContext.Provider>
  );
};

export function useModerationContext() {
  const ctx = useContext(ModerationContext);
  if (!ctx) throw new Error('useModerationContext must be used within a ModerationProvider');
  return ctx;
} 