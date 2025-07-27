// authMiddleware.ts
// Advanced Authentication Context for Community Platform

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
  useRef,
} from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User as FirebaseUser,
  AuthProvider as FirebaseAuthProvider,
} from 'firebase/auth';
import { doc, onSnapshot, collection, query, where, onSnapshot as onCollectionSnapshot } from 'firebase/firestore';
import { auth, googleProvider, db } from '../../../firebase';
import type { DetailedCommunityMember } from '../types/member.types';
import type { UserReference, UserRole } from '../types/common.types';

// ==================== TYPES ====================
export interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  userProfile: UserReference | null;
  memberProfile: DetailedCommunityMember | null;
  loading: boolean;
  error: Error | null;
  login: (provider?: FirebaseAuthProvider) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (role: UserRole) => boolean;
  hasPermission: (permission: string) => boolean;
  refreshUserProfile: () => void;
  refreshMemberProfile: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
  currentCommunityId?: string; // Pass this from CommunityContext or route
}

export const AuthProvider = ({ children, currentCommunityId }: AuthProviderProps) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserReference | null>(null);
  const [memberProfile, setMemberProfile] = useState<DetailedCommunityMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Refs to store unsubscribe functions for cleanup
  const userUnsubRef = useRef<() => void>();
  const memberUnsubRef = useRef<() => void>();

  // Listen to Firebase Auth state
  useEffect(() => {
    setLoading(true);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setError(null);
      if (!user) {
        setUserProfile(null);
        setMemberProfile(null);
        setLoading(false);
        // Cleanup listeners
        userUnsubRef.current?.();
        memberUnsubRef.current?.();
        return;
      }
      // Listen to user profile in Firestore (users collection)
      const userRef = doc(db, 'users', user.uid);
      userUnsubRef.current?.();
      userUnsubRef.current = onSnapshot(userRef, (snap) => {
        if (snap.exists()) {
          setUserProfile({ id: snap.id, ...snap.data() } as UserReference);
        } else {
          setUserProfile(null);
        }
      }, (err) => {
        setError(err);
        setUserProfile(null);
      });
      setLoading(false);
    });
    return () => {
      unsubscribe();
      userUnsubRef.current?.();
      memberUnsubRef.current?.();
    };
  }, []);

  // Listen to member profile for the current community (if available)
  useEffect(() => {
    if (!firebaseUser || !currentCommunityId) {
      setMemberProfile(null);
      memberUnsubRef.current?.();
      return;
    }
    // Listen to member profile in Firestore (communities/{communityId}/members/{userId})
    const memberRef = doc(db, 'communities', currentCommunityId, 'members', firebaseUser.uid);
    memberUnsubRef.current?.();
    memberUnsubRef.current = onSnapshot(memberRef, (snap) => {
      if (snap.exists()) {
        setMemberProfile({ id: snap.id, ...snap.data() } as DetailedCommunityMember);
      } else {
        setMemberProfile(null);
      }
    }, (err) => {
      setError(err);
      setMemberProfile(null);
    });
    return () => {
      memberUnsubRef.current?.();
    };
  }, [firebaseUser, currentCommunityId]);

  // Login with Google or other providers
  const login = useCallback(async (provider?: FirebaseAuthProvider) => {
    setLoading(true);
    try {
      await signInWithPopup(auth, provider || googleProvider);
      setError(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err);
      } else {
        setError(new Error(typeof err === 'string' ? err : JSON.stringify(err)));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setError(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err);
      } else {
        setError(new Error(typeof err === 'string' ? err : JSON.stringify(err)));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Role check
  const hasRole = useCallback((role: UserRole) => {
    return userProfile?.role === role;
  }, [userProfile]);

  // Permission check (for advanced use, e.g., memberProfile)
  const hasPermission = useCallback((permission: string) => {
    if (!memberProfile) return false;
    return memberProfile.permissions?.some(p => p.action === permission && p.granted) ?? false;
  }, [memberProfile]);

  // Manual refresh for user profile
  const refreshUserProfile = useCallback(() => {
    if (firebaseUser) {
      const userRef = doc(db, 'users', firebaseUser.uid);
      onSnapshot(userRef, (snap) => {
        if (snap.exists()) {
          setUserProfile({ id: snap.id, ...snap.data() } as UserReference);
        }
      });
    }
  }, [firebaseUser]);

  // Manual refresh for member profile
  const refreshMemberProfile = useCallback(() => {
    if (firebaseUser && currentCommunityId) {
      const memberRef = doc(db, 'communities', currentCommunityId, 'members', firebaseUser.uid);
      onSnapshot(memberRef, (snap) => {
        if (snap.exists()) {
          setMemberProfile({ id: snap.id, ...snap.data() } as DetailedCommunityMember);
        }
      });
    }
  }, [firebaseUser, currentCommunityId]);

  const value: AuthContextType = {
    firebaseUser,
    userProfile,
    memberProfile,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!firebaseUser,
    hasRole,
    hasPermission,
    refreshUserProfile,
    refreshMemberProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for consuming AuthContext
export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within an AuthProvider');
  return ctx;
} 