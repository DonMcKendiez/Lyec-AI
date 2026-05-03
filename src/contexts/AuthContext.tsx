import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithGoogle, logOut } from '../lib/firebase';
import { doc, getDoc, getDocFromServer, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useNotification } from './NotificationContext';

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
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Fetch/Create Profile
        try {
          const profileRef = doc(db, 'profiles', user.uid);
          const profileSnap = await getDoc(profileRef);
          
          if (!profileSnap.exists()) {
            const newProfile: UserProfile = {
              uid: user.uid,
              level: 1,
              xp: 0,
              ageMode: 'adult',
              persona: 'friendly',
              faceVerified: false,
              learningLog: []
            };
            await setDoc(profileRef, newProfile);
            setProfile(newProfile);
          } else {
            setProfile(profileSnap.data() as UserProfile);
          }
        } catch (error) {
          console.error("Error with profile", error);
        }

        // Check Admin
        const isBootstrapped = user.email === "donmckenz20@gmail.com";
        if (isBootstrapped) {
          setIsAdmin(true);
          setLoading(false);
        } else {
          try {
            const adminDoc = await getDoc(doc(db, 'admins', user.uid));
            setIsAdmin(adminDoc.exists());
          } catch (error) {
            console.error("Error checking admin status", error);
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

    return unsubscribe;
  }, []);

  const calculateLevel = (xp: number) => {
    // XP threshold logic: 500, 1500, 4000, 10000...
    if (xp >= 10000) return 5;
    if (xp >= 4000) return 4;
    if (xp >= 1500) return 3;
    if (xp >= 500) return 2;
    return 1;
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) return;
    try {
      let finalUpdates = { ...updates };
      
      // If XP is updated, check for Level Up
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
      console.error("Update profile failed", error);
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
    <AuthContext.Provider value={{ user, profile, isAdmin, loading, signIn, signOut: signOutUser, updateProfile }}>
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
