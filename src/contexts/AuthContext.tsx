import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, deleteUser } from 'firebase/auth';
import { auth, signInWithGoogle, logOut } from '../lib/firebase';
import { doc, getDoc, getDocFromServer, setDoc, updateDoc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useNotification } from './NotificationContext';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

export type UserPersona = 'professional' | 'friendly' | 'bestie' | 'colleague';
export type AgeMode = 'adult' | 'children';

export interface UserProfile {
  uid: string;
  level: number;
  xp: number;
  ageMode: AgeMode;
  persona: UserPersona;
  faceVerified: boolean;
  learningLog: string[];
  learningTime?: string;
  remindersEnabled?: boolean;
  nativeLanguage?: string;
  targetLanguage?: string;
  encryptionEnabled?: boolean;
  biometricsEnabled?: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const { notify } = useNotification();

  useEffect(() => {
    let profileUnsubscribe: (() => void) | undefined;

    const authUnsubscribe = onAuthStateChanged(auth, async (authenticatedUser) => {
      setUser(authenticatedUser);
      
      if (profileUnsubscribe) {
        profileUnsubscribe();
        profileUnsubscribe = undefined;
      }

      if (authenticatedUser) {
        // Real-time Profile Subscription
        const profileRef = doc(db, 'profiles', authenticatedUser.uid);
        profileUnsubscribe = onSnapshot(profileRef, (snap) => {
          if (snap.exists()) {
            setProfile(snap.data() as UserProfile);
          } else {
            // Create profile if it doesn't exist
            const newProfile: UserProfile = {
              uid: authenticatedUser.uid,
              level: 1,
              xp: 0,
              ageMode: 'adult',
              persona: 'friendly',
              faceVerified: false,
              learningLog: [],
              learningTime: '09:00',
              remindersEnabled: false,
              nativeLanguage: 'English',
              targetLanguage: 'Acholi'
            };
            setDoc(profileRef, newProfile);
          }
        }, (err) => {
           handleFirestoreError(err, OperationType.GET, `profiles/${authenticatedUser.uid}`);
        });

        // Check Admin
        const isAdminPath = `admins/${authenticatedUser.uid}`;
        const isBootstrapped = authenticatedUser.email === "donmckenz20@gmail.com";
        if (isBootstrapped) {
          setIsAdmin(true);
          setLoading(false);
        } else {
          try {
            const adminDoc = await getDoc(doc(db, 'admins', authenticatedUser.uid));
            setIsAdmin(adminDoc.exists());
          } catch (error) {
            handleFirestoreError(error, OperationType.GET, isAdminPath);
            setIsAdmin(false);
          } finally {
            setLoading(false);
          }
        }
      } else {
        setProfile(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();

    return () => {
      authUnsubscribe();
      if (profileUnsubscribe) profileUnsubscribe();
    };
  }, []);

  const calculateLevel = (xp: number) => {
    if (xp >= 10000) return 5;
    if (xp >= 4000) return 4;
    if (xp >= 1500) return 3;
    if (xp >= 500) return 2;
    return 1;
  };

  const deleteAccount = async () => {
    if (!user) return;
    const profilePath = `profiles/${user.uid}`;
    try {
      // 1. Delete profile from Firestore
      const profileRef = doc(db, 'profiles', user.uid);
      await deleteDoc(profileRef);
      // 2. Delete Auth account
      await deleteUser(user);
    } catch (error) {
       handleFirestoreError(error, OperationType.DELETE, profilePath);
       throw error;
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) return;
    const profilePath = `profiles/${user.uid}`;
    try {
      let finalUpdates = { ...updates };
      
      if (updates.xp !== undefined) {
        const newLevel = calculateLevel(updates.xp);
        if (newLevel > profile.level) {
          finalUpdates.level = newLevel;
          notify("Level Up!", `Congratulations! You've reached Level ${newLevel}. Your Luo archiving skills are evolving.`, 'success');
        }
      }

      const profileRef = doc(db, 'profiles', user.uid);
      await updateDoc(profileRef, finalUpdates);
      setProfile(prev => prev ? { ...prev, ...finalUpdates } : null);
    } catch (error) {
       handleFirestoreError(error, OperationType.UPDATE, profilePath);
    }
  };

  const signIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Error signing in with Google", error);
    }
  };

  const signOutUser = async () => {
    try {
      await logOut();
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, isAdmin, loading, signIn, signOut: signOutUser, deleteAccount, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
