import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  signInWithPopup
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs
} from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase';

// Define user roles
export type UserRole = 'student' | 'alumni' | 'admin';

// Define the authenticated user type with role
export interface AuthUser extends User {
  role?: UserRole;
  isVerified?: boolean;
  profileComplete?: boolean;
}

// Define the context value interface
interface AuthContextType {
  currentUser: AuthUser | null;
  loading: boolean;
  error: string | null;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, role: UserRole) => Promise<void>;
  signInWithGoogle: (role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  resetError: () => void;
  checkUserVerification: () => Promise<boolean>;
  checkProfileCompletion: () => Promise<boolean>;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider props interface
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch additional user info from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            // Extend the user object with additional info
            const enhancedUser: AuthUser = Object.assign(user, {
              role: userData.role,
              isVerified: userData.isVerified || false,
              profileComplete: userData.profileComplete || false
            });
            setCurrentUser(enhancedUser);
          } else {
            // User document doesn't exist, just use the basic user object
            setCurrentUser(user);
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
          setCurrentUser(user);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  // Sign in with email/password
  const signInWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      setError(null);
    } catch (err) {
      if (err instanceof FirebaseError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Sign up with email/password
  const signUpWithEmail = async (email: string, password: string, role: UserRole) => {
    try {
      setLoading(true);
      
      // For students, validate email domain
      if (role === 'student' && !email.endsWith('@bvrit.ac.in')) {
        throw new Error('Student registration requires a valid @bvrit.ac.in email');
      }

      // Create the user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        role: role,
        createdAt: new Date(),
        isVerified: role === 'student', // Students are auto-verified, alumni need verification
        profileComplete: false
      });

      // If student, create student profile document
      if (role === 'student') {
        await setDoc(doc(db, 'students', user.uid), {
          userId: user.uid,
          email: user.email,
          createdAt: new Date()
        });
      } 
      // If alumni, create alumni profile document
      else if (role === 'alumni') {
        await setDoc(doc(db, 'alumni_profiles', user.uid), {
          userId: user.uid,
          email: user.email,
          isVerified: false,
          createdAt: new Date()
        });
      }

      setError(null);
    } catch (err) {
      if (err instanceof FirebaseError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred during sign-up.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Sign in with Google
  const signInWithGoogle = async (role: UserRole) => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if the user already exists
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        // For students, validate email domain
        if (role === 'student' && !user.email?.endsWith('@bvrit.ac.in')) {
          // Sign out the user since they don't have a valid student email
          await auth.signOut();
          throw new Error('Student registration requires a valid @bvrit.ac.in email');
        }

        // Create user document in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          role: role,
          createdAt: new Date(),
          isVerified: role === 'student', // Students are auto-verified, alumni need verification
          profileComplete: false
        });

        // Create role-specific profile
        if (role === 'student') {
          await setDoc(doc(db, 'students', user.uid), {
            userId: user.uid,
            email: user.email,
            createdAt: new Date()
          });
        } else if (role === 'alumni') {
          await setDoc(doc(db, 'alumni_profiles', user.uid), {
            userId: user.uid,
            email: user.email,
            isVerified: false,
            createdAt: new Date()
          });
        }
      }
      
      setError(null);
    } catch (err) {
      if (err instanceof FirebaseError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred during Google sign-in.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const logout = async () => {
    try {
      setLoading(true);
      await signOut(auth);
      setError(null);
    } catch (err) {
      if (err instanceof FirebaseError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred during logout.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Reset error state
  const resetError = () => {
    setError(null);
  };

  // Check if user is verified (for alumni)
  const checkUserVerification = async (): Promise<boolean> => {
    if (!currentUser) return false;
    
    try {
      if (currentUser.role === 'student') return true; // Students are auto-verified
      
      if (currentUser.role === 'alumni') {
        const alumniDoc = await getDoc(doc(db, 'alumni_profiles', currentUser.uid));
        if (alumniDoc.exists()) {
          return alumniDoc.data().isVerified || false;
        }
      }
      
      return false;
    } catch (err) {
      console.error("Error checking verification status:", err);
      return false;
    }
  };

  // Check if user has completed their profile
  const checkProfileCompletion = async (): Promise<boolean> => {
    if (!currentUser) return false;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        return userDoc.data().profileComplete || false;
      }
      return false;
    } catch (err) {
      console.error("Error checking profile completion:", err);
      return false;
    }
  };

  const value: AuthContextType = {
    currentUser,
    loading,
    error,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    logout,
    resetError,
    checkUserVerification,
    checkProfileCompletion
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};